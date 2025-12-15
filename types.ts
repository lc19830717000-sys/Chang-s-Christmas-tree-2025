import * as THREE from 'three';

export enum TreeMorphState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export interface ParticleData {
  // The random position in the void
  scatterPosition: THREE.Vector3;
  // The organized position on the cone
  treePosition: THREE.Vector3;
  // Rotation for the tree state
  treeRotation: THREE.Euler;
  // Random rotation for scatter state
  scatterRotation: THREE.Euler;
  // Scale variation
  scale: number;
  // Speed of this specific particle's transition
  speed: number;
}

export interface TreeConfig {
  count: number;
  radius: number;
  height: number;
  color: string;
}