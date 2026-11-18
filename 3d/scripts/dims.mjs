import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/core';
import draco3d from 'draco3dgltf';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f); const b = getBounds(doc.getRoot().listScenes()[0]);
  const s = b.max.map((v, i) => (v - b.min[i]).toFixed(2));
  console.log(f.split('/').pop().padEnd(22), 'size xyz', s.join(' x '), ' minY', b.min[1].toFixed(2), ' centerXZ', ((b.max[0]+b.min[0])/2).toFixed(2), ((b.max[2]+b.min[2])/2).toFixed(2));
}
