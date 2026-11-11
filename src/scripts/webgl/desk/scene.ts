/**
 * Desk scene (three.js). Loaded lazily by controller.ts, desktop "full" tier
 * only. The controller owns scroll + HTML; this module owns pixels and is
 * driven through the small DeskScene API below.
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { DESK } from './config';
import { buildPlaceholder, type Palette } from './placeholder';
import { createScreenMaterial } from './screen-material';

export interface DeskScene {
  /** 0–1 scroll progress through the whole section (incl. the push-in). */
  setProgress(p: number): void;
  /** Scroll speed in px/s (sign ignored) — drives typing speed. */
  setVelocity(v: number): void;
  /** Show this cover on the monitor (with flicker). */
  showCover(url: string): void;
  /** Called when the monitor is clicked. */
  onScreenClick(cb: () => void): void;
  setActive(active: boolean): void;
  destroy(): void;
}

const deg = THREE.MathUtils.degToRad;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const smooth = (e0: number, e1: number, x: number) => THREE.MathUtils.smoothstep(x, e0, e1);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function readPalette(el: HTMLElement): Palette {
  const css = getComputedStyle(el);
  const c = (name: string, fallback: string) => new THREE.Color(css.getPropertyValue(name).trim() || fallback);
  return {
    paper: c('--paper', '#f6f1ea'),
    paperDeep: c('--paper-deep', '#ece4d8'),
    ink: c('--ink', '#1d1915'),
    accent: c('--accent', '#a8401f'),
    skin: new THREE.Color('#c99272'),
  };
}

/** Soft blurred ellipse texture used for cheap contact shadows. */
function blobTexture() {
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.25)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(cv);
}

function blob(tex: THREE.Texture, w: number, d: number, x: number, z: number, opacity: number) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.002, z);
  m.renderOrder = -1;
  return m;
}

