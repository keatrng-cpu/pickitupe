import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { ContactShadows, Environment } from '@react-three/drei';
import { stage } from './stage';
import { Boundary, cssColor, detectHD, modelUrl, seat, useConfiguredGLTF, weather, webgl2, type ModelKey } from './shared';

/* "Loaded": the brand truck (modelled in Blender to match the live site's illustration) on a snowy
   Grand Forks driveway at night. The bed carries whatever size the hero slider is set to, and it rolls in
   as the section scrolls into view. Truck space: +x = front, y up, z = passenger side. */

const BED = 1.02; // crew-cab bed floor (metres), CC0 model in public/models/TRUCK.md
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
function bounce(t: number) {
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
}

/** What rides in the bed for each pricebook size (0 bags … 5 two trips). Real-scale photoscans. */
interface Load { m: ModelKey; pos: [number, number, number]; rot: [number, number, number]; sets: number[] }
const LOAD: Load[] = [
  { m: 'sofa', pos: [-1.3, BED, 0.3], rot: [0, 0, 0], sets: [1, 3, 4, 5] },
  { m: 'cabinet', pos: [-0.38, BED + 0.57, -0.4], rot: [0, 0, Math.PI / 2], sets: [4, 5] },
  { m: 'bag', pos: [-1.95, BED, -0.36], rot: [0, 0.4, 0], sets: [0, 2, 3] },
  { m: 'bag', pos: [-1.4, BED, -0.36], rot: [0, -0.8, 0], sets: [0, 3] },
  { m: 'bag', pos: [-0.8, BED, 0.3], rot: [0, 1.2, 0], sets: [0] },
  { m: 'box', pos: [-0.75, BED, -0.36], rot: [0, 0.2, 0], sets: [2, 3] },
  { m: 'box', pos: [-1.9, BED, 0.3], rot: [0, -0.3, 0], sets: [2] },
  { m: 'tv', pos: [-1.25, BED, 0.28], rot: [0, 0.15, 0], sets: [2] },
  { m: 'bag', pos: [-1.75, BED + 0.42, 0.32], rot: [0, 0.6, 0], sets: [4, 5] },
  { m: 'box', pos: [-0.85, BED + 0.42, 0.32], rot: [0, -0.2, 0], sets: [4, 5] },
  { m: 'tv', pos: [-1.05, BED + 1.14, -0.4], rot: [0, 1.4, 0], sets: [4, 5] },
  { m: 'tyre', pos: [-1.8, BED + 1.14 + 0.083, -0.4], rot: [Math.PI / 2, 0, 0], sets: [4, 5] },
  { m: 'box', pos: [-0.85, BED + 0.42 + 0.335, 0.32], rot: [0, 0.5, 0], sets: [5] },
  { m: 'bag', pos: [-1.75, BED + 0.92, 0.3], rot: [0, 2.1, 0], sets: [5] },
  { m: 'box', pos: [-0.55, BED + 1.14, -0.42], rot: [0, -0.4, 0], sets: [5] },
];

function doorLetter() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, 512, 128);
  g.fillStyle = '#EDE3D0';
  g.font = '600 64px Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('Pick It Up', 256, 64);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map, transparent: true, roughness: 0.45, metalness: 0.05, depthWrite: false });
}

const input = { dragging: false, yaw: 0, vel: 0, last: 0 };
const scroll = { enter: 0, through: 0 };

/* ── Ground: plowed asphalt with packed snow (Poly Haven photoscan), anti-tiled with an off-scale AO ── */
function Driveway({ hd }: { hd: boolean }) {
  const gl = useThree((s) => s.gl);
  const sfx = hd ? '_2k' : '';
  const [diff, rough, nor, ao] = useLoader(THREE.TextureLoader, [`/env/drive_diff${sfx}.webp`, '/env/drive_rough.webp', `/env/drive_nor${sfx}.webp`, '/env/drive_ao.webp']);
  useMemo(() => {
    diff.colorSpace = THREE.SRGBColorSpace;
    const aniso = Math.min(16, gl.capabilities.getMaxAnisotropy());
    for (const t of [diff, rough, nor]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 12); t.anisotropy = aniso; }
    ao.wrapS = ao.wrapT = THREE.RepeatWrapping; ao.repeat.set(3.3, 3.3); ao.offset.set(0.27, 0.61); ao.anisotropy = aniso;
  }, [diff, rough, nor, ao, gl]);
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[48, 48]} />
      <meshStandardMaterial map={diff} roughnessMap={rough} normalMap={nor} normalScale={new THREE.Vector2(1.2, 1.2)} aoMap={ao} aoMapIntensity={1.2} envMapIntensity={0.6} />
    </mesh>
  );
}

