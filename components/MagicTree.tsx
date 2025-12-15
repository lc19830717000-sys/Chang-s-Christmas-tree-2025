
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { TreeMorphState, ParticleData } from '../types';
import { TREE_HEIGHT, TREE_RADIUS_BASE, ANIMATION_SPEED, GREEN_APPLE_COUNT, RED_APPLE_COUNT, PEEL_SEGMENTS, COLORS } from '../constants';

// --- Helpers ---

const getRandomSpherePoint = (radius: number): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

const getConeSpiralPoint = (t: number, maxH: number, maxR: number): { pos: THREE.Vector3, rot: THREE.Euler } => {
  const y = (t * maxH) - (maxH / 2);
  const radiusAtY = ((maxH / 2 - y) / maxH) * maxR * 1.2;
  const angle = t * Math.PI * 30; // Dense packing
  const x = Math.cos(angle) * radiusAtY;
  const z = Math.sin(angle) * radiusAtY;
  
  // Randomize radius slightly for organic "pile of apples" look
  const rRandom = 0.8 + Math.random() * 0.4;
  
  return { 
      pos: new THREE.Vector3(x * rRandom, y, z * rRandom), 
      rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI) 
  };
};

// Calculate a smooth ribbon spiral for the peel
const getPeelSpiralPoint = (t: number, maxH: number, maxR: number): { pos: THREE.Vector3, rot: THREE.Euler } => {
    // t 0..1
    const y = (t * maxH) - (maxH / 2);
    // The peel sits closer to the apples now (reduced multiplier from 1.4 to 1.15)
    const radiusAtY = ((maxH / 2 - y) / maxH) * maxR * 1.15 + 0.5; 
    
    // Fewer rotations than the apple placement to look like a garland
    const angle = t * Math.PI * 12; 
    
    const x = Math.cos(angle) * radiusAtY;
    const z = Math.sin(angle) * radiusAtY;

    // Calculate rotation to align with the curve tangent
    // Tangent approx by looking ahead
    const nextAngle = (t + 0.01) * Math.PI * 12;
    const nextY = ((t + 0.01) * maxH) - (maxH / 2);
    const nextR = ((maxH / 2 - nextY) / maxH) * maxR * 1.15 + 0.5;
    const nextX = Math.cos(nextAngle) * nextR;
    const nextZ = Math.sin(nextAngle) * nextR;
    
    const dummy = new THREE.Object3D();
    dummy.position.set(x, y, z);
    dummy.lookAt(nextX, nextY, nextZ);
    // Rotate so the flat part of the ribbon faces out
    dummy.rotateZ(Math.PI / 2); 
    dummy.rotateY(Math.PI / 2); 

    return { pos: new THREE.Vector3(x, y, z), rot: dummy.rotation };
};

// --- Error Boundary ---
class ImageErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// --- Components ---

interface InstancedApplesProps {
  count: number;
  color: string;
  type: 'green_apple' | 'red_apple' | 'peel';
  targetState: TreeMorphState;
}

