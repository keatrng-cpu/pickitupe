import type * as THREE from 'three';
import { Bloom, EffectComposer, GodRays, N8AO, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, KernelSize, ToneMappingMode } from 'postprocessing';

/** HD-only film pipeline: ambient occlusion, window god rays, bloom on the bulb, AgX, vignette, grain. */
export default function Effects({ sun }: { sun: THREE.Mesh | null }) {
  return (
    <EffectComposer multisampling={4}>
      <N8AO aoRadius={0.6} distanceFalloff={0.9} intensity={2.4} quality="medium" halfRes />
      {sun ? <GodRays sun={sun} samples={48} density={0.95} decay={0.93} weight={0.42} exposure={0.32} clampMax={1} kernelSize={KernelSize.SMALL} blur /> : <></>}
      <Bloom mipmapBlur luminanceThreshold={0.85} intensity={0.45} radius={0.6} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.32} darkness={0.55} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.32} />
    </EffectComposer>
  );
}
