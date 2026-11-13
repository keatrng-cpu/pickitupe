/**
 * The 3D hero: the cream letterpress pickup, rebuilt in three.js as a toy-like
 * model, bed loaded with a couch, a fridge and boxes, parked in fresh snow.
 *
 * Procedural on purpose — no .glb download, no texture files. The whole scene
 * is geometry + flat materials, so the only weight is three.js itself, and it
 * loads after the page is interactive (truck-stage.tsx decides when).
 *
 * Performance rules:
 *  - DPR capped (1.75 desktop, 1.5 phones); shadow map 1024 / 512.
 *  - Renders only while on screen, the tab is visible and motion isn't paused.
 *  - Paused or reduced motion → one still frame, no loop.
 *  - Everything is disposed on unmount.
 */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  type Material,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type TruckSceneHandle = {
  setActive(active: boolean): void;
  dispose(): void;
};

type Options = {
  /** Called once the first frame is on the canvas, so the poster can fade. */
  onReady?: () => void;
  /** Reduced motion or the page's pause toggle: draw one frame, no loop. */
  still?: boolean;
  small?: boolean;
};

const PALETTE = {
  cream: "#efe2c4",
  creamShade: "#d9c79f",
  mahogany: "#5a2a1c",
  couch: "#7a3a26",
  cushion: "#8d4a31",
  chrome: "#d7d2c6",
  tire: "#1b1612",
  glass: "#16362a",
  snow: "#f4f6f2",
  snowShade: "#dfe7e3",
  fridge: "#f1ece0",
  box: "#b98a55",
  boxDark: "#9b7140",
  strap: "#e2b33c",
  pine: "#0b5a32",
  pineDark: "#063d22",
  headlight: "#ffe3a1",
} as const;

function std(color: string, opts: Partial<{ rough: number; metal: number; emissive: string; emissiveIntensity: number }> = {}) {
  const m = new MeshStandardMaterial({
    color: new Color(color),
    roughness: opts.rough ?? 0.62,
    metalness: opts.metal ?? 0.05,
  });
  if (opts.emissive) {
    m.emissive = new Color(opts.emissive);
    m.emissiveIntensity = opts.emissiveIntensity ?? 1;
  }
  return m;
}

