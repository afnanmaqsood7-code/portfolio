/**
 * Buttons fill from the point where the pointer entered, and empty toward
 * the point where it left. JS only sets two CSS variables (--fx, --fy);
 * the animation itself is a CSS clip-path transition (see Button.astro).
 * No dependencies; runs for every mouse user (reduced motion = instant fill).
 */
export function initButtonFill() {
  document.documentElement.classList.add('has-button-fill');

  const setOrigin = (btn: HTMLElement, e: PointerEvent) => {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--fx', `${((e.clientX - r.left) / r.width) * 100}%`);
    btn.style.setProperty('--fy', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  // pointerover/out bubble (pointerenter doesn't), so one listener covers
  // every button, including ones added by future page swaps.
  document.addEventListener('pointerover', (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('.btn');
    if (!btn || btn.contains(e.relatedTarget as Node)) return;
    setOrigin(btn, e);
    btn.classList.add('is-filled');
  });
  document.addEventListener('pointerout', (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('.btn');
    if (!btn || btn.contains(e.relatedTarget as Node)) return;
    setOrigin(btn, e);
    btn.classList.remove('is-filled');
  });
}
