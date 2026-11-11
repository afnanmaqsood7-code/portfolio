/**
 * One place that decides how much motion a visitor gets.
 *
 *  full  → desktop-class device, fine pointer, no reduced motion, WebGL2:
 *          smooth scroll, cursor, magnetic, WebGL (from step c).
 *  lite  → small screen, touch, low power, Save-Data or no WebGL2:
 *          native scroll, CSS hovers, simple fades, static painted hero.
 *  none  → prefers-reduced-motion: no smooth scroll, cursor, parallax,
 *          pinning or marquee; instant/opacity-only changes.
 */
export type Tier = 'full' | 'lite' | 'none';

const mq = (q: string) => window.matchMedia(q).matches;

export const prefersReducedMotion = () => mq('(prefers-reduced-motion: reduce)');
/** Mouse or trackpad (not touch-first). */
export const hasFinePointer = () => mq('(hover: hover) and (pointer: fine)');

/** Only clearly weak devices. Ordinary 4-core laptops get the full
 *  experience; the runtime frame-rate guard handles anything slower. */
function isLowPower(): boolean {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return true;
  if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) return true;
  if (nav.deviceMemory && nav.deviceMemory <= 2) return true;
  return false;
}

function hasWebGL2(): boolean {
  try {
    const c = document.createElement('canvas');
    // failIfMajorPerformanceCaveat: refuse software rendering (very slow).
    return !!c.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
  } catch {
    return false;
  }
}

let cached: Tier | null = null;
export function getTier(): Tier {
  if (cached) return cached;
  // Testing aid: ?motion=full|lite|none forces a tier (e.g. to preview the
  // phone fallback on a laptop). Harmless in production.
  const forced = new URLSearchParams(location.search).get('motion');
  let reason = '';
  if (forced === 'full' || forced === 'lite' || forced === 'none') [cached, reason] = [forced, 'forced by ?motion='];
  else if (prefersReducedMotion()) [cached, reason] = ['none', 'system "reduce motion" / animation effects are off'];
  else if (!mq('(min-width: 64rem)')) [cached, reason] = ['lite', 'window narrower than 1024px'];
  else if (!hasFinePointer()) [cached, reason] = ['lite', 'no mouse/trackpad detected'];
  else if (isLowPower()) [cached, reason] = ['lite', 'low-power device or data saver'];
  else if (!hasWebGL2()) [cached, reason] = ['lite', 'WebGL2 unavailable (or software-only graphics)'];
  else [cached, reason] = ['full', 'capable desktop'];
  document.documentElement.dataset.motion = cached; // for CSS hooks / debugging
  // Shows in DevTools → Console, so it's clear why the live scene did/didn't run.
  console.info(`[motion] tier: ${cached} — ${reason}`);
  return cached;
}

/** Smooth scroll + cursor + magnetic: any mouse user who allows motion. */
export const allowsPointerMotion = () => !prefersReducedMotion() && hasFinePointer();
