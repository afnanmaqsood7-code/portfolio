/** Splits "*Product* designer" into parts; *starred* parts render as italic
 *  serif accents (the dverso-style headline). */
export function accentParts(text: string): { text: string; accent: boolean }[] {
  return text.split(/(\*[^*]+\*)/g).filter(Boolean).map((t) =>
    t.startsWith('*') && t.endsWith('*') ? { text: t.slice(1, -1), accent: true } : { text: t, accent: false },
  );
}
