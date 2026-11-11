/**
 * Site-wide facts in ONE place. Anything marked TODO is a placeholder
 * waiting for Afnan's real value.
 */
export const site = {
  name: 'Afnan Maqsood',
  url: 'https://www.example.com', // TODO: real domain (used for canonical + OG + sitemap)
  positioning: "Product designer with a painter's hand.", // TODO: final one-liner
  /** Home hero copy (TODO: Afnan's final words). `heroTitle` renders with
   *  `heroTitleItalic` in italic, e.g. "Designed *by hand*." */
  heroTitle: 'Designed',
  heroTitleItalic: 'by hand',
  heroSubtitle:
    "I'm Afnan, a product, brand and web designer in Ontario with a painter's eye. Leave your email and I'll get back to you.",
  heroCta: 'View my work',
  /** Hero background video (autoplay loop with fade-to-black): Afnan's own
   *  clip (Adobe Firefly), self-hosted in /public/hero. Black background. */
  heroVideo: '/hero/afnan.mp4',
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
