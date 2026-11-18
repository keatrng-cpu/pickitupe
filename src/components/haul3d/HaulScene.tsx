import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, MeshReflectorMaterial, Sparkles } from '@react-three/drei';
import { stage } from './stage';
import { Boundary, MODEL_IDS, cssColor, detectHD, modelUrl, seat, useConfiguredGLTF, weather, webgl2, type ModelKey } from './shared';

// Post-processing ships only to the HD tier: phones never download it.
const Effects = lazy(() => import('./Effects'));

/** Pile layout. `sets` = pricebook size indexes (0 bags … 5 two trips) where the item is in the pile. */
interface Item { m: ModelKey; pos: [number, number, number]; rot: [number, number, number]; sets?: number[]; tool?: 'always' | 'gone' }
const ITEMS: Item[] = [
  { m: 'sofa', pos: [0, 0, 0], rot: [0, 0.18, 0], sets: [1, 2, 3, 4, 5] },
  { m: 'cabinet', pos: [-1.65, 0, -0.75], rot: [0, 0.42, 0], sets: [2, 3, 4, 5] },
  { m: 'tv', pos: [-0.85, 0, 0.8], rot: [0, -0.5, 0], sets: [2, 3, 4, 5] },
  { m: 'bag', pos: [1.05, 0, 0.72], rot: [0, 0.3, 0], sets: [0, 3, 4, 5] },
  { m: 'bag', pos: [1.48, 0, 0.18], rot: [0, -0.9, 0], sets: [0, 3, 4, 5] },
  { m: 'bag', pos: [0.5, 0, 1.08], rot: [0, 1.7, 0], sets: [0, 4, 5] },
  { m: 'box', pos: [-0.25, 0, 1.02], rot: [0, 0.25, 0], sets: [0, 3, 4, 5] },
  { m: 'box', pos: [-0.27, 0.34, 1.0], rot: [0, 0.62, 0], sets: [3, 4, 5] },
  { m: 'tyre', pos: [1.32, 0.3, -0.72], rot: [0, 0.4, 0], sets: [4, 5] },
  { m: 'tyre', pos: [1.95, 0.08, -0.15], rot: [Math.PI / 2, 0, 0.3], sets: [4, 5] },
  { m: 'box', pos: [-1.3, 0, 0.2], rot: [0, -0.35, 0], sets: [4, 5] },
  { m: 'box', pos: [-1.28, 0.34, 0.22], rot: [0, 0.1, 0], sets: [5] },
  { m: 'sofa', pos: [0.35, 0, -1.5], rot: [0, -0.25, 0], sets: [5] },
  { m: 'cabinet', pos: [-2.55, 0, 0.45], rot: [0, 1.3, 0], sets: [5] },
  { m: 'bag', pos: [-1.95, 0, 1.05], rot: [0, 2.4, 0], sets: [5] },
  { m: 'dolly', pos: [2.45, 0, 0.95], rot: [0, -0.85, 0], tool: 'always' },
  { m: 'broom', pos: [1.85, 0.12, 1.35], rot: [0, -0.6, 0.22], tool: 'gone' },
];
const PILE_COUNT = (size: number) => ITEMS.filter((i) => i.sets?.includes(size)).length;

/* The room: back wall at z = -3.4 with a high basement window; one bare-bulb shop lamp over the pile. */
const WALL_Z = -3.4;
const WINDOW = { x: -2.1, y: 3.05, w: 1.5, h: 0.7 };
const LAMP = { x: 0.35, y: 3.85, z: 0.45 }; // model hangs 1.34 m below its origin → bulb ≈ y 2.55

const input = { dragging: false, dYaw: 0, vel: 0, lastInteract: 0 };
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = THREE.MathUtils.lerp;

/* Camera keys (story progress p): orbit angle around the pile, radius, height (metres). */
const KEYS = [
  { p: 0.0, ang: 0.62, r: 8.6, h: 3.4 },
  { p: 0.22, ang: 0.08, r: 6.8, h: 2.5 },
  { p: 0.42, ang: -0.55, r: 7.8, h: 3.6 },
  { p: 0.62, ang: -1.05, r: 8.2, h: 3.2 },
  { p: 0.8, ang: 0.35, r: 9.0, h: 4.6 },
  { p: 1.0, ang: 0.5, r: 8.2, h: 4.2 },
];

