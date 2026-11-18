import { Component, type ReactNode } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/* ── Quality tier ─────────────────────────────────────────────────────────────
   HD (desktop, ≥4 cores): 2K photoscans and textures, post-processing in the basement scene.
   SD (phones / low-end): 1K photoscans and textures, no post — still PBR, shadows and real HDRI light. */
export function detectHD() {
  const mobile = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
  return !mobile && (navigator.hardwareConcurrency ?? 4) >= 4;
}

/* Photoscanned CC0 models (Poly Haven), real-world metres. */
export const MODEL_IDS = {
  sofa: 'sofa_02', cabinet: 'drawer_cabinet', tv: 'television_02', bag: 'trashbag',
  box: 'cardboard_box_01', tyre: 'old_tyre', dolly: 'hand_truck', broom: 'wooden_broom', lamp: 'hanging_industrial_lamp',
} as const;
export type ModelKey = keyof typeof MODEL_IDS;
export const modelUrl = (k: ModelKey, hd: boolean) => `/models/${hd ? 'hd/' : ''}${MODEL_IDS[k]}.glb`;

let draco: DRACOLoader | null = null;
export function useConfiguredGLTF(urls: string[]) {
  return useLoader(GLTFLoader, urls, (loader) => {
    draco ??= new DRACOLoader().setDecoderPath('/draco/');
    (loader as GLTFLoader).setDRACOLoader(draco);
  });
}

export function cssColor(name: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx || !raw) return new THREE.Color(0.02, 0.05, 0.03);
  ctx.canvas.width = ctx.canvas.height = 1;
  ctx.fillStyle = raw; ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
}

export const webgl2 = () => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } };

export class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
