/**
 * "At the desk" scroll scene (home). Animates the inline SVG illustration
 * (components/home/DeskIllustration.astro) — no WebGL, so it is light enough
 * for phones too.
 *
 * - Pin: CSS `position: sticky`; ScrollTrigger supplies progress + velocity.
 * - One chapter (real HTML) per featured project; the active one shows.
 * - The device on the desk MORPHS between projects (monitor ⇄ laptop ⇄
 *   tablet ⇄ phone, from each project's `device` frontmatter) and its screen
 *   switches to the project's cover with a short flicker.
 * - On desktop she rolls across the screen between projects (desk and all);
 *   the project text appears on the side she left.
 * - She types (faster when you scroll fast), the hijab sways, her head turns
 *   a little toward the cursor.
 * - At the end the SVG "camera" (viewBox) zooms until the screen fills the
 *   view, then the All work grid scrolls in.
 * Tier "none" (reduced motion) never runs this: the static illustration stays.
 */
import { getTier, hasFinePointer } from './capabilities';
import { matchesLens, parseLens, type Lens, type ProjectLens } from '../../utils/lens';
import { DEVICES, deviceGeometry, mixDevice, type DeviceKind, type DeviceShape } from '../../utils/desk-devices';

const PUSH_START = 0.84; // last 16% of the scroll = push into the screen
const MORPH_FROM = 0.62; // each morph runs over the last 38% of a chapter
/** Bounding box of the illustration's content (in its 500×450 space). */
const CONTENT = { x: 108, y: 80, w: 290, h: 305 };
/** Desktop: where her desk sits across the stage (fraction of the width),
 *  alternating per chapter so she rolls across the screen between projects.
 *  The project text appears on the opposite side. */
