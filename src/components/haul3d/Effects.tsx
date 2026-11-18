import type * as THREE from 'three';
import { Bloom, DepthOfField, EffectComposer, GodRays, N8AO, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, KernelSize, ToneMappingMode } from 'postprocessing';

/** HD-only film pipeline: ambient occlusion, window god rays, bloom on the bulb, AgX, vignette, grain. */
export default function Effects({ sun }: { sun: THREE.Mesh | null }) {
  return (
    <EffectComposer multisampling={4}>
      <N8AO aoRadius={0.55} distanceFalloff={0.85} intensity={1.6} quality="medium" halfRes />
      {/* Focus sits at the pulled-back orbit (~7 m). The old 1.5 m focus blurred the whole room into the backdrop once the camera stepped back. */}
      <DepthOfField focusDistance={0.09} focalLength={0.14} bokehScale={0.45} />
      {sun ? <GodRays sun={sun} samples={48} density={0.95} decay={0.93} weight={0.42} exposure={0.32} clampMax={1} kernelSize={KernelSize.SMALL} blur /> : <></>}
      <Bloom mipmapBlur luminanceThreshold={0.85} intensity={0.45} radius={0.6} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.28} darkness={0.28} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.32} />
    </EffectComposer>
  );
}