/* ── Falling snow: one draw call, GPU-animated, soft round flakes; pauses with the "Pause snow" toggle ── */
const SNOW_VS = /* glsl */ `
  uniform float uTime; uniform float uH; uniform float uSize; uniform float uPR;
  attribute vec3 aRand; varying float vA;
  void main() {
    vec3 p = position;
    float y = mod(p.y - uTime * (0.55 + aRand.x * 0.55), uH);
    p.y = y;
    p.x += sin(uTime * 0.5 + aRand.y * 6.283) * 0.35 + uTime * 0.12;
    p.x = mod(p.x + 10.0, 20.0) - 10.0;
    p.z += cos(uTime * 0.37 + aRand.z * 6.283) * 0.25;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (0.45 + aRand.z) * uPR / -mv.z;
    gl_Position = projectionMatrix * mv;
    vA = smoothstep(0.0, 0.5, y) * smoothstep(uH, uH - 1.5, y) * smoothstep(0.6, 2.0, -mv.z);
  }`;
const SNOW_FS = /* glsl */ `
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.08, d) * vA * 0.9;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vec3(0.96, 0.97, 1.0), a);
  }`;
function Snowfall({ count }: { count: number }) {
  const H = 7.5;
  const dpr = useThree((s) => s.viewport.dpr);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3), r = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 20; p[i * 3 + 1] = Math.random() * H; p[i * 3 + 2] = -7 + Math.random() * 16;
      r[i * 3] = Math.random(); r[i * 3 + 1] = Math.random(); r[i * 3 + 2] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aRand', new THREE.BufferAttribute(r, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, H / 2, 1), 20);
    return g;
  }, [count]);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: SNOW_VS, fragmentShader: SNOW_FS, transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 37 }, uH: { value: H }, uSize: { value: 26 }, uPR: { value: dpr } },
  }), [dpr]);
  useFrame((_, dt) => { if (stage.snow) mat.uniforms.uTime.value += Math.min(dt, 0.05); });
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

