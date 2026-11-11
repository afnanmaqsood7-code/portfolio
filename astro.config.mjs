// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import { site } from './src/site.config.ts';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: site.url,

  // FONTS — PLACEHOLDER. To swap a typeface, change only `name` below.
  // Astro downloads and self-hosts the files at build time (no runtime
  // request to Google), and generates metric-matched fallbacks to limit
  // layout shift. The CSS variables are consumed in src/styles/tokens.css.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Fraunces', // ← display font placeholder
      cssVariable: '--font-display-src',
      weights: ['300 900'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Inter', // ← text font placeholder
      cssVariable: '--font-text-src',
      weights: ['300 700'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
