/**
 * Desk scene controller (no three.js in here).
 * - Decides live vs fallback (tier "full" only gets the live scene).
 * - Pins via CSS `position: sticky`; ScrollTrigger reads progress/velocity.
 * - Activates one HTML chapter at a time, updates the big label and the
 *   moving background lines, follows the role lens, keeps keyboard focus
 *   and scroll in sync.
 * - Lazy-loads the three.js scene ~1 viewport before the section, and pauses
 *   it when off screen or when the tab is hidden.
 */
import { getTier } from '../../motion/capabilities';
import { matchesLens, parseLens, type Lens, type ProjectLens } from '../../../utils/lens';
import { DESK } from './config';
import type { DeskScene } from './scene';

export async function initDesk() {
  const found = document.querySelector<HTMLElement>('[data-desk]');
  if (!found || found.dataset.ready) return;
  const section: HTMLElement = found; // non-null for the closures below
  section.dataset.ready = 'true';
  if (getTier() !== 'full') return; // phones, low power, reduced motion: static fallback stays

  const stage = section.querySelector<HTMLElement>('[data-desk-stage]')!;
  const pin = section.querySelector<HTMLElement>('[data-desk-pin]')!;
  const label = section.querySelector<HTMLElement>('[data-desk-label]')!;
  const list = section.querySelector<HTMLElement>('[data-desk-chapters]')!;
  const all = Array.from(list.querySelectorAll<HTMLElement>('[data-chapter]'));

  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);

  section.classList.add('desk--live');

  // ---------- Chapters (follow the role lens) ----------
  let chapters: HTMLElement[] = [];
  let index = -1;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  function applyLens(lens: Lens) {
    const key = `order${cap(lens)}` as const;
    chapters = all
      .filter((c) => matchesLens(c.dataset.lens as ProjectLens, lens))
      .sort((a, b) => Number(a.dataset[key]) - Number(b.dataset[key]));
    all.forEach((c) => (c.hidden = !chapters.includes(c)));
    chapters.forEach((c) => list.appendChild(c)); // DOM order = visual order
    section.style.setProperty('--chapters', String(chapters.length));
    index = -1;
    ScrollTrigger.refresh();
  }

  function activate(i: number) {
    if (i === index || !chapters[i]) return;
    index = i;
    chapters.forEach((c, j) => c.toggleAttribute('data-active', j === i));
    const c = chapters[i];
    label.textContent = c.dataset.label ?? String(i + 1).padStart(2, '0');
    scene?.showCover(c.dataset.cover!);
  }

  // ---------- Scroll ----------
  let scene: DeskScene | null = null;
  const trigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate(self) {
      const p = self.progress;
      const story = Math.min(p / DESK.pushStart, 0.9999);
      activate(Math.floor(story * chapters.length));
      // Lines drift upward with scroll; text fades out during the push-in.
      pin.style.setProperty('--line-offset', `${(-self.scroll() * 0.35).toFixed(1)}px`);
      pin.style.setProperty('--push', Math.max(0, (p - DESK.pushStart) / (1 - DESK.pushStart)).toFixed(3));
      scene?.setProgress(p);
      scene?.setVelocity(self.getVelocity());
    },
  });

  // Keyboard: tabbing to a chapter's link scrolls to that chapter.
  list.addEventListener('focusin', (e) => {
    const c = (e.target as Element).closest<HTMLElement>('[data-chapter]');
    const i = c ? chapters.indexOf(c) : -1;
    if (i < 0 || i === index) return;
    const y = trigger.start + ((i + 0.5) / chapters.length) * DESK.pushStart * (trigger.end - trigger.start);
    const lenis = lenisOrNull();
    if (lenis) lenis.scrollTo(y, { immediate: true });
    else window.scrollTo(0, y);
  });

  // Role lens lives in the grid below; it announces changes on document.
  document.addEventListener('lens:change', (e) => applyLens((e as CustomEvent<{ lens: Lens }>).detail.lens));
  applyLens(parseLens(new URLSearchParams(location.search).get('lens')));
  activate(0);

  // ---------- Lazy-load three.js near the viewport ----------
  let visible = false;
  const updateActive = () => scene?.setActive(visible && !document.hidden);

  const near = new IntersectionObserver(
    async (entries) => {
      if (!entries.some((en) => en.isIntersecting) || scene) return;
      near.disconnect();
      try {
        const { createDeskScene } = await import('./scene');
        scene = await createDeskScene(stage);
        scene.onScreenClick(() => {
          const href = chapters[index]?.querySelector('a')?.getAttribute('href');
          if (href) window.location.href = href;
        });
        scene.setProgress(trigger.progress);
        if (chapters[index]) scene.showCover(chapters[index].dataset.cover!);
        section.classList.add('desk--ready'); // fades the painted poster out
        updateActive();
      } catch (err) {
        // WebGL unavailable or crashed: fall back to the static layout.
        console.warn('[desk] live scene unavailable, using the static fallback.', err);
        section.classList.remove('desk--live');
        trigger.kill();
      }
    },
    { rootMargin: '100% 0px' },
  );
  near.observe(section);

  // Pause when the section is off screen or the tab is hidden.
  new IntersectionObserver((entries) => {
    visible = entries.some((en) => en.isIntersecting);
    updateActive();
  }).observe(section);
  document.addEventListener('visibilitychange', updateActive);
}

/** Lenis is optional (loaded for mouse users); read it without importing it. */
function lenisOrNull(): { scrollTo: (y: number, o?: { immediate?: boolean }) => void } | null {
  return (window as unknown as { __lenis?: { scrollTo: (y: number, o?: { immediate?: boolean }) => void } }).__lenis ?? null;
}
