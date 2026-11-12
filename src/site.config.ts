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
    /** PLACEHOLDERS — replace with real quotes (or empty the list to hide the section). */
    testimonials: [
      { quote: 'Placeholder: add a short quote here from a manager, client or professor about working with Afnan.', name: 'Name Surname', role: 'Role, Company' },
    ],
    marquee: "Product designer with a painter's hand",
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