export async function createDeskScene(stage: HTMLElement): Promise<DeskScene> {
  // ---------- Renderer ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // DPR cap
  renderer.setClearColor(0x000000, 0); // transparent: CSS draws the blue + lines
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = 'desk__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  stage.appendChild(canvas);

  const scene = new THREE.Scene();
  const palette = readPalette(document.documentElement);

  // ---------- Lights: soft, studio-like ----------
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8090ff, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(-3, 6, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.6);
  rim.position.set(4, 3, -4);
  scene.add(rim);

  // ---------- Content ----------
  const ph = buildPlaceholder(palette);
  scene.add(ph.props, ph.figure);
  const shadowTex = blobTexture();
  scene.add(blob(shadowTex, 2.0, 1.2, 0, 0, 0.9)); // under desk
  scene.add(blob(shadowTex, 0.95, 0.95, 0, 0.8, 0.85)); // under chair

  let screenMesh = ph.screen;
  const screenSize = { w: 0.62, h: 0.38 };
  const screenMat = createScreenMaterial(screenSize.w / screenSize.h);
  screenMesh.material = screenMat;

  let head: THREE.Object3D = ph.head;
  let headIsBone = false;
  let mixer: THREE.AnimationMixer | null = null;
  let typingAction: THREE.AnimationAction | null = null;

  // ---------- Optional real avatar ----------
  if (stage.dataset.model) {
    try {
      const avatar = await loadAvatar();
      if (avatar) {
        scene.remove(ph.figure);
        if (DESK.model.includesProps) scene.remove(ph.props);
        avatar.root.scale.setScalar(DESK.model.scale);
        avatar.root.position.set(...DESK.model.position);
        avatar.root.rotation.y = DESK.model.rotationY;
        scene.add(avatar.root);
        if (avatar.head) {
          head = avatar.head;
          headIsBone = true;
        }
        if (avatar.screen) {
          screenMesh = avatar.screen;
          screenMesh.material = screenMat;
        }
        mixer = avatar.mixer;
        typingAction = avatar.typing;
      }
    } catch (err) {
      console.warn('[desk] avatar.glb failed to load, keeping the placeholder.', err);
    }
  }

  // ---------- Camera ----------
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 60);
  const baseTarget = new THREE.Vector3(0.05, 0.9, 0.3); // higher target = scene sits lower in frame
  const screenCenter = new THREE.Vector3();
  screenMesh.getWorldPosition(screenCenter);
  let width = 1;
  let height = 1;

  function resize() {
    const r = stage.getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    renderer.setSize(width, height, false);
    const aspect = width / height;
    const h = DESK.camera.frustum / 2;
    camera.left = -h * aspect;
    camera.right = h * aspect;
    camera.top = h;
    camera.bottom = -h;
  }

  // ---------- State ----------
  let progress = 0;
  let targetSpeed: number = DESK.typing.minSpeed;
  let speed: number = DESK.typing.minSpeed;
  let phase = 0;
  const pointer = { x: 0, y: 0, inside: false };
  const headAim = { yaw: 0, pitch: 0 };
  // Bone heads: the mixer overwrites the pose each frame, so we remember the
  // animated pose and re-apply our cursor offset on top (see frame()).
  const savedHeadQuat = new THREE.Quaternion().copy(head.quaternion);
  let active = false;
  // Minimal frame timer (THREE.Clock is deprecated in recent three.js).
  let last = performance.now();
  let elapsed = 0;
  const tick = () => {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    elapsed += Math.min(dt, 0.05);
    return dt;
  };

  // ---------- Covers on the monitor ----------
  const loader = new THREE.TextureLoader();
  const cache = new Map<string, Promise<THREE.Texture>>();
  const loadTex = (url: string) => {
    if (!cache.has(url)) {
      cache.set(
        url,
        loader.loadAsync(url).then((t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 4;
          return t;
        }),
      );
    }
    return cache.get(url)!;
  };
  const aspectOf = (t: THREE.Texture) => {
    const img = t.image as { width: number; height: number };
    return img.width / img.height;
  };
  let currentUrl = '';
  let flickerTween: gsap.core.Timeline | null = null;

  async function showCover(url: string) {
    if (url === currentUrl) return;
    currentUrl = url;
    const tex = await loadTex(url);
    if (url !== currentUrl) return; // scrolled on before it loaded
    const u = screenMat.uniforms;
    if (!u.uTexA.value) {
      u.uTexA.value = tex;
      u.uAspectA.value = aspectOf(tex);
      u.uTexB.value = tex;
      u.uAspectB.value = aspectOf(tex);
      if (!active) frame(); // paint the first cover even before scrolling
      return;
    }
    flickerTween?.kill();
    u.uTexB.value = tex;
    u.uAspectB.value = aspectOf(tex);
    u.uMix.value = 0;
    // ~250 ms: flicker up, crossfade mid-flicker, settle.
    flickerTween = gsap
      .timeline({
        onComplete: () => {
          u.uTexA.value = tex;
          u.uAspectA.value = aspectOf(tex);
          u.uMix.value = 0;
        },
      })
      .to(u.uFlicker, { value: 1, duration: 0.08, ease: 'power2.in' })
      .to(u.uMix, { value: 1, duration: 0.06 }, 0.06)
      .to(u.uFlicker, { value: 0, duration: 0.17, ease: 'power2.out' }, 0.08);
  }

  // ---------- Pointer: head follow, hover + click on the monitor ----------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hoveringScreen = false;
  let clickCb: (() => void) | null = null;
  let downAt: { x: number; y: number } | null = null;

  const hitsScreen = (clientX: number, clientY: number) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(screenMesh, false).length > 0;
  };

  const onMove = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect();
    const margin = 160;
    pointer.inside =
      e.clientX > r.left - margin && e.clientX < r.right + margin && e.clientY > r.top - margin && e.clientY < r.bottom + margin;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    if (e.target === canvas) {
      const over = hitsScreen(e.clientX, e.clientY);
      if (over !== hoveringScreen) {
        hoveringScreen = over;
        document.dispatchEvent(new CustomEvent('cursor:state', { detail: over ? 'view' : null }));
      }
    } else if (hoveringScreen) {
      hoveringScreen = false;
      document.dispatchEvent(new CustomEvent('cursor:state', { detail: null }));
    }
  };
  const onDown = (e: PointerEvent) => (downAt = { x: e.clientX, y: e.clientY });
  const onUp = (e: PointerEvent) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved < 6 && hitsScreen(e.clientX, e.clientY)) clickCb?.();
  };
  document.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);

  // ---------- Frame ----------
  const headWorld = new THREE.Vector3();
  const tmpTarget = new THREE.Vector3();
  let frameTimes: number[] = [];

  function updateCamera() {
    const ps = DESK.pushStart;
    const story = clamp(progress / ps, 0, 1); // chapters part
    const push = easeInOut(clamp((progress - ps) / (1 - ps), 0, 1)); // push-in part

    // Story: slow orbit + gentle zoom.
    let azimuth = deg(DESK.camera.azimuthDeg + (story - 0.5) * DESK.camera.orbitDeg);
    let elevation = deg(DESK.camera.elevationDeg);
    let zoom = lerp(DESK.camera.zoomStart, DESK.camera.zoomEnd, story);
    tmpTarget.copy(baseTarget);

    // Push: turn to face the screen, centre on it, zoom until it fills the view.
    if (push > 0) {
      const aspect = width / height;
      const fill = Math.max(DESK.camera.frustum / screenSize.h, (DESK.camera.frustum * aspect) / screenSize.w) * 1.04;
      azimuth = lerp(azimuth, 0, push);
      elevation = lerp(elevation, 0, push);
      zoom = Math.exp(lerp(Math.log(zoom), Math.log(fill), push)); // even feel across the zoom
      tmpTarget.lerpVectors(baseTarget, screenCenter, push);
    }
    // Move the ortho camera in front of the figure's head late in the push
    // (ortho scale doesn't depend on distance; this only clips what's behind).
    const dist = lerp(12, 0.35, smooth(0.55, 0.92, push));
    camera.position.set(
      tmpTarget.x + dist * Math.cos(elevation) * Math.sin(azimuth),
      tmpTarget.y + dist * Math.sin(elevation),
      tmpTarget.z + dist * Math.cos(elevation) * Math.cos(azimuth),
    );
    camera.lookAt(tmpTarget);
    camera.zoom = zoom;

    // Frame the scene left of centre (text lives on the right); recentre on push.
    const shift = DESK.camera.shift * (1 - push);
    camera.setViewOffset(width * (1 + 2 * shift), height, width * 2 * shift, 0, width, height);
    camera.updateProjectionMatrix();
  }

  function frame() {
    const dt = Math.min(tick(), 0.05);
    const t = elapsed;

    // Typing speed eases toward the scroll-driven target.
    speed = lerp(speed, targetSpeed, 1 - Math.exp(-dt * 4));
    targetSpeed = lerp(targetSpeed, DESK.typing.minSpeed, 1 - Math.exp(-dt * 1.5)); // relax when scrolling stops
    phase += dt * 9 * speed;

    if (mixer) {
      if (typingAction) typingAction.timeScale = speed;
      if (headIsBone) head.quaternion.copy(savedHeadQuat); // undo last frame's offset
      mixer.update(dt);
      if (headIsBone) savedHeadQuat.copy(head.quaternion);
    } else {
      ph.animate(phase, t);
    }

    // Chair sways a little.
    ph.chairTop.rotation.y = Math.sin(t * 0.5) * deg(4);

    // Head turns toward the cursor when it's near the scene (clamped ±15°).
    let yawT = 0;
    let pitchT = 0;
    if (pointer.inside) {
      head.getWorldPosition(headWorld);
      headWorld.project(camera);
      const r = canvas.getBoundingClientRect();
      const hx = r.left + ((headWorld.x + 1) / 2) * r.width;
      const hy = r.top + ((1 - headWorld.y) / 2) * r.height;
      yawT = clamp(-(pointer.x - hx) / (r.width * 0.35), -1, 1) * deg(15);
      pitchT = clamp((pointer.y - hy) / (r.height * 0.5), -1, 1) * deg(10);
    }
    headAim.yaw = lerp(headAim.yaw, yawT, 1 - Math.exp(-dt * 5));
    headAim.pitch = lerp(headAim.pitch, pitchT, 1 - Math.exp(-dt * 5));
    if (headIsBone) {
      head.rotateY(headAim.yaw);
      head.rotateX(headAim.pitch);
    } else {
      head.rotation.set(headAim.pitch, headAim.yaw, 0);
    }

    screenMat.uniforms.uTime.value = t;
    updateCamera();
    renderer.render(scene, camera);

    // Frame-rate guard: if we can't hold ~40fps, drop to DPR 1.
    frameTimes.push(dt);
    if (frameTimes.length > 120) {
      const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      if (avg > 1 / 40 && renderer.getPixelRatio() > 1) {
        renderer.setPixelRatio(1);
        resize();
      }
      frameTimes = [];
    }
  }

  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  // Render one frame immediately so the poster can be swapped out.
  updateCamera();
  frame();

  return {
    setProgress(p) {
      progress = clamp(p, 0, 1);
    },
    setVelocity(v) {
      const k = clamp(Math.abs(v) / DESK.typing.velocityForMax, 0, 1);
      targetSpeed = Math.max(targetSpeed, lerp(DESK.typing.minSpeed, DESK.typing.maxSpeed, k));
    },
    showCover: (url) => void showCover(url),
    onScreenClick(cb) {
      clickCb = cb;
    },
    setActive(on) {
      if (on === active) return;
      active = on;
      last = performance.now(); // don't jump after a pause
      renderer.setAnimationLoop(on ? frame : null);
    },
    destroy() {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      document.removeEventListener('pointermove', onMove);
      flickerTween?.kill();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((mt) => mt.dispose());
      });
      cache.forEach((p) => p.then((t) => t.dispose()));
      renderer.dispose();
      canvas.remove();
    },
  };
}

