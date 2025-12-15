
import React, { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment, OrbitControls, PerspectiveCamera, Stars, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { MagicTree } from './MagicTree';
import { TreeMorphState } from '../types';
import { COLORS } from '../constants';

// --- Snow Component ---
const Snow: React.FC = () => {
  const count = 3500; // Increased count for better density over large area
  const mesh = useRef<THREE.Points>(null);
  
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Wider spread for a truly dispersed look
      pos[i * 3] = (Math.random() - 0.5) * 100;     // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 80;  // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;  // z
    }
    return pos;
  });

  useFrame((state, delta) => {
    if (!mesh.current) return;
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    
    // Wind parameters
    const baseWindSpeed = 2.5; 

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const uniqueSeed = i * 0.1; // Random seed per particle

      // Gravity: Slower fall speed for "drifting" feel
      // Vary speed based on particle index to avoid uniform falling sheets
      const fallSpeed = 1.0 + Math.sin(uniqueSeed) * 0.5 + 0.5;
      pos[i3 + 1] -= delta * fallSpeed;

      // Wind & Turbulence Calculation
      // 1. Base directional wind (moving right +X)
      // 2. Large scale turbulence (sine wave based on time and height)
      // 3. Small scale flutter (fast sine wave)
      const turbulence = Math.sin(time * 0.5 + pos[i3+1] * 0.05 + uniqueSeed) * 2.0;
      const flutter = Math.cos(time * 2.0 + uniqueSeed) * 0.5;
      
      const windForceX = baseWindSpeed + turbulence + flutter;
      const windForceZ = Math.sin(time * 0.3 + pos[i3] * 0.02) * 0.5; // Slight Z drift

      pos[i3] += delta * windForceX;
      pos[i3+2] += delta * windForceZ;

      // Boundary Wrapping (Infinite loop)
      const rangeY = 40;
      const rangeX = 50;
      const rangeZ = 40;

      // If fallen below bottom
      if (pos[i3 + 1] < -rangeY) {
        pos[i3 + 1] = rangeY;
        // Re-randomize X/Z slightly so they don't fall in the exact same pattern
        pos[i3] = (Math.random() - 0.5) * (rangeX * 2); 
        pos[i3+2] = (Math.random() - 0.5) * (rangeZ * 2);
      }

      // If blown too far right (Wind direction), wrap to left
      if (pos[i3] > rangeX) {
        pos[i3] = -rangeX;
        // Randomize Y slightly to break lines
        pos[i3+1] = (Math.random() - 0.5) * (rangeY * 2);
      }
      
      // Z Wrapping
      if (pos[i3+2] > rangeZ) pos[i3+2] -= rangeZ * 2;
      if (pos[i3+2] < -rangeZ) pos[i3+2] += rangeZ * 2;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.15} 
        color="#E0F7FA" // Slight icy blue tint
        transparent 
        opacity={0.7} 
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

interface SceneProps {
  treeState: TreeMorphState;
  photos: string[];
}

export const Scene: React.FC<SceneProps> = ({ treeState, photos }) => {
  return (
    <div className="w-full h-full absolute top-0 left-0 bg-gradient-to-b from-[#050202] via-[#0a0f05] to-[#050202]">
      <Canvas
        shadows
        dpr={[1, 2]} 
        gl={{ antialias: false, toneMappingExposure: 1.1 }}
      >
        <PerspectiveCamera makeDefault position={[0, 2, 28]} fov={40} />
        
        <OrbitControls 
            enablePan={false} 
            minPolarAngle={Math.PI / 2.5} 
            maxPolarAngle={Math.PI / 1.8}
            minDistance={15}
            maxDistance={45}
            autoRotate
            autoRotateSpeed={0.3}
        />

        {/* Lighting: Warm and directional to highlight waxy skin */}
        <ambientLight intensity={0.4} color={COLORS.APPLE_GREEN} />
        
        <spotLight 
          position={[15, 25, 15]} 
          angle={0.25} 
          penumbra={1} 
          intensity={1200} 
          color="#FFFBEB" // Warm white sunlight
          castShadow 
          shadow-bias={-0.0001}
        />

        <pointLight position={[-10, 5, -10]} intensity={300} color="#ff8888" /> 
        <pointLight position={[0, -10, 5]} intensity={150} color={COLORS.APPLE_GREEN} />

        <Environment preset="park" blur={1} />

        {/* Atmospheric Snow - Now more dispersed and windy */}
        <Snow />

        <Suspense fallback={null}>
            <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
              <MagicTree state={treeState} photos={photos} />
            </Float>
        </Suspense>
        
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

        <EffectComposer enableNormalPass={false}>
          {/* Subtle bloom for the shiny apples */}
          <Bloom 
            luminanceThreshold={0.7} 
            mipmapBlur 
            intensity={0.8} 
            radius={0.3}
          />
          <Noise opacity={0.04} />
          <Vignette eskil={false} offset={0.1} darkness={1.0} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