function Truck({ hd, onReady }: { hd: boolean; onReady: () => void }) {
  const [truck] = useConfiguredGLTF(['/models/truck.glb']);
  const loadKeys = [...new Set(LOAD.map((l) => l.m))];
  const gltfs = useConfiguredGLTF(loadKeys.map((k) => modelUrl(k, hd)));
  const root = useRef<THREE.Group>(null!);
  const items = useRef<THREE.Object3D[]>([]);
  const anim = useRef(LOAD.map((l) => ({ v: l.sets.includes(stage.size) ? 1 : 0, wait: 0, target: l.sets.includes(stage.size) })));
  const lastSize = useRef(stage.size);

  const body = useMemo(() => {
    const o = truck.scene.clone(true);
    const green = new THREE.Color('#0B4A2A');
    o.traverse((c) => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true; m.receiveShadow = true;
      const mats = (Array.isArray(m.material) ? m.material : [m.material]) as THREE.MeshPhysicalMaterial[];
      for (const mat of mats) {
        const name = (mat.name || '').toLowerCase();
        if (name.includes('paint')) {
          mat.color = green;
          mat.metalness = 0.55;
          mat.roughness = 0.32;
          mat.clearcoat = 0.85;
          mat.clearcoatRoughness = 0.18;
          mat.envMapIntensity = 1.15;
        } else if (name.includes('tire')) {
          mat.roughness = 0.92;
          mat.metalness = 0;
        } else if (name.includes('glass')) {
          mat.envMapIntensity = 1.5;
          mat.transparent = true;
          mat.opacity = 0.45;
        }
        if (name.includes('plate') || name.includes('license')) m.visible = false;
      }
    });
    const letter = doorLetter();
    const left = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.16), letter);
    left.position.set(1.02, 1.08, 0.55);
    left.rotation.y = Math.PI / 2;
    const right = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.16), letter);
    right.position.set(-1.02, 1.08, 0.55);
    right.rotation.y = -Math.PI / 2;
    o.add(left, right);
    return o;
  }, [truck]);
  const cargo = useMemo(() => LOAD.map((l) => {
    const o = gltfs[loadKeys.indexOf(l.m)].scene.clone(true);
    o.rotation.set(...l.rot);
    o.position.set(...l.pos);
    seat(o, l.pos[1]);
    o.userData.base = o.position.y;
    o.traverse((c) => { const m = c as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; weather(m); } });
    return o;
  }), [gltfs]); // eslint-disable-line react-hooks/exhaustive-deps

  const wheels = useRef<THREE.Object3D[]>([]);
  const headL = useRef<THREE.SpotLight>(null!), headR = useRef<THREE.SpotLight>(null!);
  useEffect(() => {
    wheels.current = ['wheel-front-left', 'wheel-front-right', 'wheel-rear-left', 'wheel-rear-right'].map((n) => body.getObjectByName(n)!).filter(Boolean);
    headL.current.target.position.set(9, 0, -1.4); headR.current.target.position.set(9, 0, 1.4);
    root.current.add(headL.current.target, headR.current.target);
    let raf = requestAnimationFrame(() => { raf = requestAnimationFrame(onReady); });
    return () => cancelAnimationFrame(raf);
  }, [onReady]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    // Roll in from off-screen left as the section enters; parked once it is mostly on screen.
    const drive = stage.reduced ? 0 : 1 - easeOutCubic(clamp01(scroll.enter / 0.8));
    const away = stage.reduced ? 0 : smooth(clamp01((scroll.through - 0.62) / 0.38));
    root.current.position.x = -13 * drive + away * 18;
    const spin = (Math.abs(drive - 1) + away) * dt * 7;
    for (const w of wheels.current) w.rotateX(-spin);
    // Drag to turn it; it eases back to the hero angle a couple of seconds after you let go.
    if (!input.dragging) {
      input.yaw += input.vel * dt; input.vel *= Math.pow(0.04, dt);
      if (performance.now() - input.last > 2200) input.yaw *= Math.pow(0.25, dt);
    }
    root.current.rotation.y = input.yaw;

    // Cargo follows the slider: new items drop into the bed, removed ones lift out.
    if (stage.size !== lastSize.current) {
      lastSize.current = stage.size;
      let k = 0;
      anim.current.forEach((a, i) => {
        const t = LOAD[i].sets.includes(stage.size);
        if (t !== a.target) { a.target = t; a.wait = t ? 0.12 * k++ : 0; }
      });
    }
    anim.current.forEach((a, i) => {
      const o = items.current[i];
      if (!o) return;
      if (stage.reduced) a.v = a.target ? 1 : 0;
      else if (a.wait > 0) a.wait -= dt;
      else a.v = clamp01(a.v + (a.target ? 1.6 : -2.8) * dt);
      o.visible = a.v > 0.001;
      const [x, , z] = LOAD[i].pos;
      const base = (o.userData.base as number) ?? LOAD[i].pos[1];
      o.rotation.set(LOAD[i].rot[0], LOAD[i].rot[1], LOAD[i].rot[2] + (a.target ? 0 : (1 - a.v) * 0.2));
      o.position.set(x, base + (a.target ? (1 - bounce(a.v)) * 1.15 : (1 - a.v) * 0.45), z);
      o.scale.setScalar(a.target ? 1 : smooth(a.v));
    });
  });

  return (
    <group ref={root}>
      <group rotation-y={-Math.PI / 2}>
        <primitive object={body} />
      </group>
      {cargo.map((o, i) => (
        <primitive key={i} object={o} ref={(el: THREE.Object3D | null) => { if (el) items.current[i] = el; }} />
      ))}
      {/* Headlamps throw real light down the driveway through the snowfall. */}
      <spotLight ref={headL} position={[2.25, 0.75, -0.77]} angle={0.42} penumbra={0.55} intensity={hd ? 38 : 30} distance={22} decay={1.3} color="#fff0cf" />
      <spotLight ref={headR} position={[2.25, 0.75, 0.77]} angle={0.42} penumbra={0.55} intensity={hd ? 38 : 30} distance={22} decay={1.3} color="#fff0cf" />
      <pointLight position={[-2.42, 0.92, 0]} intensity={0.6} distance={2.2} decay={2} color="#ff3b22" />
    </group>
  );
}

function Rig() {
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const target = useMemo(() => new THREE.Vector3(-0.3, 0.95, 0), []);
  useFrame(() => {
    const portrait = size.width < size.height;
    const ang = THREE.MathUtils.lerp(1.0, 0.42, smooth(clamp01(scroll.through)));
    const r = portrait ? 13.5 : 10.4, h = portrait ? 3.0 : 2.4;
    cam.fov = portrait ? 46 : 32;
    cam.position.set(target.x + Math.sin(ang) * r, h, target.z + Math.cos(ang) * r);
    cam.lookAt(target);
    const w = size.width, hh = size.height;
    // Leave room for the copy: truck sits right on desktop, upper half on phones.
    if (portrait) cam.setViewOffset(w, hh, 0, hh * 0.2, w, hh);
    else cam.setViewOffset(w, hh, -w * 0.17, hh * 0.04, w, hh);
    cam.updateProjectionMatrix();
  });
  return null;
}

