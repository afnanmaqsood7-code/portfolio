/**
 * Morphing device for the desk illustration (2D, in the illustration's own
 * 500×450 coordinate space and perspective).
 *
 * Every device is a parallelogram: `o` = bottom-left corner of the frame,
 * `R` = vector along the bottom edge, `U` = vector up the left edge (leaning
 * back like the original monitor). The screen is that frame inset by
 * fractions; the keyboard is a 4-point quad on the desk. Morphing = linear
 * interpolation of all numbers, then rebuilding the path strings.
 *
 * Used at build time (initial markup, so it works without JS) and in the
 * browser (scroll morph). Dependency-free.
 */
export type DeviceKind = 'desktop' | 'laptop' | 'tablet' | 'phone';

type V = [number, number];
export interface DeviceShape {
  o: V;
  R: V;
  U: V;
  radius: number;
  inset: [number, number, number, number]; // left, right, top, bottom (fractions)
  kb: [V, V, V, V]; // keyboard / laptop base quad
  kbOpacity: number;
  stand: number; // 0–1 desktop stand
  mouse: number;
  logo: number;
}

const KB_DESKTOP: DeviceShape['kb'] = [[191.5, 212.5], [278.5, 198], [300.5, 205.7], [213.5, 220.2]];
const KB_HIDDEN: DeviceShape['kb'] = [[230, 211], [262, 206], [270, 209], [238, 214]];

export const DEVICES: Record<DeviceKind, DeviceShape> = {
  desktop: {
    o: [176, 187], R: [122.7, -17], U: [-19, -82], radius: 3.5,
    inset: [0.022, 0.022, 0.03, 0.2], kb: KB_DESKTOP, kbOpacity: 1, stand: 1, mouse: 1, logo: 1,
  },
  laptop: {
    o: [167, 211], R: [95, -15], U: [-20, -66], radius: 3,
    inset: [0.035, 0.035, 0.045, 0.07],
    kb: [[167, 211], [262, 196], [300, 208], [205, 224]], kbOpacity: 1, stand: 0, mouse: 1, logo: 0,
  },
  tablet: {
    o: [205, 203], R: [58, -8], U: [-13, -82], radius: 5,
    inset: [0.07, 0.07, 0.05, 0.05], kb: KB_HIDDEN, kbOpacity: 0, stand: 0, mouse: 0, logo: 0,
  },
  phone: {
    o: [226, 201], R: [33, -4.6], U: [-10, -64], radius: 6,
    inset: [0.085, 0.085, 0.07, 0.07], kb: KB_HIDDEN, kbOpacity: 0, stand: 0, mouse: 0, logo: 0,
  },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: V, b: V, t: number): V => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

export function mixDevice(a: DeviceShape, b: DeviceShape, t: number): DeviceShape {
  return {
    o: lerpV(a.o, b.o, t),
    R: lerpV(a.R, b.R, t),
    U: lerpV(a.U, b.U, t),
    radius: lerp(a.radius, b.radius, t),
    inset: a.inset.map((v, i) => lerp(v, b.inset[i], t)) as DeviceShape['inset'],
    kb: a.kb.map((p, i) => lerpV(p, b.kb[i], t)) as DeviceShape['kb'],
    kbOpacity: lerp(a.kbOpacity, b.kbOpacity, t),
    stand: lerp(a.stand, b.stand, t),
    mouse: lerp(a.mouse, b.mouse, t),
    logo: lerp(a.logo, b.logo, t),
  };
}

const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const mul = (a: V, k: number): V => [a[0] * k, a[1] * k];
const len = (a: V) => Math.hypot(a[0], a[1]);
const f = (n: number) => n.toFixed(2);

/** Parallelogram with rounded corners as an SVG path. */
function roundedQuad(o: V, R: V, U: V, r: number): string {
  const pts: V[] = [o, add(o, R), add(add(o, R), U), add(o, U)]; // BL, BR, TR, TL
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const prev = pts[(i + n - 1) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const toPrev: V = [prev[0] - cur[0], prev[1] - cur[1]];
    const toNext: V = [next[0] - cur[0], next[1] - cur[1]];
    const rr = Math.min(r, len(toPrev) / 2, len(toNext) / 2);
    const a = add(cur, mul(toPrev, rr / len(toPrev)));
    const b = add(cur, mul(toNext, rr / len(toNext)));
    d += `${i === 0 ? 'M' : 'L'} ${f(a[0])} ${f(a[1])} Q ${f(cur[0])} ${f(cur[1])} ${f(b[0])} ${f(b[1])} `;
  }
  return d + 'Z';
}

/** Screen parallelogram (frame inset). */
export function screenQuad(s: DeviceShape) {
  const [l, r, t, b] = s.inset;
  const o = add(add(s.o, mul(s.R, l)), mul(s.U, b));
  const R = mul(s.R, 1 - l - r);
  const U = mul(s.U, 1 - t - b);
  return { o, R, U };
}

export interface DeviceGeometry {
  bezel: string;
  screen: string;
  keyboard: string;
  /** SVG transform + size for an <image> filling the screen. */
  image: { transform: string; width: number; height: number };
  /** Axis-aligned box around the screen (for the push-in zoom). */
  screenBox: { x: number; y: number; w: number; h: number };
}

export function deviceGeometry(s: DeviceShape): DeviceGeometry {
  const sc = screenQuad(s);
  const w = len(sc.R);
  const h = len(sc.U);
  const tl = add(sc.o, sc.U);
  const rx = sc.R[0] / w, ry = sc.R[1] / w; // unit right
  const dx = -sc.U[0] / h, dy = -sc.U[1] / h; // unit down
  const corners = [sc.o, add(sc.o, sc.R), add(add(sc.o, sc.R), sc.U), tl];
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  const k = s.kb;
  return {
    bezel: roundedQuad(s.o, s.R, s.U, s.radius),
    screen: roundedQuad(sc.o, sc.R, sc.U, Math.max(1, s.radius - 1.5)),
    keyboard: `M ${k.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L ')} Z`,
    image: { transform: `matrix(${f(rx)} ${f(ry)} ${f(dx)} ${f(dy)} ${f(tl[0])} ${f(tl[1])})`, width: w, height: h },
    screenBox: { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) },
  };
}