/** Loads /models/avatar.glb (Draco + Meshopt aware) and maps its clips. */
async function loadAvatar() {
  const [{ GLTFLoader }, { DRACOLoader }, { MeshoptDecoder }] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/loaders/DRACOLoader.js'),
    import('three/examples/jsm/libs/meshopt_decoder.module.js'),
  ]);
  const draco = new DRACOLoader(); // default = decoder bundled with three.js
  const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(DESK.modelUrl);
  draco.dispose();

  const root = gltf.scene;
  const names = gltf.animations.map((c) => c.name);
  console.info('[desk] clips:', names.length ? names.join(', ') : '(none)');

  const lower = (s: string) => s.toLowerCase();
  const findClip = (wanted: readonly string[]) =>
    gltf.animations.find((c) => wanted.some((w) => lower(c.name).includes(lower(w))));

  let head: THREE.Object3D | null = null;
  let screen: THREE.Mesh | null = null;
  root.traverse((o) => {
    const n = lower(o.name);
    if (!head && DESK.headBones.some((h) => n === lower(h))) head = o;
    if (!screen && (o as THREE.Mesh).isMesh && DESK.screenMeshes.some((s) => n === lower(s))) screen = o as THREE.Mesh;
  });
  console.info('[desk] head bone:', head ? (head as THREE.Object3D).name : 'not found (check DESK.headBones)');

  let mixer: THREE.AnimationMixer | null = null;
  let typing: THREE.AnimationAction | null = null;
  const clip = findClip(DESK.clips.typing) ?? findClip(DESK.clips.idle) ?? gltf.animations[0];
  if (clip) {
    mixer = new THREE.AnimationMixer(root);
    typing = mixer.clipAction(clip);
    typing.play();
    console.info('[desk] playing clip:', clip.name);
  }
  return { root, head: head as THREE.Object3D | null, screen: screen as THREE.Mesh | null, mixer, typing };
}
