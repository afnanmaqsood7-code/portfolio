/**
 * Role lens rules, shared by the build (Astro) and the browser (lens script)
 * so the server-rendered layout and the filtered layout always agree.
 * Keep this file dependency-free: it ships to the client.
 */

export type Lens = 'everything' | 'product' | 'brand';
export type ProjectLens = 'product' | 'brand' | 'both';

export const LENS_OPTIONS: { id: Lens; label: string; description: string }[] = [
  { id: 'product', label: 'Product', description: 'Product and web design' },
  { id: 'brand', label: 'Brand', description: 'Graphic, brand and marketing design' },
  { id: 'everything', label: 'Everything', description: 'All work' },
];

export const DEFAULT_LENS: Lens = 'everything';

/** Read ?lens= safely; anything unknown falls back to Everything. */
export function parseLens(value: string | null | undefined): Lens {
  return value === 'product' || value === 'brand' ? value : DEFAULT_LENS;
}

/** Does a project tagged `projectLens` show under the active `lens`? */
export function matchesLens(projectLens: ProjectLens, lens: Lens): boolean {
  if (lens === 'everything') return true;
  return projectLens === lens || projectLens === 'both';
}

/**
 * Card sizes for N visible projects, so rows always fill the 12-column grid
 * on desktop: wide = 12 cols, half = 6, third = 4.
 *   1 → wide · 2 → half half · 3 → wide half half
 *   4 → half ×4 · 5 → half half third third third
 */
export type CardSize = 'wide' | 'half' | 'third';
export function cardSizes(count: number): CardSize[] {
  if (count === 1) return ['wide'];
  if (count === 3) return ['wide', 'half', 'half'];
  if (count % 2 === 0) return Array(count).fill('half');
  // Odd counts ≥ 5: two halves on top, thirds below (works for 5 and 9…).
  return ['half', 'half', ...Array(count - 2).fill('third')];
}
