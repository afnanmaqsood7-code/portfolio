/**
 * Site-wide facts in ONE place. Anything marked TODO is a placeholder
 * waiting for Afnan's real value.
 */
export const site = {
  name: 'Afnan Maqsood',
  url: 'https://www.example.com', // TODO: real domain (used for canonical + OG + sitemap)
  positioning: "Product designer with a painter's hand.", // TODO: final one-liner
  /** Home copy (TODO: Afnan's final words). *word* = italic serif accent. */
  home: {
    hello: "Hi, I'm Afnan.",
    /** Rotating words after "I am" (typed, then erased). */
    words: ['a painter', 'detail-obsessed', 'a systems thinker', 'always curious'],
    headline: "*Product* designer with a *painter's* hand",
    disciplinesTitle: '*Thinking* in systems, *working* by hand',
    disciplines: [
      { title: 'Product design', items: ['UX research', 'Interaction design', 'Prototyping', 'Design systems', 'Usability testing'] },
      { title: 'Brand & graphic', items: ['Brand identity', 'Logo & type', 'Packaging', 'Art direction', 'Print & editorial'] },
      { title: 'Web design', items: ['Landing pages', 'SaaS dashboards', 'E-commerce', 'Responsive UI', 'Figma to build'] },
      { title: 'Painting & art', items: ['Acrylic & oil', 'Illustration', 'Motion & animation', 'Social content', 'Editorial art'] },
    ],
  },
  location: 'Based in Ontario, open to relocating within Canada',
  description:
    'Afnan Maqsood is a product, brand and web designer in Ontario, Canada, with 5+ years of experience and a painter’s eye.',
  email: 'afnanmaqsood7@gmail.com',
  linkedin: 'https://www.linkedin.com/in/afnan-maqsood7/',
  resume: '/resume/afnan-maqsood-resume.pdf', // TODO: drop the real PDF in /public/resume
} as const;

/** Primary navigation, in order of what recruiters need first.
 *  The name in the header links home; Resume is a separate download. */
export const nav = [
  { label: 'Work', href: '/#work' },
  { label: 'About', href: '/about' },
  { label: 'Studio', href: '/studio' },
  { label: 'Play', href: '/play' },
  { label: 'Contact', href: '#contact' },
] as const;
