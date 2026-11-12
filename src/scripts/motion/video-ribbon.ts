/**
 * Video ribbon engine (lazy-loaded by components/home/VideoRibbon.astro).
 * Ported from Afnan's "Vante" recreation prompt: same rail maths, shader,
 * timings and grid. Changes: cards are her projects (images, optional video),
 * progress is measured relative to the section (it isn't at the page top),
 * rendering pauses off screen / hidden tab, and grid cards are clickable.
 */
import * as THREE from 'three';

interface CardData { title: string; href: string; image: string; video?: string }

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);
const out = (t: number) => 1 - (1 - t) ** 3;
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

export function initRibbon(section: HTMLElement) {
  const q = <T extends HTMLElement = HTMLElement>(n: string) => section.querySelector<T>(`[data-r="${n}"]`)!;
  const stage = section.querySelector<HTMLElement>('[data-ribbon-stage]')!;
  const track = section.querySelector<HTMLElement>('[data-ribbon-track]')!;
  const WORK: CardData[] = JSON.parse(section.querySelector('[data-ribbon-cards]')!.textContent || '[]');

  /* ---------- renderer ---------- */
  const canvas = q<HTMLCanvasElement>('gl');
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    console.warn('[ribbon] WebGL unavailable, static fallback.', err);
    return;
  }
  section.classList.add('vr--live');
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const scene = new THREE.Scene();
  const FOV = 35;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

  /* ---------- ribbon path (fixed rail) ---------- */
  let PATH_L = 1;
  const SAMPLES = 1200;
  const pathP: THREE.Vector3[] = [];
  const pathT: THREE.Vector3[] = [];
  const PH0 = -1.5, PH1 = Math.PI * 2 + 1.35;
  function buildPath() {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 160; i++) {
      const t = i / 160, ph = mix(PH0, PH1, t), cs = Math.cos(ph), u = 2 * t - 1;
      // a shallow arc close to the camera, then long runs far behind it
      const depth = cs > 0 ? 7.6 + 16.4 * cs ** 0.9 : 7.6 + 2.2 * cs;
      const edge = 0.84 + 0.5 * span(0.14 - t, 0, 0.14) + 0.8 * span(t, 0.84, 1);
      pts.push(new THREE.Vector3(edge * Math.sin(ph) * depth * 0.561, 0.5 * Math.sign(u) * Math.abs(u) ** 1.4 * depth * 0.63, -depth));
    }
    const path = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    path.arcLengthDivisions = 1500;
    PATH_L = path.getLength();
    pathP.length = pathT.length = 0;
    for (let i = 0; i <= SAMPLES; i++) {
      const u = i / SAMPLES;
      pathP.push(path.getPointAt(u));
      pathT.push(path.getTangentAt(u));
    }
  }
  const at = (s: number, op: THREE.Vector3, ot: THREE.Vector3) => {
    const f = clamp(s / PATH_L) * SAMPLES, i = Math.min(SAMPLES - 1, Math.floor(f)), k = f - i;
    op.lerpVectors(pathP[i], pathP[i + 1], k);
    ot.lerpVectors(pathT[i], pathT[i + 1], k).normalize();
  };

  /* ---------- cards ---------- */
  const CARD_W = 2.1, CARD_H = 1.32, GAP = 0.03, STEP = CARD_W + GAP, NX = 28, NY = 3;
  const vs = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const fs = `uniform sampler2D map;uniform vec2 cover;uniform float aspect,ready,radius;varying vec2 vUv;
void main(){
  vec2 q=(abs(vUv-.5)-.5)*vec2(aspect,1.)+radius;
  float d=length(max(q,0.))+min(max(q.x,q.y),0.)-radius;
  float px=fwidth(d),a=1.-smoothstep(-px,px,d);
  if(a<.01)discard;
  vec2 uv=vUv;if(!gl_FrontFacing)uv.x=1.-uv.x;
  vec3 c=mix(vec3(.075),texture2D(map,(uv-.5)*cover+.5).rgb,ready);
  float edge=smoothstep(-.012-px,-.012,d);
  gl_FragColor=vec4(mix(c,vec3(1.),edge*.1),a);
}`;
  interface Card {
    i: number; title: string; href: string; v: HTMLVideoElement | null;
    geo: THREE.PlaneGeometry; mat: THREE.ShaderMaterial; mesh: THREE.Mesh; rect: ReturnType<typeof grid> | null;
  }
  const setCover = (mat: THREE.ShaderMaterial, w: number, h: number) => {
    const va = w / h, ca = CARD_W / CARD_H;
    mat.uniforms.cover.value.set(va > ca ? ca / va : 1, va > ca ? 1 : va / ca);
    mat.uniforms.ready.value = 1;
  };
  const loader = new THREE.TextureLoader();
  const cards: Card[] = WORK.map((w, i) => {
    const geo = new THREE.PlaneGeometry(1, 1, NX, NY);
    const mat = new THREE.ShaderMaterial({
      vertexShader: vs, fragmentShader: fs, transparent: true, side: THREE.DoubleSide,
      uniforms: { map: { value: null }, cover: { value: new THREE.Vector2(1, 1) }, aspect: { value: CARD_W / CARD_H }, ready: { value: 0 }, radius: { value: 0.018 } },
    });
    let v: HTMLVideoElement | null = null;
    if (w.video) {
      v = document.createElement('video');
      Object.assign(v, { crossOrigin: 'anonymous', muted: true, loop: true, playsInline: true, preload: 'auto', src: w.video });
      v.setAttribute('playsinline', '');
      const tex = new THREE.VideoTexture(v);
      tex.colorSpace = THREE.NoColorSpace;
      tex.minFilter = tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      mat.uniforms.map.value = tex;
      v.addEventListener('loadeddata', () => setCover(mat, v!.videoWidth, v!.videoHeight));
    } else {
      loader.load(w.image, (tex) => {
        tex.colorSpace = THREE.NoColorSpace;
        tex.minFilter = tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        mat.uniforms.map.value = tex;
        const img = tex.image as { width: number; height: number };
        setCover(mat, img.width, img.height);
      });
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return { i, title: w.title, href: w.href, v, geo, mat, mesh, rect: null };
  });

  /* ---------- layout ---------- */
  const GZ = 8;
  let W = 1, H = 1, asp = 1, cols = 3, rows = 2, tanH = 0.3153;
  function resize() {
    W = stage.clientWidth; H = stage.clientHeight; asp = W / H;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H, false);
    camera.aspect = asp;
    camera.fov = asp < 16 / 9 ? (Math.atan(0.561 / asp) * 360) / Math.PI : FOV;
    camera.updateProjectionMatrix();
    tanH = Math.tan((camera.fov * Math.PI) / 360);
    cols = asp < 0.9 ? 2 : 3;
    rows = asp < 0.9 ? 3 : 2;
  }
  function grid(i: number) {
    const vh = 2 * GZ * tanH, vw = vh * asp, gw = vw * (cols === 3 ? 0.74 : 0.88), gap = gw * 0.017;
    const cw = (gw - gap * (cols - 1)) / cols, ch = cw / (CARD_W / CARD_H), gh = ch * rows + gap * 1.6 * (rows - 1);
    const c = i % cols, r = Math.floor(i / cols);
    return { x: -gw / 2 + cw / 2 + c * (cw + gap), y: gh / 2 - ch / 2 - r * (ch + gap * 1.6), w: cw, h: ch, vw, vh, c, r };
  }
  addEventListener('resize', resize);
  resize();
  buildPath();

  /* ---------- scroll (relative to this section) ---------- */
  let target = 0, p = 0;
  const readScroll = () => {
    const top = track.getBoundingClientRect().top + scrollY;
    target = clamp((scrollY - top) / (track.offsetHeight - innerHeight));
  };
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', readScroll);
  readScroll();
  p = target;

  /* ---------- pose ---------- */
  const op = new THREE.Vector3(), ot = new THREE.Vector3(), up = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), vp = new THREE.Vector3();
  function poseRibbon(c: Card, head: number) {
    const pos = c.geo.attributes.position, centre = head - c.i * STEP;
    for (let iy = 0; iy <= NY; iy++) for (let ix = 0; ix <= NX; ix++) {
      const k = iy * (NX + 1) + ix, lu = ix / NX - 0.5, lv = 0.5 - iy / NY;
      at(centre + lu * CARD_W, op, ot);
      // keep the sheet upright, leaning a little into the turn
      up.copy(Y).addScaledVector(ot, -Y.dot(ot)).normalize();
      vp.copy(op).addScaledVector(up, lv * CARD_H);
      pos.setXYZ(k, vp.x, vp.y, vp.z);
    }
    pos.needsUpdate = true;
  }
  function poseGrid(c: Card, qq: number) {
    const g = grid(c.i), pos = c.geo.attributes.position;
    const dx = (g.c - (cols - 1) / 2) * 1.2, dy = g.r < rows / 2 ? 1 : -1;
    const ox = dx * g.vw * 0.62 * (1 - qq), oy = dy * g.vh * (g.c === 1 ? 0.95 : 0.34) * (1 - qq), tilt = (1 - qq) * 0.22 * (g.c - 1 || 0.5) * dy;
    const cs = Math.cos(tilt), sn = Math.sin(tilt);
    for (let iy = 0; iy <= NY; iy++) for (let ix = 0; ix <= NX; ix++) {
      const k = iy * (NX + 1) + ix, x = (ix / NX - 0.5) * g.w, y = (0.5 - iy / NY) * g.h;
      pos.setXYZ(k, g.x + ox + x * cs - y * sn, g.y + oy + x * sn + y * cs, -GZ - (1 - qq) * 0.6 * Math.sin((ix / NX) * Math.PI));
    }
    pos.needsUpdate = true;
    c.rect = g;
  }

  const RIB_A = 0.14, RIB_B = 0.63;
  const l1 = q('l1'), l2 = q('l2'), cap = q('cap'), rule = q('rule');
  const introEls = ['hint', 'cross', 'glow'].map((n) => q(n));
  function render() {
    const pp = p;
    // headline runs right across the page in opposite directions
    const rise = 1 - out(span(pp, 0, 0.12));
    const run = mix(-50, 76, span(pp, 0, 0.58));
    l1.style.transform = `translate3d(${run}vw,${rise * 34}vh,0)`;
    l2.style.transform = `translate3d(${-run}vw,${rise * 34}vh,0)`;
    cap.style.opacity = String(1 - span(pp, 0.52, 0.57));
    cap.style.transform = `translate(-50%,calc(-50% + ${rise * 34}vh))`;
    const intro = String(1 - span(pp, 0, 0.05));
    for (const el of introEls) el.style.opacity = intro;
    rule.style.transform = `scaleX(${ease(span(pp, 0.72, 0.86))})`;
    // ribbon, then the grid
    const pr = span(pp, RIB_A, RIB_B), head = mix(0, PATH_L + cards.length * STEP, pr);
    for (const c of cards) {
      const s = head - c.i * STEP, end = PATH_L - CARD_W;
      if (s < end) {
        c.mesh.visible = s > CARD_W;
        c.rect = null;
        if (c.mesh.visible) poseRibbon(c, head);
      } else if (c.i < cols * rows) {
        // each card flies to its slot the moment it leaves the rail
        const st = mix(RIB_A, RIB_B, (end + c.i * STEP) / (PATH_L + cards.length * STEP)), qq = out(span(pp, st, st + 0.13));
        c.mesh.visible = qq > 0.001;
        if (c.mesh.visible) poseGrid(c, qq);
      } else {
        c.mesh.visible = false;
        c.rect = null;
      }
    }
    renderer.render(scene, camera);
  }

  /* ---------- hover + click (grid phase) ---------- */
  const nameEl = q('name');
  let hovered: Card | null = null;
  const hitTest = (clientX: number, clientY: number) => {
    if (p <= 0.86) return null;
    const r = stage.getBoundingClientRect();
    const nx = (clientX - r.left) / W - 0.5, ny = 0.5 - (clientY - r.top) / H;
    let hit: Card | null = null;
    for (const c of cards) {
      const g = c.rect;
      if (!g) continue;
      const x = nx * g.vw, y = ny * g.vh;
      if (Math.abs(x - g.x) < g.w / 2 && Math.abs(y - g.y) < g.h / 2) hit = c;
    }
    return hit;
  };
  stage.addEventListener('pointermove', (e) => {
    hovered = hitTest(e.clientX, e.clientY);
    nameEl.style.opacity = hovered ? '1' : '0';
    canvas.style.cursor = hovered ? 'pointer' : '';
    if (hovered) {
      const r = stage.getBoundingClientRect();
      nameEl.textContent = hovered.title;
      nameEl.style.transform = `translate(${e.clientX - r.left + 14}px,${e.clientY - r.top + 16}px)`;
    }
  });
  stage.addEventListener('click', (e) => {
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) window.location.href = hit.href;
  });

  /* ---------- loop (only while the section is on screen) ---------- */
  let visible = false;
  let running = false;
  const loop = () => {
    if (!visible || document.hidden) {
      running = false;
      cards.forEach((c) => c.v && !c.v.paused && c.v.pause());
      return;
    }
    p += (target - p) * 0.09;
    if (Math.abs(target - p) < 0.00005) p = target;
    for (const c of cards) {
      if (!c.v) continue;
      if (c.mesh.visible && c.v.paused) c.v.play().catch(() => {});
      else if (!c.mesh.visible && !c.v.paused) c.v.pause();
    }
    render();
    requestAnimationFrame(loop);
  };
  const wake = () => {
    if (running || !visible || document.hidden) return;
    running = true;
    requestAnimationFrame(loop);
  };
  new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    wake();
  }).observe(section);
  document.addEventListener('visibilitychange', wake);
  render();
}
