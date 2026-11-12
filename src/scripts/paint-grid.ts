/**
 * Shared "painted grid": hairline cells drawn on a canvas; cells light up in
 * clay where the pointer (or a finger) passes and fade out, and now and then
 * a random cell lights by itself so the grid breathes. Used by the hero
 * (small band hugging the name) and the contact block (full area).
 * Canvas 2D, DPR ≤ 2, and the loop only runs while cells are fading and the
 * grid is on screen. Reduced motion: a few fixed cells, no animation.
 */
import { hasFinePointer, prefersReducedMotion } from './motion/capabilities';

export type Band = { x0: number; y0: number; cols: number; rows: number };

interface Options {
  /** Where the grid sits inside `root`, in CSS px, for the given size + cell. */
  band: (w: number, h: number, cell: number) => Band;
  /** Cell size for a given root width. */
  cell?: (w: number) => number;
  line: string;
  lineAlpha?: number;
  fill: string;
  /** Strongest opacity of a lit cell (keep text on top readable). */
  maxAlpha?: number;
  /** Seconds between random "breathing" cells (0 = off). */
  breathe?: number;
  /** Extra elements whose size changes should re-layout the grid. */
  observe?: Element[];
}

export function paintGrid(root: HTMLElement, canvas: HTMLCanvasElement, o: Options) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const cellFor = o.cell ?? ((w: number) => (w < 700 ? 40 : 64));
  const lineAlpha = o.lineAlpha ?? 0.16;
  const maxAlpha = o.maxAlpha ?? 1;

  let w = 0, h = 0, cell = 64;
  let b: Band = { x0: 0, y0: 0, cols: 0, rows: 0 };
  const heat = new Map<number, number>(); // cell index → 0..1

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = o.fill;
    for (const [k, v] of heat) {
      const cx = k % b.cols, cy = Math.floor(k / b.cols);
      ctx.globalAlpha = v * maxAlpha;
      ctx.fillRect(b.x0 + cx * cell, b.y0 + cy * cell, cell, cell);
    }
    ctx.globalAlpha = lineAlpha;
    ctx.strokeStyle = o.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= b.cols; c++) {
      const x = b.x0 + c * cell + 0.5;
      ctx.moveTo(x, b.y0); ctx.lineTo(x, b.y0 + b.rows * cell);
    }
    for (let r = 0; r <= b.rows; r++) {
      const y = b.y0 + r * cell + 0.5;
      ctx.moveTo(b.x0, y); ctx.lineTo(b.x0 + b.cols * cell, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const resize = () => {
    const r = root.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = cellFor(w);
    const nb = o.band(w, h, cell);
    if (nb.cols !== b.cols || nb.rows !== b.rows) heat.clear();
    b = nb;
    draw();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(root);
  o.observe?.forEach((el) => ro.observe(el));

  if (prefersReducedMotion()) {
    // Calm: three fixed cells, no animation.
    const n = b.cols * b.rows;
    if (n) [1, b.cols + Math.min(4, b.cols - 1), n - 2].forEach((k) => heat.set(Math.max(0, k) % n, 0.8));
    return draw();
  }

  let running = false, visible = true, last = 0;
  const loop = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    for (const [k, v] of heat) {
      const nv = v - dt / 1.2; // fade over ~1.2 s
      if (nv <= 0) heat.delete(k); else heat.set(k, nv);
    }
    draw();
    if (heat.size && visible) requestAnimationFrame(loop);
    else running = false;
  };
  const kick = () => {
    if (running || !visible) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  };
  const light = (cx: number, cy: number, v = 1) => {
    if (cx < 0 || cy < 0 || cx >= b.cols || cy >= b.rows) return;
    const k = cy * b.cols + cx;
    heat.set(k, Math.max(heat.get(k) ?? 0, v));
    kick();
  };
  const at = (x: number, y: number) => {
    const r = root.getBoundingClientRect();
    light(Math.floor((x - r.left - b.x0) / cell), Math.floor((y - r.top - b.y0) / cell));
  };
  if (hasFinePointer()) root.addEventListener('pointermove', (e) => at(e.clientX, e.clientY));
  else root.addEventListener('touchmove', (e) => at(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

  if (o.breathe) {
    setInterval(() => {
      if (visible && b.cols) light(Math.floor(Math.random() * b.cols), Math.floor(Math.random() * b.rows), 0.85);
    }, o.breathe * 1000);
  }
  new IntersectionObserver((en) => { visible = en.some((x) => x.isIntersecting); kick(); }).observe(root);
}
