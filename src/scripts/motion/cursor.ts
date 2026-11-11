/**
 * Custom cursor: a soft dot that trails the pointer (lerp via gsap.quickTo).
 * States come from the element under the pointer:
 *   [data-cursor="view"]  → grows, shows "View"   (project cards)
 *   [data-cursor="play"]  → grows, shows "Play"   (videos)
 *   [data-cursor="brush"] → becomes a brush dab   (painted elements)
 *   links / buttons       → hollow ring
 * Canvas scenes can't use data attributes per object, so they dispatch
 *   document.dispatchEvent(new CustomEvent('cursor:state', { detail: 'view' }))
 * and `detail: null` to release the override.
 * The markup lives in components/ui/Cursor.astro (hidden until this runs).
 * Purely decorative: aria-hidden, pointer-events: none.
 */
import { gsap } from 'gsap';

type State = 'default' | 'hover' | 'view' | 'play' | 'brush';
const LABELS: Partial<Record<State, string>> = { view: 'View', play: 'Play' };
const INTERACTIVE = 'a, button, [role="button"], label, summary, select';

export function initCursor() {
  const el = document.querySelector<HTMLElement>('[data-cursor-root]');
  if (!el || el.dataset.ready) return;
  el.dataset.ready = 'true';
  const label = el.querySelector<HTMLElement>('[data-cursor-label]')!;

  // quickTo = one reusable tween per axis; `duration` is the lag.
  const toX = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
  const toY = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });

  let state: State = 'default';
  let override: State | null = null; // set by canvas scenes via 'cursor:state'
  let underPointer: State = 'default';
  const setState = (next: State) => {
    if (next === state) return;
    state = next;
    el.dataset.state = next;
    label.textContent = LABELS[next] ?? '';
  };

  document.documentElement.classList.add('has-custom-cursor');
  el.hidden = false;

  let first = true;
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (first) {
      gsap.set(el, { x: e.clientX, y: e.clientY }); // no swoop-in from 0,0
      first = false;
    }
    toX(e.clientX);
    toY(e.clientY);
    el.dataset.visible = 'true';
  });

  document.addEventListener('pointerover', (e) => {
    const t = e.target as Element;
    const tagged = t.closest<HTMLElement>('[data-cursor]');
    underPointer = tagged ? (tagged.dataset.cursor as State) : t.closest(INTERACTIVE) ? 'hover' : 'default';
    setState(override ?? underPointer);
  });

  document.addEventListener('cursor:state', (e) => {
    override = ((e as CustomEvent<State | null>).detail ?? null) as State | null;
    setState(override ?? underPointer);
  });

  // Hide when the pointer leaves the window; shrink on press for feedback.
  document.documentElement.addEventListener('pointerleave', () => (el.dataset.visible = 'false'));
  document.addEventListener('pointerdown', () => el.classList.add('is-pressed'));
  document.addEventListener('pointerup', () => el.classList.remove('is-pressed'));
}