function Floor({ hd }: { hd: boolean }) {
  const gl = useThree((s) => s.gl);
  const sfx = hd ? '_2k' : '';
  const [diff, rough, nor, ao] = useLoader(THREE.TextureLoader, [
    `/env/floor_diff${sfx}.webp`, `/env/floor_rough${sfx}.webp`, `/env/floor_nor${sfx}.webp`, hd ? '/env/floor_ao_2k.webp' : '/env/floor_ao.webp',
  ]);
  useMemo(() => {
    diff.colorSpace = THREE.SRGBColorSpace;
    const aniso = Math.min(16, gl.capabilities.getMaxAnisotropy());
    for (const t of [diff, rough, nor]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4.5, 4.5); t.anisotropy = aniso; }
    // Anti-tiling: the AO map runs at a different, non-integer scale and offset, so its stains and
    // dark patches break up the repeat of the base maps instead of lining up with it.
    ao.wrapS = ao.wrapT = THREE.RepeatWrapping; ao.repeat.set(1.37, 1.37); ao.offset.set(0.31, 0.17); ao.anisotropy = aniso;
  }, [diff, rough, nor, ao, gl]);

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, -0.2]} receiveShadow>
      <planeGeometry args={[16, 12]} />
      {hd ? (
        // Sealed basement concrete: blurred, roughness-modulated reflections of the pile and the lamp.
        <MeshReflectorMaterial
          map={diff} roughnessMap={rough} normalMap={nor} normalScale={new THREE.Vector2(0.9, 0.9)}
          aoMap={ao} aoMapIntensity={1.1} roughness={1} metalness={0} envMapIntensity={0.5}
          resolution={1024} blur={[420, 140]} mixBlur={1.4} mixStrength={1.6} mixContrast={1.1}
          depthScale={0.9} minDepthThreshold={0.35} maxDepthThreshold={1.3} mirror={0}
        />
      ) : (
        <meshStandardMaterial map={diff} roughnessMap={rough} normalMap={nor} aoMap={ao} aoMapIntensity={1} roughness={1} envMapIntensity={0.55} />
      )}
    </mesh>
  );
}

function Room({ hd, onWindow }: { hd: boolean; onWindow: (m: THREE.Mesh) => void }) {
  const gl = useThree((s) => s.gl);
  const [diff, rough, nor] = useLoader(THREE.TextureLoader, ['/env/wall_diff.webp', '/env/wall_rough.webp', '/env/wall_nor.webp']);
  useMemo(() => {
    diff.colorSpace = THREE.SRGBColorSpace;
    for (const t of [diff, rough, nor]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(7, 2.6); t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy()); }
  }, [diff, rough, nor, gl]);
  const [lamp] = useConfiguredGLTF([modelUrl('lamp', hd)]);
  const lampObj = useMemo(() => {
    const o = lamp.scene.clone(true);
    o.traverse((c) => {
      const mesh = c as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[];
      for (const m of mats) {
        if (m.name.endsWith('_glass')) { m.emissive = new THREE.Color('#ffcf94'); m.emissiveIntensity = 6; m.toneMapped = true; }
        else if (m.emissiveMap) { m.emissive = new THREE.Color('#ffd7a3'); m.emissiveIntensity = 2.5; }
      }
    });
    return o;
  }, [lamp]);

  const windowRef = useRef<THREE.Mesh>(null!);
  useEffect(() => { if (windowRef.current) onWindow(windowRef.current); }, [onWindow]);

  return (
    <>
      {/* Back wall: painted concrete block, with the window cut-out implied by a bright pane. */}
      <mesh position={[0, 2.5, WALL_Z]} receiveShadow>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial map={diff} roughnessMap={rough} normalMap={nor} roughness={0.92} color="#d5d8cf" envMapIntensity={0.85} />
      </mesh>
      <mesh ref={windowRef} position={[WINDOW.x, WINDOW.y, WALL_Z + 0.01]}>
        <planeGeometry args={[WINDOW.w, WINDOW.h]} />
        <meshBasicMaterial color={hd ? '#cfe1ff' : '#8fa6c9'} toneMapped={false} />
      </mesh>
      {/* Window frame mullion */}
      <mesh position={[WINDOW.x, WINDOW.y, WALL_Z + 0.02]}><boxGeometry args={[0.04, WINDOW.h, 0.03]} /><meshStandardMaterial color="#2a2c2a" roughness={0.8} /></mesh>
      <primitive object={lampObj} position={[LAMP.x, LAMP.y, LAMP.z]} />
    </>
  );
}

