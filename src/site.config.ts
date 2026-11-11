/**
 * Site-wide facts in ONE place. Anything marked TODO is a placeholder
 * waiting for Afnan's real value.
 */
export const site = {
  name: 'Afnan Maqsood',
  url: 'https://www.example.com', // TODO: real domain (used for canonical + OG + sitemap)
  positioning: "Product designer with a painter's hand.", // TODO: final one-liner
  /** Home hero copy. The blurred intro is decorative; the typed line is the H1. */
  heroIntro: ["Hey there, you've found the studio of", 'Afnan Maqsood, designer & painter'],
  heroLine: "I'm Afnan, a product and brand designer with a painter's hand. What are we making?",
  /** Hero background video (scrubbed by the mouse). Currently the clip from
   *  the "Mainframe" hero spec Afnan supplied — it is hosted on a third-party
   *  server and made for another brand, so it may disappear or break.
   *  TODO: replace with Afnan's own clip (encode notes in CLAUDE.md). */
  heroVideo:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4',
  location: 'Based in Ontario, open to relocating within Canada',
  description:
    'Afnan Maqsood is a product, brand and web designer in Ontario, Canada, with 5+ years of experience and a painter’s eye.',
  email: 'hello@example.com', // TODO: public email
  linkedin: 'https://www.linkedin.com/in/your-handle', // TODO: real LinkedIn URL
  resume: '/resume/afnan-maqsood-resume.pdf', // TODO: drop the real PDF in /public/resume
} as const;

export const nav = [
  { label: 'Work', href: '/#work' },
  { label: 'Play', href: '/play' },
  { label: 'Studio', href: '/studio' },
  { label: 'About', href: '/about' },
] as const;
