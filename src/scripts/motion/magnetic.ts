/**
 * Magnetic hover: elements with [data-magnetic="0.3"] drift toward the
 * pointer by that fraction of its offset from their centre, then spring
 * back on leave. Delegated on document, so new pages need no re-binding.
 */
import { gsap } from 'gsap';

export function initMagnetic() {
  let active: HTMLElement | null = null;
  let rect: DOMRect | null = null;
  let toX: gsap.QuickToFunc | null = null;
  let toY: gsap.QuickToFunc | null = null;

  const release = () => {
    if (!active) return;
    gsap.to(active, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)' });
    active = rect = toX = toY = null;
  };

  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = (e.target as Element).closest<HTMLElement>('[data-magnetic]');
    if (el !== active) {
      release();
      if (!el) return;
      active = el;
      // Measure without the current transform so the pull doesn't compound.
      gsap.set(el, { x: 0, y: 0 });
      rect = el.getBoundingClientRect();
      toX = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      toY = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    }
    if (!active || !rect || !toX || !toY) return; // pointer is over nothing magnetic
    const strength = Number(active.dataset.magnetic) || 0.3;
    toX((e.clientX - (rect.left + rect.width / 2)) * strength);
    toY((e.clientY - (rect.top + rect.height / 2)) * strength);
  });
  document.documentElement.addEventListener('pointerleave', release);
}
