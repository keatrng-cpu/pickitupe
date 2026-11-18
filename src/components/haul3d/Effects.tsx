import type * as THREE from 'three';
import { Bloom, EffectComposer, GodRays, N8AO, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, KernelSize, ToneMappingMode } from 'postprocessing';

/** HD-only film pipeline: ambient occlusion, window god rays, bloom on the bulb, AgX, vignette, grain. */
export default function Effects({ sun }: { sun: THREE.Mesh | null }) {
  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={0.45} distanceFalloff={0.85} intensity={1.2} quality="performance" halfRes />
      {sun ? <GodRays sun={sun} samples={16} density={0.9} decay={0.92} weight={0.28} exposure={0.28} clampMax={1} kernelSize={KernelSize.SMALL} blur /> : <></>}
      <Bloom mipmapBlur luminanceThreshold={0.85} intensity={0.45} radius={0.6} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.28} darkness={0.28} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.32} />
    </EffectComposer>
  );
}
