/**
 * Motion entry point (loaded on every page from BaseLayout).
 * Tiny by itself; heavy modules (GSAP, Lenis) are dynamically imported only
 * for mouse users who allow motion, so phones and reduced-motion visitors
 * never download them.
 */
import { allowsPointerMotion, getTier, hasFinePointer } from './capabilities';
import { initSound } from './sound';
import { initButtonFill } from './button-fill';
import { initReveal } from './reveal';

getTier(); // sets html[data-motion] early for CSS hooks
initSound();
initReveal();
if (hasFinePointer()) initButtonFill();

if (allowsPointerMotion()) {
  // Parallel imports; Vite puts GSAP in one shared chunk.
  void Promise.all([import('./smooth-scroll'), import('./cursor'), import('./magnetic')]).then(
    ([scroll, cursor, magnetic]) => {
      scroll.initSmoothScroll();
      cursor.initCursor();
      magnetic.initMagnetic();
    },
  );
}