function Pile({ onReady, hd }: { onReady: () => void; hd: boolean }) {
  const keys = Object.keys(MODEL_IDS).filter((k) => k !== 'lamp') as ModelKey[];
  const gltfs = useConfiguredGLTF(keys.map((k) => modelUrl(k, hd)));

  const nodes = useMemo(() => {
    const byKey = Object.fromEntries(keys.map((k, i) => [k, gltfs[i].scene])) as Record<ModelKey, THREE.Group>;
    return ITEMS.map((it, i) => {
      const obj = byKey[it.m].clone(true);
      obj.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = true; mesh.receiveShadow = true;
        weather(mesh);
        const m = mesh.material as THREE.MeshStandardMaterial;
        if (m.map) { m.map.colorSpace = THREE.SRGBColorSpace; m.map.anisotropy = hd ? 8 : 4; }
      });
      obj.rotation.set(...it.rot);
      obj.position.set(it.pos[0], it.pos[1], it.pos[2]);
      seat(obj, it.pos[1]);
      return { it, obj, a: 0, i, baseY: obj.position.y };
    });
  }, [gltfs, hd]);

  useEffect(() => {
    let b = 0;
    const a = requestAnimationFrame(() => { b = requestAnimationFrame(onReady); });
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); };
  }, [onReady]);

  const pileGroup = useRef<THREE.Group>(null!);
  const st = useRef({ sp: 0, yaw: 0, target: new THREE.Vector3(0, 0.45, 0) });
  const tmp = useMemo(() => ({ c: new THREE.Vector3(), look: new THREE.Vector3() }), []);

  useFrame(({ camera, size, gl }, dt) => {
    const s = st.current;
    const cam = camera as THREE.PerspectiveCamera;
    const reduced = stage.reduced;
    dt = Math.min(dt, 1 / 20);

    const n = nodes.length;
    let wsum = 0, carried = 0;
    tmp.c.set(0, 0, 0);
    for (const node of nodes) {
      const { it, obj } = node;
      const order = (node.i * 7) % n; // carry-out order: shuffled, not left-to-right
      const inPile = !!it.sets?.includes(stage.size);
      const isCarried = inPile && stage.gone > 0.06 + 0.82 * (order / n);
      if (isCarried) carried++;
      const want = it.tool === 'always' ? 1 : it.tool === 'gone' ? (stage.gone > 0.92 ? 1 : 0) : (inPile && !isCarried ? 1 : 0);
      const leaving = want === 0 && stage.gone > 0.02 && !it.tool;
      node.a += (want - node.a) * (1 - Math.exp(-dt * (reduced ? 30 : leaving ? 9 : 6.5)));
      const a = node.a, out = 1 - a;
      obj.visible = a > 0.02;
      obj.position.x = it.pos[0] + (leaving ? smooth(out) * 2.8 : 0);
      obj.position.z = it.pos[2];
      obj.position.y = node.baseY + (leaving ? Math.sin(Math.min(out, 1) * Math.PI) * 0.35 : out * 0.9);
      obj.rotation.set(it.rot[0], it.rot[1], it.rot[2]);
      obj.scale.setScalar(leaving ? smooth(a) : lerp(0.82, 1, smooth(a)));
      // Frame the pile; once it's nearly gone, frame what's left (the tools on the swept floor).
      const w = it.tool ? (stage.gone > 0.7 ? 1.2 : 0.05) * a : a;
      if (w > 0.02) { tmp.c.x += it.pos[0] * w; tmp.c.z += it.pos[2] * w; wsum += w; }
    }
    stage.carried = carried;
    stage.total = PILE_COUNT(stage.size);
    if (wsum > 0) tmp.c.multiplyScalar(1 / wsum);
    s.target.lerp(tmp.c.setY(0.5), 1 - Math.exp(-dt * 2.5));

    const target = reduced ? 0 : stage.progress;
    s.sp += (target - s.sp) * (1 - Math.exp(-dt * 4.5));
    let k = 0;
    while (k < KEYS.length - 2 && s.sp > KEYS[k + 1].p) k++;
    const A = KEYS[k], B = KEYS[k + 1];
    const t = smooth(clamp01((s.sp - A.p) / (B.p - A.p)));
    const aspect = size.width / size.height;
    const fov = aspect < 1 ? 59 : 44;
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    gl.toneMappingExposure = (hd ? 1.22 : 1.12) + stage.gone * 0.32;
    const fit = 1;
    const ang = lerp(A.ang, B.ang, t), r = lerp(A.r, B.r, t) * fit, h = lerp(A.h, B.h, t) * (aspect < 1 ? 1.12 : 1);
    cam.position.set(s.target.x + Math.sin(ang) * r, h, s.target.z + Math.cos(ang) * r);
    cam.lookAt(tmp.look.copy(s.target));

    const hero = reduced ? 1 : 1 - smooth(clamp01(s.sp / 0.14));
    const story = 1 - hero;
    const ox = (aspect < 1 ? 0 : -0.2 * hero + 0.13 * story) * size.width;
    const oy = (aspect < 1 ? 0.33 * hero + 0.2 * story : 0.04 * hero) * size.height;
    cam.setViewOffset(size.width, size.height, ox, oy, size.width, size.height);

    const now = performance.now();
    s.yaw += input.dYaw; input.dYaw = 0;
    if (!input.dragging) {
      s.yaw += input.vel * dt;
      input.vel *= Math.exp(-dt * 3.5);
      if (s.sp < 0.04 && !reduced && now - input.lastInteract > 2500) s.yaw += dt * 0.07;
      if (s.sp > 0.05) { s.yaw = Math.atan2(Math.sin(s.yaw), Math.cos(s.yaw)); s.yaw += -s.yaw * (1 - Math.exp(-dt * 2)); }
    }
    pileGroup.current.rotation.y = s.yaw;
  });

  return (
    <group ref={pileGroup}>
      {nodes.map((n, i) => <primitive key={i} object={n.obj} />)}
    </group>
  );
}

