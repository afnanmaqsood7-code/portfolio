/**
 * Home page categories, shared by the build and the browser filter script.
 * Keep dependency free: it ships to the client.
 */
export type Category = 'all' | 'product' | 'web' | 'branding' | 'marketing' | 'motion' | 'games';
export type Sub = 'identity' | 'packaging' | 'print' | 'logos';

export const CATEGORY_OPTIONS: { id: Category; label: string }[] = [
  { id: 'all', label: 'All work' },
  { id: 'product', label: 'Product & UX' },
  { id: 'web', label: 'Web' },
  { id: 'branding', label: 'Branding' },
  { id: 'marketing', label: 'Marketing & Social' },
  { id: 'motion', label: 'Motion' },
  { id: 'games', label: 'Games, XR & AI' },
];
export const SUB_OPTIONS: { id: Sub; label: string }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'packaging', label: 'Packaging' },
  { id: 'print', label: 'Print' },
  { id: 'logos', label: 'Logos' },
];
export function parseCategory(v: string | null | undefined): Category {
  return CATEGORY_OPTIONS.some((o) => o.id === v) ? (v as Category) : 'all';
}
export function parseSub(v: string | null | undefined): Sub | null {
  return SUB_OPTIONS.some((o) => o.id === v) ? (v as Sub) : null;
}