const InstancedApples: React.FC<InstancedApplesProps> = ({ count, color, type, targetState }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp: ParticleData[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / count;
      let treePos: THREE.Vector3;
      let treeRot: THREE.Euler;
      let scaleBase = 1;

      if (type === 'peel') {
         const spiral = getPeelSpiralPoint(t, TREE_HEIGHT, TREE_RADIUS_BASE);
         treePos = spiral.pos;
         treeRot = spiral.rot;
         scaleBase = 1; 
      } else {
         // Apples
         // Mix the sorting so red apples aren't just at the top
         const adjustedT = type === 'red_apple' ? Math.random() : t;
         const spiral = getConeSpiralPoint(adjustedT, TREE_HEIGHT, TREE_RADIUS_BASE);
         treePos = spiral.pos;
         treeRot = spiral.rot; // Random rotation for apples
         scaleBase = type === 'red_apple' ? 0.7 : 0.9;
      }

      // Scatter logic
      const scatterPos = getRandomSpherePoint(35);
      const scatterRot = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0);

      temp.push({
        scatterPosition: scatterPos,
        treePosition: treePos,
        treeRotation: treeRot,
        scatterRotation: scatterRot,
        scale: scaleBase * (0.8 + Math.random() * 0.4),
        speed: 0.5 + Math.random() * 1.5,
      });
    }
    return temp;
  }, [count, type]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const isTree = targetState === TreeMorphState.TREE_SHAPE;
    
    particles.forEach((particle, i) => {
      meshRef.current!.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

      const targetPos = isTree ? particle.treePosition : particle.scatterPosition;
      const targetRot = isTree ? particle.treeRotation : particle.scatterRotation;
      
      const alpha = delta * ANIMATION_SPEED * particle.speed;
      
      dummy.position.lerp(targetPos, alpha);
      const targetquat = new THREE.Quaternion().setFromEuler(targetRot);
      dummy.quaternion.slerp(targetquat, alpha);

      if (!isTree) {
         dummy.position.y += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.03;
         dummy.rotation.x += 0.01; // Spin slowly when scattered
      }

      // Apply Scale (Squash for apples)
      if (type === 'peel') {
        // Very Short segments:
        // X scale: 0.2 (Narrow width)
        // Y scale: 0.02 (Thickness)
        // Z scale: 0.5 (Very short length, previously 4.0)
        dummy.scale.set(particle.scale * 0.2, 0.02, particle.scale * 0.5); 
      } else {
        // Squash spheres to look like apples
        dummy.scale.set(particle.scale, particle.scale * 0.85, particle.scale);
      }

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Geometry & Material
  let geometry;
  let material;

  if (type === 'peel') {
    geometry = <boxGeometry args={[1, 1, 1]} />;
    // Changed to Red Apple Peel
    material = (
        <meshPhysicalMaterial 
            color={COLORS.APPLE_RED} 
            emissive={COLORS.APPLE_RED}
            emissiveIntensity={0.15}
            roughness={0.3} 
            metalness={0.1}
            side={THREE.DoubleSide}
            clearcoat={0.5}
            clearcoatRoughness={0.2}
        />
    );
  } else {
    // Apples (Green or Red)
    geometry = <sphereGeometry args={[0.5, 24, 24]} />;
    // Waxy Skin Material
    material = (
        <meshPhysicalMaterial 
            color={color} 
            roughness={0.25} 
            metalness={0.1} 
            clearcoat={0.8}
            clearcoatRoughness={0.1}
            envMapIntensity={1.5}
        />
    );
  }

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      {geometry}
      {material}
    </instancedMesh>
  );
};

// --- Polaroid Photos ---

const PolaroidImage: React.FC<{ url: string }> = ({ url }) => {
    const texture = useTexture(url);
    // Explicitly set encoding if needed, though default is usually auto.
    // texture.colorSpace = THREE.SRGBColorSpace; 
    return (
        <mesh position={[0, 0.15, 0.011]}>
            <planeGeometry args={[1.3, 1.3]} />
            <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
    );
};

const PolaroidItem: React.FC<{ url: string; index: number; count: number; state: TreeMorphState }> = ({ url, index, count, state: treeState }) => {
    const meshRef = useRef<THREE.Group>(null);
    
    // Calculate Positions
    const { treePos, treeRot, scatterPos, scatterRot } = useMemo(() => {
        // 1. Tree Position: Spiral around the cone, but further out than apples
        // Spread photos vertically from bottom to 80% height
        const t = index / count;
        const h = TREE_HEIGHT * 0.8;
        const y = (t * h) - (TREE_HEIGHT / 2) + 2; // Bias slightly upwards
        
        // Radius: slightly larger than base tree radius at this height
        const rBase = ((TREE_HEIGHT / 2 - y) / TREE_HEIGHT) * TREE_RADIUS_BASE * 1.4 + 1.5;
        
        // Angle: Spiral
        const angle = t * Math.PI * 6 + (index * 0.5); // 3 full turns approx
        
        const x = Math.cos(angle) * rBase;
        const z = Math.sin(angle) * rBase;
        const pos = new THREE.Vector3(x, y, z);
        
        // Rotation: Face outward from center, then slight random tilt
        const dummy = new THREE.Object3D();
        dummy.position.copy(pos);
        dummy.lookAt(0, y, 0); // Look at center
        dummy.rotateY(Math.PI); // Turn back to face out
        // Random tilt for "hanging" effect
        dummy.rotateZ((Math.random() - 0.5) * 0.3);
        dummy.rotateX((Math.random() - 0.5) * 0.2);
        const rot = dummy.rotation.clone();

        // 2. Scatter Position
        const sPos = getRandomSpherePoint(40);
        const sRot = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        return { treePos: pos, treeRot: rot, scatterPos: sPos, scatterRot: sRot };
    }, [index, count]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const isTree = treeState === TreeMorphState.TREE_SHAPE;
        
        const targetPos = isTree ? treePos : scatterPos;
        const targetRot = isTree ? treeRot : scatterRot;
        
        // Lerp movement
        const alpha = delta * ANIMATION_SPEED * 0.8; // Photos move slightly slower/weightier
        meshRef.current.position.lerp(targetPos, alpha);
        
        // Slerp rotation
        const currentQ = meshRef.current.quaternion;
        const targetQ = new THREE.Quaternion().setFromEuler(targetRot);
        meshRef.current.quaternion.slerp(targetQ, alpha);
        
        // Wind Sway in Tree Mode
        if (isTree) {
             const time = state.clock.elapsedTime;
             // Gentle sway based on position
             const sway = Math.sin(time * 2 + index) * 0.05;
             meshRef.current.rotation.z += sway * delta; 
        } else {
             // Tumble in void
             meshRef.current.rotation.x += delta * 0.2;
             meshRef.current.rotation.y += delta * 0.1;
        }
    });

    const Fallback = (
        <mesh position={[0, 0.15, 0.011]}>
            <planeGeometry args={[1.3, 1.3]} />
            <meshStandardMaterial color="#333333" roughness={0.8} />
        </mesh>
    );

    return (
        <group ref={meshRef}>
            {/* White Frame */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1.5, 1.8, 0.02]} />
                <meshStandardMaterial color="#ffffff" roughness={0.4} metalness={0.1} />
            </mesh>
            {/* Photo Texture with Error Boundary */}
            <ImageErrorBoundary fallback={Fallback}>
                <React.Suspense fallback={Fallback}>
                     <PolaroidImage url={url} />
                </React.Suspense>
            </ImageErrorBoundary>
        </group>
    );
}

