// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import { site } from './src/site.config.ts';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: site.url,
  integrations: [mdx()],

  // FONTS — PLACEHOLDER. To swap a typeface, change only `name` below.
  // Astro downloads and self-hosts the files at build time (no runtime
  // request to Google), and generates metric-matched fallbacks to limit
  // layout shift. The CSS variables are consumed in src/styles/tokens.css.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Lora', // ← display: headings + italic accent words
      cssVariable: '--font-display-src',
      weights: [400, 500],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Geist', // ← text + big sans headlines
      cssVariable: '--font-text-src',
      weights: ['300 600'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Geist Mono', // ← small technical labels
      cssVariable: '--font-mono-src',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],
});