const SIDES = [0.3, 0.7];

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export async function initDesk() {
  const found = document.querySelector<HTMLElement>('[data-desk]');
  if (!found || found.dataset.ready) return;
  const section: HTMLElement = found;
  section.dataset.ready = 'true';
  const tier = getTier();
  if (tier === 'none') return; // reduced motion: static illustration

  const pin = section.querySelector<HTMLElement>('[data-desk-pin]')!;
  const stage = section.querySelector<HTMLElement>('[data-desk-stage]')!;
  const svg = section.querySelector<SVGSVGElement>('[data-ill-root]')!;
  const label = section.querySelector<HTMLElement>('[data-desk-label]')!;
  const list = section.querySelector<HTMLElement>('[data-desk-chapters]')!;
  const all = Array.from(list.querySelectorAll<HTMLElement>('[data-chapter]'));
  const part = <T extends Element = SVGElement>(name: string) => svg.querySelector<T>(`[data-ill="${name}"]`)!;

  const el = {
    bezel: part('bezel'),
    screenPaths: ['screen-clip', 'screen-bg', 'scanlines', 'flash'].map((n) => part(n)),
    flash: part('flash'),
    scanlines: part('scanlines'),
    imgA: part<SVGImageElement>('img-a'),
    imgB: part<SVGImageElement>('img-b'),
    keyboard: part('keyboard'),
    stand: part('stand'),
    mouse: part('mouse'),
    logo: part('logo'),
    screen: part('screen'),
    forearm: part('forearm'),
    drape: part('drape'),
    head: part('head'),
  };

  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);
  section.classList.add('desk--live');

  // ---------- Chapters (follow the role lens) ----------
  let chapters: HTMLElement[] = [];
  let devices: DeviceKind[] = [];
  let index = -1;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  function applyLens(lens: Lens) {
    const key = `order${cap(lens)}` as const;
    chapters = all
      .filter((c) => matchesLens(c.dataset.lens as ProjectLens, lens))
      .sort((a, b) => Number(a.dataset[key]) - Number(b.dataset[key]));
    all.forEach((c) => (c.hidden = !chapters.includes(c)));
    chapters.forEach((c, j) => {
      list.appendChild(c); // DOM order = visual order
      c.dataset.side = j % 2 === 0 ? 'right' : 'left'; // text opposite her
    });
    devices = chapters.map((c) => (c.dataset.device as DeviceKind) || 'desktop');
    section.style.setProperty('--chapters', String(chapters.length));
    index = -1;
    ScrollTrigger.refresh();
  }

  // ---------- Device morph ----------
  let shape: DeviceShape = DEVICES.desktop;
  function applyShape(s: DeviceShape) {
    shape = s;
    const g = deviceGeometry(s);
    el.bezel.setAttribute('d', g.bezel);
    el.screenPaths.forEach((p) => p.setAttribute('d', g.screen));
    for (const img of [el.imgA, el.imgB]) {
      img.setAttribute('transform', g.image.transform);
      img.setAttribute('width', String(g.image.width));
      img.setAttribute('height', String(g.image.height));
    }
    el.keyboard.setAttribute('d', g.keyboard);
    el.keyboard.setAttribute('opacity', s.kbOpacity.toFixed(3));
    el.stand.setAttribute('opacity', s.stand.toFixed(3));
    el.mouse.setAttribute('opacity', s.mouse.toFixed(3));
    el.logo.setAttribute('opacity', s.logo.toFixed(3));
    return g;
  }
  function shapeAt(progress: number) {
    const n = Math.max(1, devices.length);
    const story = clamp(progress / PUSH_START, 0, 0.9999) * n;
    const i = Math.floor(story);
    const t = easeInOut(clamp((story - i - MORPH_FROM) / (1 - MORPH_FROM), 0, 1));
    const a = DEVICES[devices[i] ?? 'desktop'];
    const b = DEVICES[devices[Math.min(i + 1, n - 1)] ?? 'desktop'];
    return i < n - 1 ? mixDevice(a, b, t) : a;
  }

  /** Where she is across the stage (0–1) and how far through a roll (0–1). */
  function travelAt(progress: number) {
    const n = Math.max(1, chapters.length);
    const story = clamp(progress / PUSH_START, 0, 0.9999) * n;
    const i = Math.floor(story);
    const t = i < n - 1 ? easeInOut(clamp((story - i - MORPH_FROM) / (1 - MORPH_FROM), 0, 1)) : 0;
    const from = SIDES[i % 2];
    const to = SIDES[(i + 1) % 2];
    return { f: lerp(from, to, t), rolling: Math.sin(t * Math.PI) };
  }

  // ---------- Camera (viewBox) ----------
  function baseView(aspect: number, f: number, rolling: number) {
    // Desktop: she sits at fraction `f` of the width (moves between chapters).
    // Narrow stages (phones, where the stage is the top part): centred.
    if (aspect >= 1.2) {
      // Smaller than the stage and a little low, so it clears the heading.
      const h = CONTENT.h * 1.45;
      const w = h * aspect;
      const bob = rolling * 2.5; // a tiny lift mid-roll, like chair wheels on a floor
      return { x: CONTENT.x + CONTENT.w / 2 - w * f, y: CONTENT.y + CONTENT.h / 2 - h * 0.62 + bob, w, h };
    }
    const h = Math.max(CONTENT.h * 1.06, (CONTENT.w * 1.06) / aspect);
    const w = h * aspect;
    return { x: CONTENT.x + CONTENT.w / 2 - w / 2, y: CONTENT.y + CONTENT.h / 2 - h / 2, w, h };
  }
  function setView(progress: number) {
    const r = stage.getBoundingClientRect();
    const aspect = Math.max(0.3, r.width / Math.max(1, r.height));
    const { f, rolling } = travelAt(progress);
    const base = baseView(aspect, lerp(f, 0.5, easeInOut(clamp((progress - PUSH_START) / (1 - PUSH_START), 0, 1))), rolling);
    const push = easeInOut(clamp((progress - PUSH_START) / (1 - PUSH_START), 0, 1));
    // Scanlines read as stripes when zoomed in: fade them out with the push.
    el.scanlines.setAttribute('opacity', (0.18 * (1 - push)).toFixed(3));
    if (push <= 0) {
      svg.setAttribute('viewBox', `${base.x} ${base.y} ${base.w} ${base.h}`);
      return;
    }
    // Zoom until the screen covers the stage (log-lerp = even-feeling zoom).
    const s = deviceGeometry(shape).screenBox;
    const tw = s.w / s.h > aspect ? s.h * 0.92 * aspect : s.w * 0.92;
    const w = Math.exp(lerp(Math.log(base.w), Math.log(tw), push));
    const h = w / aspect;
    const cx = lerp(base.x + base.w / 2, s.x + s.w / 2, push);
    const cy = lerp(base.y + base.h / 2, s.y + s.h / 2, push);
    svg.setAttribute('viewBox', `${cx - w / 2} ${cy - h / 2} ${w} ${h}`);
  }

  // ---------- Screen: cover switch with flicker ----------
  let currentCover = el.imgA.getAttribute('href') ?? '';
  let flicker: gsap.core.Timeline | null = null;
  function showCover(url: string) {
    if (!url || url === currentCover) return;
    currentCover = url;
    flicker?.kill();
    el.imgB.setAttribute('href', url);
    gsap.set(el.imgB, { opacity: 0 });
    flicker = gsap
      .timeline({
        onComplete: () => {
          el.imgA.setAttribute('href', url);
          gsap.set(el.imgB, { opacity: 0 });
          gsap.set(el.screen, { x: 0 });
        },
      })
      .to(el.flash, { opacity: 0.75, duration: 0.07, ease: 'power2.in' })
      .to(el.screen, { x: 2, duration: 0.04, ease: 'steps(1)' }, 0)
      .to(el.screen, { x: -2, duration: 0.04, ease: 'steps(1)' }, 0.04)
      .set(el.imgB, { opacity: 1 }, 0.07)
      .to(el.flash, { opacity: 0, duration: 0.2, ease: 'power2.out' }, 0.08)
      .to(el.screen, { x: 0, duration: 0.04, ease: 'steps(1)' }, 0.08);
  }

  function activate(i: number) {
    if (i === index || !chapters[i]) return;
    index = i;
    chapters.forEach((c, j) => c.toggleAttribute('data-active', j === i));
    const c = chapters[i];
    label.textContent = c.dataset.label ?? String(i + 1).padStart(2, '0');
    showCover(c.dataset.cover ?? '');
  }

  // ---------- Scroll ----------
  let progress = 0;
  let typingTarget = 1;
  const trigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate(self) {
      progress = self.progress;
      activate(Math.floor(Math.min(progress / PUSH_START, 0.9999) * chapters.length));
      applyShape(shapeAt(progress));
      setView(progress);
      pin.style.setProperty('--push', Math.max(0, (progress - PUSH_START) / (1 - PUSH_START)).toFixed(3));
      // Desktop only: text fades while she rolls to the other side.
      const roll = stage.clientWidth / Math.max(1, stage.clientHeight) >= 1.2 ? travelAt(progress).rolling : 0;
      pin.style.setProperty('--roll', roll.toFixed(3));
      typingTarget = Math.max(typingTarget, 1 + Math.min(Math.abs(self.getVelocity()) / 2600, 1) * 1.6);
    },
  });

  // Keyboard: tabbing to a chapter's link scrolls to that chapter.
  list.addEventListener('focusin', (e) => {
    const c = (e.target as Element).closest<HTMLElement>('[data-chapter]');
    const i = c ? chapters.indexOf(c) : -1;
    if (i < 0 || i === index) return;
    const y = trigger.start + ((i + 0.5) / chapters.length) * PUSH_START * (trigger.end - trigger.start);
    const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, o?: object) => void } }).__lenis;
    if (lenis) lenis.scrollTo(y, { immediate: true });
    else window.scrollTo(0, y);
  });

  // Click the screen → current project.
  el.screen.addEventListener('click', () => {
    const href = chapters[index]?.querySelector('a')?.getAttribute('href');
    if (href) window.location.href = href;
  });
  (el.screen as SVGElement).style.cursor = 'pointer';

  // ---------- Idle life: typing, sway, head-follow (only while visible) ----------
  const pointer = { x: 0, y: 0, near: false };
  if (hasFinePointer()) {
    document.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.near = e.clientY > r.top && e.clientY < r.bottom;
    });
  }
  let phase = 0;
  let speed = 1;
  let yaw = 0;
  let time = 0;
  const tick = (_t: number, deltaMs: number) => {
    const dt = Math.min(deltaMs / 1000, 0.05);
    time += dt;
    speed = lerp(speed, typingTarget, 1 - Math.exp(-dt * 4));
    typingTarget = lerp(typingTarget, 1, 1 - Math.exp(-dt * 1.5)); // relax when idle
    // Typing only when there's a keyboard; hands rest for tablet/phone.
    const kb = shape.kbOpacity;
    phase += dt * 10 * speed;
    const tap = Math.pow(Math.max(0, Math.sin(phase)), 3) * kb;
    el.forearm.setAttribute('transform', `rotate(${(-tap * 2.2 + Math.sin(phase * 0.37) * 0.8 * kb).toFixed(2)} 288 226)`);
    el.drape.setAttribute('transform', `rotate(${(Math.sin(time * 0.7 + 1) * 0.7).toFixed(2)} 322 166)`);
    // Head turns toward the cursor (screen-space approximation, ±5°).
    let target = 0;
    if (pointer.near) {
      const r = stage.getBoundingClientRect();
      const headX = r.left + r.width * 0.45;
      target = clamp((pointer.x - headX) / (r.width * 0.5), -1, 1) * 5;
    }
    yaw = lerp(yaw, target, 1 - Math.exp(-dt * 4));
    el.head.setAttribute('transform', `rotate(${(-yaw).toFixed(2)} 322 168) translate(${(yaw * 0.25).toFixed(2)} 0)`);
  };
  let running = false;
  let visible = false;
  const update = () => {
    const on = visible && !document.hidden;
    if (on === running) return;
    running = on;
    if (on) gsap.ticker.add(tick);
    else gsap.ticker.remove(tick);
  };
  new IntersectionObserver((entries) => {
    visible = entries.some((en) => en.isIntersecting);
    update();
  }).observe(section);
  document.addEventListener('visibilitychange', update);

  // Re-frame on resize.
  new ResizeObserver(() => setView(progress)).observe(stage);

  document.addEventListener('lens:change', (e) => applyLens((e as CustomEvent<{ lens: Lens }>).detail.lens));
  applyLens(parseLens(new URLSearchParams(location.search).get('lens')));
  activate(0);
  applyShape(shapeAt(trigger.progress));
  setView(trigger.progress);
  section.classList.add('desk--ready');
}