function rbox(w: number, h: number, d: number, r: number, mat: Material) {
  const m = new Mesh(new RoundedBoxGeometry(w, h, d, 4, r), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function place<T extends Object3D>(o: T, x: number, y: number, z: number, parent: Object3D): T {
  o.position.set(x, y, z);
  parent.add(o);
  return o;
}

/** Soft white disc that fades to transparent at the rim — the snowfield. */
function snowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, "rgba(246,248,244,1)");
  grad.addColorStop(0.62, "rgba(236,242,238,0.96)");
  grad.addColorStop(0.86, "rgba(220,232,226,0.45)");
  grad.addColorStop(1, "rgba(220,232,226,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function flakeTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.8)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function doorTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 226;
  const g = c.getContext("2d")!;
  g.fillStyle = "#5a2a1c";
  g.textAlign = "center";
  g.font = "italic 900 92px 'Playfair Display', Georgia, serif";
  g.fillText("Pick It Up E", 256, 112);
  g.font = "600 34px 'Outfit', system-ui, sans-serif";
  g.fillText("GRAND FORKS · HAUL CREW", 256, 176);
  g.fillRect(96, 196, 320, 4);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function buildTruck() {
  const truck = new Group();
  const body = new Group(); // sprung mass — bobs a little on idle
  truck.add(body);

  const cream = std(PALETTE.cream, { rough: 0.45 });
  const creamShade = std(PALETTE.creamShade, { rough: 0.55 });
  const chrome = std(PALETTE.chrome, { rough: 0.25, metal: 0.85 });
  const glass = std(PALETTE.glass, { rough: 0.15, metal: 0.3 });
  const tire = std(PALETTE.tire, { rough: 0.9 });
  const dark = std("#231a14", { rough: 0.8 });
  const snow = std(PALETTE.snow, { rough: 0.95 });
  const lamp = std(PALETTE.headlight, { emissive: PALETTE.headlight, emissiveIntensity: 1.6, rough: 0.3 });

  // Frame + running boards
  place(rbox(4.7, 0.22, 1.35, 0.05, dark), 0.05, 0.62, 0, body);
  for (const z of [-0.86, 0.86]) place(rbox(1.55, 0.07, 0.3, 0.03, dark), 0.22, 0.66, z, body);

  // Cab
  place(rbox(1.35, 1.12, 1.62, 0.2, cream), 0.32, 1.38, 0, body);
  // Snow on the roof
  place(rbox(1.28, 0.12, 1.5, 0.06, snow), 0.32, 1.98, 0, body);
  // Windows: windshield, two side windows, back window
  const ws = place(rbox(0.06, 0.48, 1.36, 0.03, glass), 1.0, 1.58, 0, body);
  ws.rotation.z = -0.12;
  for (const z of [-0.815, 0.815]) place(rbox(0.82, 0.44, 0.04, 0.02, glass), 0.36, 1.6, z, body);
  place(rbox(0.04, 0.34, 1.1, 0.02, glass), -0.37, 1.62, 0, body);

  // Door lettering — the brand, painted on like an old shop truck
  const decal = new Mesh(
    new PlaneGeometry(0.95, 0.42),
    new MeshStandardMaterial({ map: doorTexture(), transparent: true, roughness: 0.6 }),
  );
  place(decal, 0.3, 1.13, 0.812, body);

  // Hood (narrower than the cab, like the old round-fender pickups)
  place(rbox(1.42, 0.62, 1.22, 0.24, cream), 1.66, 1.12, 0, body);
  // Grille + chrome bars
  place(rbox(0.12, 0.52, 0.86, 0.05, chrome), 2.36, 1.06, 0, body);
  for (let i = 0; i < 4; i++) place(rbox(0.05, 0.035, 0.8, 0.015, dark), 2.42, 0.88 + i * 0.12, 0, body);
  // Bumpers
  place(rbox(0.16, 0.16, 1.85, 0.07, chrome), 2.56, 0.66, 0, body);
  place(rbox(0.14, 0.14, 1.78, 0.06, chrome), -2.48, 0.68, 0, body);

  // Round fenders: half-torus shells over each wheel + a cap to close them
  const fender = (x: number, z: number) => {
    const shell = new Mesh(new CylinderGeometry(0.6, 0.6, 0.44, 24, 1, true, Math.PI / 2, Math.PI), cream);
    // Axis along the axle (z); thetaStart PI/2 puts the open half underneath
    shell.rotation.x = Math.PI / 2;
    (shell.material as MeshStandardMaterial).side = DoubleSide;
    shell.castShadow = true;
    place(shell, x, 0.66, z, body);
    const lip = new Mesh(new TorusGeometry(0.6, 0.05, 8, 24, Math.PI), creamShade);
    lip.castShadow = true;
    place(lip, x, 0.66, z + Math.sign(z) * 0.22, body);
  };
  for (const z of [-0.74, 0.74]) {
    fender(1.62, z);
    fender(-1.6, z);
  }
  // Headlights on the front fenders
  for (const z of [-0.62, 0.62]) {
    const pod = place(new Mesh(new CylinderGeometry(0.13, 0.15, 0.14, 18), chrome), 2.18, 1.22, z, body);
    pod.rotation.z = Math.PI / 2;
    place(new Mesh(new SphereGeometry(0.11, 18, 12), lamp), 2.24, 1.22, z, body);
  }

  // Bed: floor, sides, front wall, tailgate
  const bedX = -1.42;
  place(rbox(2.05, 0.12, 1.5, 0.04, creamShade), bedX, 0.86, 0, body);
  for (const z of [-0.73, 0.73]) place(rbox(2.05, 0.5, 0.08, 0.04, cream), bedX, 1.12, z, body);
  place(rbox(0.08, 0.5, 1.5, 0.04, cream), bedX + 1.0, 1.12, 0, body);
  place(rbox(0.08, 0.5, 1.5, 0.04, cream), bedX - 1.0, 1.12, 0, body);
  // Taillights
  for (const z of [-0.64, 0.64]) place(rbox(0.06, 0.14, 0.1, 0.02, std("#a5281b", { emissive: "#a5281b", emissiveIntensity: 0.6 })), bedX - 1.06, 1.12, z, body);

  // --- The load ---
  const load = new Group();
  load.position.set(bedX, 0.92, 0);
  body.add(load);
  // Couch, lying lengthwise
  const couchMat = std(PALETTE.couch, { rough: 0.85 });
  const cushMat = std(PALETTE.cushion, { rough: 0.9 });
  const couch = new Group();
  couch.position.set(-0.15, 0.0, 0.18);
  load.add(couch);
  place(rbox(1.5, 0.28, 0.7, 0.1, couchMat), 0, 0.16, 0, couch);
  place(rbox(1.5, 0.5, 0.18, 0.08, couchMat), 0, 0.5, -0.27, couch);
  for (const x of [-0.7, 0.7]) place(rbox(0.16, 0.42, 0.7, 0.07, couchMat), x, 0.42, 0, couch);
  for (const x of [-0.33, 0.33]) place(rbox(0.62, 0.12, 0.5, 0.06, cushMat), x, 0.36, 0.06, couch);
  place(rbox(1.36, 0.06, 0.3, 0.03, snow), 0, 0.77, -0.27, couch);
  // Fridge, standing at the front of the bed
  const fridge = place(rbox(0.58, 1.25, 0.58, 0.08, std(PALETTE.fridge, { rough: 0.35 })), 0.68, 0.64, -0.38, load);
  fridge.rotation.y = 0.12;
  place(rbox(0.04, 0.32, 0.04, 0.02, chrome), 0.98, 0.86, -0.18, load);
  place(rbox(0.52, 0.08, 0.52, 0.04, snow), 0.68, 1.3, -0.38, load);
  // Boxes
  const boxMat = std(PALETTE.box, { rough: 0.9 });
  const boxDark = std(PALETTE.boxDark, { rough: 0.9 });
  const b1 = place(rbox(0.44, 0.36, 0.42, 0.03, boxMat), -0.75, 0.2, -0.42, load);
  b1.rotation.y = 0.2;
  const b2 = place(rbox(0.36, 0.3, 0.34, 0.03, boxDark), -0.7, 0.53, -0.4, load);
  b2.rotation.y = -0.25;
  place(rbox(0.3, 0.05, 0.28, 0.02, snow), -0.7, 0.71, -0.4, load);
  const b3 = place(rbox(0.38, 0.3, 0.36, 0.03, boxMat), 0.15, 0.16, -0.48, load);
  b3.rotation.y = -0.1;
  // A floor lamp poking out the back
  const lampPole = place(new Mesh(new CylinderGeometry(0.025, 0.025, 1.2, 8), chrome), -0.98, 0.75, 0.48, load);
  lampPole.rotation.z = 0.75;
  const shade = place(new Mesh(new ConeGeometry(0.18, 0.24, 16, 1, true), std("#e9d9b5", { rough: 0.8 })), -1.45, 1.17, 0.48, load);
  shade.rotation.z = 0.75 + Math.PI;
  (shade.material as MeshStandardMaterial).side = DoubleSide;
  // Ratchet strap over the couch
  const strap = place(rbox(0.07, 0.02, 1.56, 0.01, std(PALETTE.strap, { rough: 0.6 })), -0.1, 0.83, 0.02, load);
  strap.rotation.x = 0.06;

  // Wheels
  const wheels: Group[] = [];
  const hub = std(PALETTE.cream, { rough: 0.4 });
  for (const x of [1.62, -1.6]) {
    for (const z of [-0.78, 0.78]) {
      const w = new Group();
      const t = new Mesh(new CylinderGeometry(0.44, 0.44, 0.3, 28), tire);
      t.rotation.x = Math.PI / 2;
      t.castShadow = true;
      w.add(t);
      const cap = new Mesh(new CylinderGeometry(0.24, 0.24, 0.32, 24), hub);
      cap.rotation.x = Math.PI / 2;
      w.add(cap);
      const nut = new Mesh(new CylinderGeometry(0.08, 0.08, 0.34, 12), chrome);
      nut.rotation.x = Math.PI / 2;
      w.add(nut);
      place(w, x, 0.44, z, truck);
      wheels.push(w);
    }
  }

  return { truck, body, wheels };
}

function buildWorld(scene: Scene, small: boolean) {
  const ground = new Mesh(
    new CircleGeometry(7.5, 64),
    new MeshStandardMaterial({ map: snowTexture(), transparent: true, roughness: 1, depthWrite: false }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Snow drifts
  const drift = std(PALETTE.snow, { rough: 1 });
  const drifts: [number, number, number, number][] = [
    [-3.6, -1.8, 1.2, 0.35],
    [3.4, -2.2, 0.9, 0.28],
    [-2.6, 2.4, 0.8, 0.22],
    [4.2, 1.2, 0.7, 0.2],
  ];
  for (const [x, z, s, h] of drifts) {
    const m = new Mesh(new SphereGeometry(1, 20, 12), drift);
    m.scale.set(s, h, s * 0.8);
    m.position.set(x, 0, z);
    m.receiveShadow = true;
    scene.add(m);
  }

  // A few low-poly pines behind the truck
  const pine = std(PALETTE.pine, { rough: 0.9 });
  const pineDark = std(PALETTE.pineDark, { rough: 0.9 });
  const cap = std(PALETTE.snow, { rough: 1 });
  const trees: [number, number, number][] = small
    ? [[-3.4, -3.2, 1.2], [-1.6, -4.2, 1.5], [3.0, -3.6, 1.3]]
    : [[-3.6, -3.2, 1.25], [-1.8, -4.3, 1.6], [0.6, -4.8, 1.2], [3.1, -3.7, 1.4], [4.6, -2.4, 1.0]];
  for (const [x, z, s] of trees) {
    const g = new Group();
    for (let i = 0; i < 3; i++) {
      const r = (0.95 - i * 0.25) * s;
      const tier = new Mesh(new ConeGeometry(r, 0.9 * s, 7), i % 2 ? pineDark : pine);
      tier.position.y = (0.55 + i * 0.5) * s;
      tier.castShadow = true;
      g.add(tier);
      const snowCap = new Mesh(new ConeGeometry(r * 0.55, 0.35 * s, 7), cap);
      snowCap.position.y = tier.position.y + 0.32 * s;
      g.add(snowCap);
    }
    g.position.set(x, 0, z);
    g.rotation.y = x;
    scene.add(g);
  }
}

function buildSnow(count: number) {
  const pos = new Float32Array(count * 3);
  const speed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 1] = Math.random() * 7;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    speed[i] = 0.25 + Math.random() * 0.45;
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  const mat = new PointsMaterial({
    size: 0.09,
    map: flakeTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.9,
    blending: AdditiveBlending,
  });
  const pts = new Points(geo, mat);
  return { pts, pos, speed };
}

export function mountTruckScene(canvas: HTMLCanvasElement, opts: Options = {}): TruckSceneHandle {
  const small = opts.small ?? window.matchMedia("(max-width: 767px)").matches;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  const camera = new PerspectiveCamera(small ? 34 : 30, 1, 0.1, 60);
  const target = new Vector3(0.1, 0.95, 0);

  scene.add(new HemisphereLight("#f6f1e4", "#0b4a2a", 1.15));
  const sun = new DirectionalLight("#fff4dc", 2.3);
  sun.position.set(4.5, 7.5, 3.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 512 : 1024, small ? 512 : 1024);
  sun.shadow.camera.left = -5;
  sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 5;
  sun.shadow.camera.bottom = -5;
  sun.shadow.bias = -0.0006;
  sun.shadow.radius = 3;
  scene.add(sun);
  const rim = new DirectionalLight("#9fd8b4", 0.9);
  rim.position.set(-5, 3, -4);
  scene.add(rim);

  buildWorld(scene, small);
  const { truck, body } = buildTruck();
  truck.rotation.y = -0.42;
  scene.add(truck);
  const snow = buildSnow(small ? 260 : 520);
  scene.add(snow.pts);

  // Camera orbit, nudged by pointer / drag
  let yaw = 0;
  let yawTarget = 0;
  let pitchTarget = 0;
  let pitch = 0;
  let dragging = false;
  let lastX = 0;
  const onMove = (e: PointerEvent) => {
    if (dragging) {
      yawTarget += (e.clientX - lastX) * 0.008;
      lastX = e.clientX;
      return;
    }
    if (e.pointerType !== "mouse") return;
    const r = canvas.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    yawTarget = nx * 0.5;
    pitchTarget = ny * 0.12;
  };
  const onDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
  };
  const onUp = () => {
    dragging = false;
  };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull back on tall/narrow boxes so the whole truck stays framed
    const dist = camera.aspect < 1 ? 11.5 : camera.aspect < 1.4 ? 10 : 9;
    camera.userData.dist = dist;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let raf = 0;
  let active = false;
  let ready = false;
  let last = performance.now();
  const start = last;

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - start) / 1000;

    // Slow turntable sway + pointer
    yaw += (yawTarget + Math.sin(t * 0.25) * 0.35 - yaw) * 0.04;
    pitch += (pitchTarget - pitch) * 0.05;
    const dist: number = camera.userData.dist ?? 9;
    const a = 0.12 + yaw;
    camera.position.set(Math.sin(a) * dist, 4.1 + pitch * 10, Math.cos(a) * dist);
    camera.lookAt(target);

    // Engine idle: a few millimetres of bob
    body.position.y = Math.sin(t * 9) * 0.008;
    body.rotation.x = Math.sin(t * 4.5) * 0.002;

    // Snowfall with a little sideways drift
    const p = snow.pos;
    for (let i = 0; i < snow.speed.length; i++) {
      p[i * 3 + 1] -= snow.speed[i] * dt;
      p[i * 3] += Math.sin(t * 0.6 + i) * 0.002;
      if (p[i * 3 + 1] < 0) p[i * 3 + 1] = 7;
    }
    (snow.pts.geometry.getAttribute("position") as BufferAttribute).needsUpdate = true;

    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      opts.onReady?.();
    }
    if (active) raf = requestAnimationFrame(frame);
  }

  function setActive(next: boolean) {
    const want = next && !opts.still;
    if (want === active) return;
    active = want;
    if (active) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
    }
  }

  // Always draw at least one frame (the still / reduced-motion view)
  frame(performance.now());

  return {
    setActive,
    dispose() {
      cancelAnimationFrame(raf);
      active = false;
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      scene.traverse((o) => {
        const m = o as Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as Material | Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else if (mat) {
          const map = (mat as MeshStandardMaterial).map;
          map?.dispose();
          mat.dispose();
        }
      });
      renderer.dispose();
    },
  };
}