function Lights({ hd }: { hd: boolean }) {
  const flood = useRef<THREE.SpotLight>(null!);
  useEffect(() => { flood.current.target.position.set(-0.6, 0, 0.2); flood.current.target.updateMatrixWorld(); }, []);
  const map = hd ? 1024 : 512;
  return (
    <>
      <Environment files="/env/garage_1k.hdr" environmentIntensity={0.24} />
      <hemisphereLight args={['#5d7590', '#141a17', 0.45]} />
      {/* Moonlight: cool, low, long soft shadows on the snow. */}
      <directionalLight position={[-6, 8, -5]} intensity={0.9} color="#b9cbe9" castShadow
        shadow-mapSize-width={map} shadow-mapSize-height={map} shadow-bias={-0.0004} shadow-normalBias={0.03}
        shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-camera-far={30} />
      {/* Garage floodlight over the driveway: the warm key that makes the cream paint and chrome read. */}
      <spotLight ref={flood} position={[-2.5, 5.8, 5]} angle={0.72} penumbra={0.95} intensity={hd ? 80 : 64} decay={1.7} distance={32} color="#ffe2c2"
        castShadow={hd} shadow-mapSize-width={map} shadow-mapSize-height={map} shadow-bias={-0.0003} shadow-normalBias={0.02} />
    </>
  );
}

export default function TruckWorld() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [supported] = useState(webgl2);
  const hd = useMemo(detectHD, []);
  const bg = useMemo(() => cssColor('--bg-stage'), []);
  const onReady = useMemo(() => () => setReady(true), []);

  useEffect(() => {
    const section = document.getElementById('truck') ?? wrap.current!;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(section);
    const update = () => {
      const r = section.getBoundingClientRect(), vh = innerHeight;
      scroll.enter = clamp01((vh - r.top) / vh);
      scroll.through = clamp01((vh - r.top) / (vh + r.height));
    };
    update();
    addEventListener('scroll', update, { passive: true }); addEventListener('resize', update);
    return () => { io.disconnect(); removeEventListener('scroll', update); removeEventListener('resize', update); };
  }, []);

  useEffect(() => {
    const el = wrap.current!;
    let lastX = 0, lastT = 0;
    const down = (e: PointerEvent) => { input.dragging = true; lastX = e.clientX; lastT = performance.now(); input.vel = 0; input.last = lastT; el.setPointerCapture(e.pointerId); el.dataset.dragging = 'true'; };
    const move = (e: PointerEvent) => {
      if (!input.dragging) return;
      const now = performance.now(), d = (e.clientX - lastX) * 0.0085;
      input.yaw += d; input.vel = d / Math.max((now - lastT) / 1000, 1 / 120);
      lastX = e.clientX; lastT = now; input.last = now;
    };
    const up = (e: PointerEvent) => { input.dragging = false; input.last = performance.now(); delete el.dataset.dragging; if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId); };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
  }, []);

  if (!supported) return null;
  return (
    <div ref={wrap} className="absolute inset-0 cursor-grab touch-pan-y select-none data-[dragging=true]:cursor-grabbing" role="img" aria-label="3D Pick It Up E truck loaded with your haul on a snowy driveway — drag sideways to turn it">
      <Boundary fallback={null}>
        <div className="absolute inset-0 transition-opacity duration-1000 ease-out" style={{ opacity: ready ? 1 : 0 }}>
          <Canvas
            shadows={{ type: THREE.PCFSoftShadowMap }}
            frameloop={visible ? 'always' : 'never'}
            dpr={[1, hd ? 1.5 : 1.15]}
            gl={{ alpha: false, antialias: !hd, powerPreference: 'high-performance', toneMapping: THREE.AgXToneMapping, toneMappingExposure: 1.16 }}
            camera={{ fov: 32, near: 0.1, far: 80, position: [6, 2, 6] }}
          >
            <color attach="background" args={[bg]} />
            <fog attach="fog" args={[bg, 11, 30]} />
            <Rig />
            <Suspense fallback={null}>
              <Lights hd={hd} />
              <Driveway hd={hd} />
              <ContactShadows position={[0, 0.01, 0]} opacity={0.38} scale={14} blur={2.5} far={4} resolution={hd ? 512 : 256} frames={1} />
              <Truck hd={hd} onReady={onReady} />
              <Snowfall count={hd ? 5200 : 1700} />
            </Suspense>
          </Canvas>
        </div>
      </Boundary>
    </div>
  );
}
