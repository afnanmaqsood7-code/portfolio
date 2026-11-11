/**
 * Desk scene (three.js).
 * A woman in a hijab works at her desk. On the desk, ONE device MORPHS as you
 * scroll — monitor, laptop, tablet, phone — chosen per project; its screen
 * switches to each project's cover with a short flicker. She types while
 * there's a keyboard (faster when you scroll fast) and rests her hands when
 * there isn't. Head turns toward the cursor, the chair sways, the camera
 * drifts, and at the end pushes into the screen.
 * Loaded lazily by controller.ts, desktop "full" tier only.
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { DESK } from './config';
import { buildDevice, mixShape, SHAPES, type DeviceKind, type Palette } from './device';
import { buildCharacter, DESK_TOP_Y } from './character';

export interface DeskScene {
  /** 0–1 scroll progress through the whole section (incl. the push-in). */
  setProgress(p: number): void;
  /** Scroll speed in px/s (sign ignored) — drives typing speed. */
  setVelocity(v: number): void;
  /** Device per visible chapter, in order (follows the role lens). */
  setDevices(kinds: DeviceKind[]): void;
  /** Show this cover on the screen (with flicker). */
  showCover(url: string): void;
  /** Called when the screen is clicked. */
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
  };
}

/** Soft blurred ellipse texture: a cheap contact shadow. */
function shadowPlane(w: number, d: number, x: number, y: number, z: number, opacity: number) {
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0,0,0,0.5)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.18)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, opacity }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.renderOrder = -1;
  return mesh;
}