function Lights({ hd }: { hd: boolean }) {
  const lamp = useRef<THREE.SpotLight>(null!);
  const win = useRef<THREE.SpotLight>(null!);
  const wash = useRef<THREE.SpotLight>(null!);
  useEffect(() => {
    wash.current.target.position.set(-0.6, 1.2, WALL_Z); wash.current.target.updateMatrixWorld();
    lamp.current.target.position.set(0, 0, 0.1); lamp.current.target.updateMatrixWorld();
    win.current.target.position.set(0.4, 0, 0.6); win.current.target.updateMatrixWorld();
  }, []);
  const map = hd ? 2048 : 512;
  return (
    <>
      <hemisphereLight args={['#d5e2f2', '#2a2420', 0.55]} />
      <Environment files="/env/garage_1k.hdr" environmentIntensity={0.72} />
      {/* Bare-bulb shop lamp: key light + soft shadow caster, positioned at the lamp model's bulb. */}
      <spotLight ref={lamp} position={[LAMP.x, LAMP.y - 1.3, LAMP.z]} angle={1.05} penumbra={1} intensity={34} decay={2} color="#ffe0b8"
        castShadow shadow-mapSize-width={map} shadow-mapSize-height={map} shadow-bias={-0.00025} shadow-normalBias={0.025} shadow-radius={hd ? 6 : 3}
        shadow-camera-near={0.4} shadow-camera-far={7.5} shadow-camera-fov={46} />
      <pointLight position={[LAMP.x, LAMP.y - 1.45, LAMP.z]} intensity={1.2} distance={3.5} decay={2} color="#ffcf9a" />
      {/* Wall wash: a warm spill grazing the block wall so the room reads as a room, not a void. */}
      <spotLight ref={wash} position={[1.2, 3.4, -1.0]} angle={0.95} penumbra={1} intensity={hd ? 16 : 12} decay={2} color="#ffd9ad" />
      {/* Cool daylight through the basement window: the source of the god rays. */}
      <spotLight ref={win} position={[WINDOW.x, WINDOW.y, WALL_Z + 0.2]} angle={0.55} penumbra={0.85} intensity={hd ? 48 : 32} decay={1.6} color="#d7e6ff" />
    </>
  );
}

/** Phones park the loop once the hero is sitting still, and wake it on scroll. */
function PhoneIdle({ hd, idle, onPark }: { hd: boolean; idle: { current: number }; onPark: () => void }) {
  useFrame((_, dt) => {
    if (hd) return;
    const calm = stage.progress < 0.002 && !input.dragging;
    idle.current = calm ? idle.current + dt : 0;
    if (calm && idle.current > 0.8) onPark();
  });
  return null;
}