const PhotoCollection: React.FC<{ state: TreeMorphState, photos: string[] }> = ({ state, photos }) => {
    return (
        <group>
            {photos.map((url, i) => (
                <PolaroidItem 
                    key={`${i}-${url.substring(0, 20)}`} // Primitive key strategy
                    url={url} 
                    index={i} 
                    count={photos.length} 
                    state={state} 
                />
            ))}
        </group>
    );
}

// --- Star Topper ---

const StarTopper: React.FC<{ targetState: TreeMorphState }> = ({ targetState }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    
    // Define custom star shape
    const starShape = useMemo(() => {
        const shape = new THREE.Shape();
        const outerRadius = 0.9; // Reduced from 1.2
        const innerRadius = 0.35; // Reduced from 0.4
        const points = 5;
        
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const a = (i / (points * 2)) * Math.PI * 2;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
        return shape;
    }, []);

    const extrudeSettings = useMemo(() => ({ 
        depth: 0.1, 
        bevelEnabled: true, 
        bevelThickness: 0.05, 
        bevelSize: 0.05, 
        bevelSegments: 2 
    }), []);

    // Adjusted vertical position offset
    const treePos = new THREE.Vector3(0, TREE_HEIGHT / 2 + 1.0, 0);
    const scatterPos = new THREE.Vector3(10, 20, -10);

    useFrame((state, delta) => {
        if(!meshRef.current) return;
        
        const isTree = targetState === TreeMorphState.TREE_SHAPE;
        const targetPos = isTree ? treePos : scatterPos;
        
        meshRef.current.position.lerp(targetPos, delta * ANIMATION_SPEED);
        
        // Spin logic
        if (isTree) {
             meshRef.current.rotation.y += delta * 0.5;
             meshRef.current.rotation.z = 0;
             meshRef.current.rotation.x = 0;
        } else {
             meshRef.current.rotation.x += delta;
             meshRef.current.rotation.z += delta;
        }
    });

    return (
        <mesh ref={meshRef} castShadow>
            <extrudeGeometry args={[starShape, extrudeSettings]} />
            <meshStandardMaterial 
                color={COLORS.GOLD_STAR} 
                emissive={COLORS.GOLD_STAR} 
                emissiveIntensity={0.5} 
                metalness={1} 
                roughness={0.1} 
            />
        </mesh>
    )
}

// --- Main Tree Component ---

interface MagicTreeProps {
  state: TreeMorphState;
  photos: string[];
}

export const MagicTree: React.FC<MagicTreeProps> = ({ state, photos }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
        groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
        {/* Main Body: Green Apples */}
        <InstancedApples
            count={GREEN_APPLE_COUNT} 
            color={COLORS.APPLE_GREEN} 
            type="green_apple" 
            targetState={state} 
        />
        
        {/* Ornaments: Red Apples */}
        <InstancedApples
            count={RED_APPLE_COUNT} 
            color={COLORS.APPLE_RED} 
            type="red_apple" 
            targetState={state} 
        />

        {/* Garland: Apple Peel */}
        <InstancedApples
            count={PEEL_SEGMENTS}
            color={COLORS.PEEL_SKIN} // Defines base color, material uses mixed logic
            type="peel"
            targetState={state}
        />
        
        {/* Ornaments: Polaroids */}
        <PhotoCollection state={state} photos={photos} />

        {/* Topper */}
        <StarTopper targetState={state} />
    </group>
  );
};
