/**
 * Site-wide facts in ONE place. Anything marked TODO is a placeholder
 * waiting for Afnan's real value.
 */
export const site = {
  name: 'Afnan Maqsood',
  url: 'https://www.example.com', // TODO: real domain (used for canonical + OG + sitemap)
  positioning: "Product designer with a painter's hand.", // TODO: final one-liner
  /** Home hero copy (TODO: Afnan's final words). A waving hand follows the title. */
  heroTitle: "Hi there, I'm Afnan!",
  heroSubtitle:
    'a product, brand and web designer with a painter\u2019s hand, on a mission to design products and brands that make everyday life feel a little easier.',
  heroCta: 'View my work',
  /** Video ribbon section (home). TODO: Afnan's final words. */
  ribbon: {
    line1: 'DESIGNED',
    line2: 'BY HAND',
    caption: 'Selected product, brand and web work.',
    note: 'Product, brand and web work, shaped by research and finished with a painter\u2019s eye.',
  },
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
