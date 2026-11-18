/**
 * Site-wide facts in ONE place. Anything marked TODO is a placeholder
 * waiting for Afnan's real value.
 */
export const site = {
  name: 'Afnan Maqsood',
  url: 'https://afnanmaqsood-lxlk.vercel.app', // TODO: real domain (used for canonical + OG + sitemap)
  positioning: 'Product, brand and web designer based in Canada.',
  /** Home hero copy. Professional first; painting comes last. */
  home: {
    /** Rotating first word of the role line: "<word> designer". */
    roles: ['Product', 'Brand', 'Web', 'UX/UI', 'Marketing'],
    intro:
      'I turn messy problems into products people understand on first use. 5+ years shipping apps, websites and brands for startups and clients, often as the only designer, from first sketch to launch.',
    location: 'Based in Canada',
    status: 'Open to work',
  },
  location: 'Based in Ontario, open to relocating within Canada',
  description:
    'Afnan Maqsood is a product, brand and web designer in Canada with 5+ years of experience across UX, branding, web and marketing design.',
  email: 'afnanmaqsood7@gmail.com',
  linkedin: 'https://www.linkedin.com/in/afnan-maqsood7/',
  resume: '/resume/afnan-maqsood-resume.pdf', // TODO: drop the real PDF in /public/resume
} as const;

/** Primary navigation, in order of what recruiters need first.
 *  The name in the header links home; Resume is a separate download. */
export const nav = [
  { label: 'Work', href: '/work/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '#contact' },
] as const;
