/**
 * Content collections. The schema is the contract for every project file:
 * a missing required field (e.g. coverAlt) fails the build, which is how
 * "alt text is required" is enforced.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const LENSES = ['product', 'brand', 'both'] as const;

const projects = defineCollection({
  // Every .mdx file in src/content/projects. The `slug` frontmatter field
  // becomes the entry id, which becomes the URL: /work/<slug>.
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be lowercase-kebab-case'),
      summary: z.string().max(220, 'Keep the summary to one or two sentences'),
      role: z.string(),
      timeline: z.string(),
      // Optional year, e.g. '2025' (shown in project lists).
      year: z.string().optional(),
      team: z.string(),
      tools: z.array(z.string()).min(1),
      // Short metric statements. The summary card shows the first 3.
      outcomes: z.array(z.string()).min(1),
      lens: z.enum(LENSES),
      // Optional small tag chips on project cards (e.g. 'Mobile design', 'Hackathon winner').
      tags: z.array(z.string()).max(3).optional(),

      cover: image(),
      coverAlt: z.string().min(1, 'coverAlt is required (describe the cover image)'),

      featured: z.boolean().default(false),
      // Position in the "Everything" lens (1 = first).
      order: z.number().int(),
      // Optional position overrides per lens, e.g. { brand: 1 } puts this
      // project first when the Brand lens is active.
      lensOrder: z
        .object({ product: z.number().int().optional(), brand: z.number().int().optional() })
        .optional(),

      // 'case-study' = long-form story. 'showcase' = large images grouped by
      // type plus a short process note (web-saas-design).
      format: z.enum(['case-study', 'showcase']).default('case-study'),

      // Optional interactive prototype, e.g. '/prototypes/axivus/index.html'
      prototype: z
        .string()
        .regex(/^\/prototypes\//, 'prototype must live under /prototypes/')
        .optional(),
    }),
});

export const collections = { projects };