export async function createDeskScene(stage: HTMLElement): Promise<DeskScene> {
  // ---------- Renderer ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // DPR cap
  renderer.setClearColor(0x000000, 0); // transparent: CSS draws the background
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = 'desk__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  stage.appendChild(canvas);

  const scene = new THREE.Scene();
  const palette = readPalette(document.documentElement);

  // ---------- Lights: soft studio ----------
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8090ff, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(-3, 6, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.6);
  rim.position.set(4, 3, -4);
  scene.add(rim);

  // ---------- Character, desk, chair ----------
  const person = buildCharacter(palette);
  scene.add(person.props, person.figure);
  scene.add(shadowPlane(1.9, 1.1, 0.05, 0.002, 0, 0.85)); // floor under desk
  scene.add(shadowPlane(0.95, 0.95, 0, 0.002, 0.8, 0.8)); // floor under chair

  // ---------- Morphing device on the desk ----------
  const device = buildDevice(palette);
  device.root.position.set(0.08, DESK_TOP_Y, -0.18);
  scene.add(device.root);
  const screen = device.front;
  const screenMat = device.frontMat;
  const screenCenter = device.screenCenter;
  const deviceShadow = shadowPlane(1, 0.4, 0.08, DESK_TOP_Y + 0.001, -0.18, 0.55);
  scene.add(deviceShadow);

  let devices: DeviceKind[] = ['desktop'];
  let shape = SHAPES.desktop;
  /** Each morph runs over the last part of a chapter and completes exactly
   *  where the next chapter (and its cover) begins. */
  const MORPH_FROM = 0.62;
  function updateShape() {
    const n = devices.length;
    const story = clamp(progress / DESK.pushStart, 0, 0.9999) * n;
    const i = Math.floor(story);
    const t = easeInOut(clamp((story - i - MORPH_FROM) / (1 - MORPH_FROM), 0, 1));
    const a = SHAPES[devices[i]];
    shape = i < n - 1 ? mixShape(a, SHAPES[devices[i + 1]], t) : a;
    device.apply(shape);
    deviceShadow.scale.set((shape.w + 2 * shape.bezel) * 1.3, 1, 1);
    deviceShadow.position.z = -0.18 + shape.z;
  }

  // ---------- Camera ----------
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 60);
  const baseTarget = new THREE.Vector3(0.05, 0.9, 0.3);
  let width = 1;
  let height = 1;

  function resize() {
    const r = stage.getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    renderer.setSize(width, height, false);
    const h = DESK.camera.frustum / 2;
    camera.left = -h * (width / height);
    camera.right = h * (width / height);
    camera.top = h;
    camera.bottom = -h;
  }

  // ---------- State ----------
  let progress = 0;
  let active = false;
  let last = performance.now();
  let elapsed = 0;
  let targetSpeed: number = DESK.typing.minSpeed;
  let speed: number = DESK.typing.minSpeed;
  let phase = 0;
  const pointer = { x: 0, y: 0, inside: false };
  const aim = { yaw: 0, pitch: 0 };
  const target = new THREE.Vector3();
  const headWorld = new THREE.Vector3();

  function updateCamera() {
    const ps = DESK.pushStart;
    const story = clamp(progress / ps, 0, 1);
    const push = easeInOut(clamp((progress - ps) / (1 - ps), 0, 1));

    let azimuth = deg(DESK.camera.azimuthDeg + (story - 0.5) * DESK.camera.orbitDeg + Math.sin(elapsed * 0.4) * 0.6);
    let elevation = deg(DESK.camera.elevationDeg);
    let zoom = lerp(DESK.camera.zoomStart, DESK.camera.zoomEnd, story);
    target.copy(baseTarget);

    // Push: face the (possibly tilted) screen square-on, centre, zoom to fill.
    if (push > 0) {
      const aspect = width / height;
      const fill = Math.max(DESK.camera.frustum / shape.h, (DESK.camera.frustum * aspect) / shape.w) * 1.04;
      azimuth = lerp(azimuth, 0, push);
      elevation = lerp(elevation, -shape.tilt, push);
      zoom = Math.exp(lerp(Math.log(zoom), Math.log(fill), push));
      target.lerpVectors(baseTarget, screenCenter, push);
    }
    // Late in the push, move in front of her head (ortho: only clipping changes).
    const dist = lerp(12, 0.3, smooth(0.55, 0.92, push));
    camera.position.set(
      target.x + dist * Math.cos(elevation) * Math.sin(azimuth),
      target.y + dist * Math.sin(elevation),
      target.z + dist * Math.cos(elevation) * Math.cos(azimuth),
    );
    camera.lookAt(target);
    camera.zoom = zoom;
    const shift = DESK.camera.shift * (1 - push);
    camera.setViewOffset(width * (1 + 2 * shift), height, width * 2 * shift, 0, width, height);
    camera.updateProjectionMatrix();
  }

  // ---------- Covers on the screen ----------
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
  let flicker: gsap.core.Timeline | null = null;

  async function showCover(url: string) {
    if (url === currentUrl) return;
    currentUrl = url;
    const tex = await loadTex(url);
    if (url !== currentUrl) return;
    const u = screenMat.uniforms;
    if (!u.uTexA.value) {
      u.uTexA.value = u.uTexB.value = tex;
      u.uAspectA.value = u.uAspectB.value = aspectOf(tex);
      if (!active) frame();
      return;
    }
    flicker?.kill();
    u.uTexB.value = tex;
    u.uAspectB.value = aspectOf(tex);
    u.uMix.value = 0;
    flicker = gsap
      .timeline({
        onUpdate: () => !active && frame(),
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

  // ---------- Pointer: head follow, hover + click on the screen ----------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovering = false;
  let clickCb: (() => void) | null = null;
  let downAt: { x: number; y: number } | null = null;

  const hitsScreen = (x: number, y: number) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(screen, false).length > 0;
  };
  const setHover = (on: boolean) => {
    if (on === hovering) return;
    hovering = on;
    document.dispatchEvent(new CustomEvent('cursor:state', { detail: on ? 'view' : null }));
  };
  const onMove = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect();
    const m = 160;
    pointer.inside = e.clientX > r.left - m && e.clientX < r.right + m && e.clientY > r.top - m && e.clientY < r.bottom + m;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    setHover(e.target === canvas && hitsScreen(e.clientX, e.clientY));
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
  let frameTimes: number[] = [];
  function frame() {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;

    updateShape();

    // Typing: speed eases toward the scroll-driven target, relaxes when idle.
    speed = lerp(speed, targetSpeed, 1 - Math.exp(-dt * 4));
    targetSpeed = lerp(targetSpeed, DESK.typing.minSpeed, 1 - Math.exp(-dt * 1.5));
    phase += dt * 9 * speed;
    const keysZ = device.root.position.z + shape.kbZ - 0.04 * shape.kbD;
    person.animate(phase, elapsed, shape.kb, keysZ);

    // Chair sways a little.
    person.chairTop.rotation.y = Math.sin(elapsed * 0.5) * deg(4);

    // Head turns toward the cursor when it's near the scene (±15°).
    let yawT = 0;
    let pitchT = 0;
    if (pointer.inside) {
      person.head.getWorldPosition(headWorld).project(camera);
      const r = canvas.getBoundingClientRect();
      const hx = r.left + ((headWorld.x + 1) / 2) * r.width;
      const hy = r.top + ((1 - headWorld.y) / 2) * r.height;
      yawT = clamp(-(pointer.x - hx) / (r.width * 0.35), -1, 1) * deg(15);
      pitchT = clamp((pointer.y - hy) / (r.height * 0.5), -1, 1) * deg(10);
    }
    aim.yaw = lerp(aim.yaw, yawT, 1 - Math.exp(-dt * 5));
    aim.pitch = lerp(aim.pitch, pitchT, 1 - Math.exp(-dt * 5));
    person.head.rotation.set(aim.pitch, aim.yaw, 0);

    screenMat.uniforms.uTime.value = elapsed;
    updateCamera();
    renderer.render(scene, camera);

    // Frame-rate guard: if we can't hold ~40fps, drop to DPR 1.
    if (active) {
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
  }

  const ro = new ResizeObserver(() => {
    resize();
    if (!active) frame();
  });
  ro.observe(stage);
  resize();
  frame();

  return {
    setProgress(p) {
      progress = clamp(p, 0, 1);
    },
    setVelocity(vel) {
      const k = clamp(Math.abs(vel) / DESK.typing.velocityForMax, 0, 1);
      targetSpeed = Math.max(targetSpeed, lerp(DESK.typing.minSpeed, DESK.typing.maxSpeed, k));
    },
    setDevices(kinds) {
      devices = kinds.length ? kinds : ['desktop'];
      if (!active) frame();
    },
    showCover: (url) => void showCover(url),
    onScreenClick(cb) {
      clickCb = cb;
    },
    setActive(on) {
      if (on === active) return;
      active = on;
      last = performance.now();
      renderer.setAnimationLoop(on ? frame : null);
    },
    destroy() {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      document.removeEventListener('pointermove', onMove);
      flicker?.kill();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((mt) => mt.dispose());
      });
      cache.forEach((pr) => pr.then((t) => t.dispose()));
      renderer.dispose();
      canvas.remove();
    },
  };
}
