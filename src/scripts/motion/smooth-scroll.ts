/**
 * Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger and every
 * GSAP animation share one clock (no double rAF loops, no jitter).
 * Loaded only for mouse users who allow motion (see index.ts); touch devices
 * keep native momentum scrolling.
 */
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

export function initSmoothScroll() {
  if (lenis) return lenis;
  lenis = new Lenis({
    autoRaf: false,
    lerp: 0.1, // lower = floatier. 0.1 feels weighted but responsive.
    smoothWheel: true,
    syncTouch: false,
  });
  // Exposed so lazily-loaded modules (e.g. the desk scene) can scroll
  // without importing Lenis themselves.
  (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Same-page anchor links (#work, #contact, skip link): scroll smoothly,
  // then MOVE FOCUS to the target so keyboard and screen-reader users land
  // where the page scrolled to.
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    // No manual offset: Lenis honours html { scroll-padding-top } (global.css),
    // which already clears the sticky header.
    lenis!.scrollTo(target);
    history.pushState(null, '', url.hash);
    if (!target.matches('a, button, input, select, textarea, [tabindex]')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
  });

  return lenis;
}