export default function HaulScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [loop, setLoop] = useState<'always' | 'demand'>('always');
  const idle = useRef(0);
  const park = useCallback(() => setLoop((cur) => (cur === 'demand' ? cur : 'demand')), []);
  const [ready, setReady] = useState(false);
  const [sun, setSun] = useState<THREE.Mesh | null>(null);
  const markReady = useCallback(() => setReady(true), []);
  const onWindow = useCallback((m: THREE.Mesh) => setSun(m), []);
  const [supported] = useState(webgl2);
  const hd = useMemo(detectHD, []);
  const bg = useMemo(() => cssColor('--bg-stage'), []);

  useEffect(() => {
    if (hd) return;
    const wake = () => { idle.current = 0; setLoop('always'); };
    window.addEventListener('scroll', wake, { passive: true });
    return () => window.removeEventListener('scroll', wake);
  }, [hd]);

  useEffect(() => {
    const el = document.getElementById('stage') ?? wrap.current!;
    const io = new IntersectionObserver(([e]) => { stage.visible = e.isIntersecting; setVisible(e.isIntersecting); });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = wrap.current!;
    // A full-screen canvas that captures the pointer stops iOS Safari from scrolling.
    if (window.matchMedia('(pointer: coarse)').matches) {
      el.style.pointerEvents = 'none';
      return;
    }
    let lastX = 0, lastT = 0;
    const down = (e: PointerEvent) => { input.dragging = true; lastX = e.clientX; lastT = performance.now(); input.vel = 0; input.lastInteract = lastT; el.setPointerCapture(e.pointerId); el.dataset.dragging = 'true'; };
    const move = (e: PointerEvent) => {
      if (!input.dragging) return;
      const now = performance.now(), d = (e.clientX - lastX) * 0.0085;
      input.dYaw += d; input.vel = d / Math.max((now - lastT) / 1000, 1 / 120);
      lastX = e.clientX; lastT = now; input.lastInteract = now;
    };
    const up = (e: PointerEvent) => { input.dragging = false; input.lastInteract = performance.now(); delete el.dataset.dragging; if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId); };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
  }, []);

  const fallback = <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-ink-muted">The 3D view needs WebGL 2, which this browser has turned off.</div>;

  return (
    <div ref={wrap} className="absolute inset-0 cursor-grab touch-pan-y select-none data-[dragging=true]:cursor-grabbing" role="img" aria-label="Photoreal 3D junk pile in a basement — drag sideways to rotate">
      {supported ? (
        <Boundary fallback={fallback}>
          <div className="absolute inset-0 transition-opacity duration-1000 ease-out" style={{ opacity: ready ? 1 : 0 }}>
            <Canvas
              shadows={{ type: THREE.PCFSoftShadowMap }}
              frameloop={visible ? (hd ? 'always' : loop) : 'never'}
              dpr={hd ? [1, 1.5] : 1}
              gl={{ alpha: false, antialias: !hd, powerPreference: 'high-performance', toneMapping: THREE.AgXToneMapping, toneMappingExposure: hd ? 1.28 : 1.18 }}
              camera={{ fov: 44, near: 0.1, far: 80, position: [6, 3.4, 6] }}
            >
              <PhoneIdle hd={hd} idle={idle} onPark={park} />
              <color attach="background" args={[bg]} />
              <fog attach="fog" args={[bg, 11, 22]} />
              <Suspense fallback={null}>
                <Lights hd={hd} />
                <Room hd={hd} onWindow={onWindow} />
                <Floor hd={hd} />
                <ContactShadows position={[0, 0.012, -0.15]} opacity={hd ? 0.42 : 0.34} scale={11} blur={2.2} far={3.2} resolution={hd ? 512 : 256} frames={1} />
                <Pile onReady={markReady} hd={hd} />
                <Sparkles count={hd ? 140 : 45} scale={[7, 3.4, 6]} position={[-0.6, 1.8, -0.6]} size={hd ? 1.8 : 1.4} speed={0.16} opacity={0.45} color="#ffe2bd" noise={0.7} />
                {hd && <Suspense fallback={null}><Effects sun={sun} /></Suspense>}
              </Suspense>
            </Canvas>
          </div>
          {!ready && <div className="pointer-events-none absolute bottom-6 right-6 z-10 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted" aria-live="polite">Loading the basement…</div>}
        </Boundary>
      ) : fallback}
    </div>
  );
}
