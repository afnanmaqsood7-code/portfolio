# CLAUDE.md — Afnan Maqsood portfolio

Read this first in every session. It is the source of truth for stack, rules
and decisions. Update it whenever a decision changes.

## Who / why
Afnan Maqsood — designer in Ontario, Canada. 5+ years across product/UX,
branding, graphic, web and marketing design. MDM (Toronto Metropolitan
University), BFA Graphic Design. Painter and illustrator. Targeting product,
web, graphic and marketing designer roles in Canada.

**Signature idea:** "product designer with a painter's hand" — a calm, clean,
fast editorial layout plus ONE immersive hand-painted WebGL moment (home hero).
Everything else stays quiet so the work is the hero.

**Success criteria:** recruiters understand who Afnan is in 10 seconds and
reach the best work in one click. One site serves four job types via the
role lens.

## Working agreement
- Build in phases; **stop after each phase** for review with: short summary,
  how to run locally, what to check.
- Plan before coding. Ask only important questions.
- **Ask before adding any dependency not in the stack list below.**
- Phase 5: explain the fluid-simulation approach and **wait for approval**
  before coding it.
- Commit locally at the end of each phase (no remote configured yet).
- No model identifiers in commits or code.

## Stack (approved)
| Purpose | Choice |
| --- | --- |
| Framework | Astro 7.x (latest stable), static output |
| Content | MDX content collections (`@astrojs/mdx`, added Phase 2) |
| Styling | Plain CSS + custom properties. **No Tailwind.** |
| Fonts | Astro built-in Fonts API, Google provider, self-hosted at build |
| WebGL | three.js + custom GLSL shaders (Phase 5) |
| Motion | GSAP + ScrollTrigger, Lenis (Phase 5) |
| Transitions | Astro View Transitions / `<ClientRouter />` (Phase 5) |
| Sitemap | `@astrojs/sitemap` (official, Phase 6) |
| Types | TypeScript, strict, kept simple |
| Deploy | Vercel (static) |

Installed so far: `astro`, dev: `@astrojs/check`, `typescript`.

## Commands
```
npm install
npm run dev       # http://localhost:4321
npm run build     # astro check + build to dist/
npm run preview
```
Sandbox note: the cloud dev container blocks fonts.google.com, so builds there
fall back to Georgia/system fonts. Real fonts download on a normal machine and
on Vercel.

## Folder structure
```
CLAUDE.md
astro.config.mjs          # site URL, fonts (swap font names here)
public/
  favicon.svg             # placeholder monogram
  og/                     # default + generated OG images
  prototypes/<slug>/      # interactive HTML prototypes for PhoneFrame
  resume/afnan-maqsood-resume.pdf   # TODO real PDF
  robots.txt
src/
  site.config.ts          # name, URL, email, LinkedIn, resume, positioning, nav
  assets/
    paint/                # Afnan's scanned strokes/textures — ALL painted effects read from here (see README)
    projects/<slug>/      # covers + case-study images
    studio/               # archive images
  content.config.ts       # Zod schemas (Phase 2)
  content/projects|play|studio/
  components/
    layout/  Header, Footer
    ui/      Button, PageIntro, PaintStroke
    home/    Hero, RoleLens, ProjectGrid, ProjectCard, previews (Phase 2)
    case-study/  SummaryCard, NextProject (Phase 3)
    mdx/     FullImage, ImagePair, Caption, PullQuote, MetricRow, VideoEmbed, PhoneFrame (Phase 3)
    studio/  StudioGrid, Lightbox (Phase 4)
  layouts/   BaseLayout, CaseStudyLayout (Phase 3)
  pages/     index, work/[slug], play, studio, about, 404
  scripts/   lens.ts (P2), motion/ (P5), webgl/{capabilities.ts, fluid/, hover/} (P5)
  styles/    tokens.css, reset.css, grid.css, global.css
  utils/     seo.ts, projects.ts
```

## Design tokens (`src/styles/tokens.css`) — PLACEHOLDERS, not final
- **Swap in one place:** colours → `tokens.css` palette blocks; fonts →
  `name` in `astro.config.mjs`. Components use **semantic** tokens only
  (`--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`,
  `--color-border`, `--color-accent`, `--color-on-accent`, `--color-focus`).
- Fonts: display **Fraunces** (`--font-display`), text **Inter** (`--font-text`).
- Light palette: paper `#f6f1ea`, paper-deep `#ece4d8`, ink `#1d1915`,
  ink-soft `#5b5148`, line `#d9cebf`, accent terracotta `#a8401f`.
- Dark palette (prefers-color-scheme): paper `#14110e`, paper-deep `#1f1a16`,
  ink `#f2ebe1`, ink-soft `#b5aa9c`, line `#3a322b`, accent `#e48a64`.
- Verified AA: muted text ≥ 6.1:1, accent text ≥ 4.87:1 on both bg and
  surface, both themes. Re-verify after any colour change.
- Fluid scales: type `--step--1 … --step-6`, space `--space-3xs … --space-3xl`.
- Layout: `--container-max` 90rem, `--container-pad`, `--grid-gap`.
- Motion: `--ease-out`, `--ease-in-out`, `--dur-fast|base|slow` (zeroed under
  reduced motion).
- Light/dark is **system-driven** (`prefers-color-scheme`), no manual toggle.

## Layout system (`grid.css`)
Mobile first. `.container`; `.grid` = 4 cols → 8 at ≥48rem → 12 at ≥64rem.
Children span full row by default; use `.span-*`, `.md:span-*`, `.lg:span-*`.
Helpers `.stack`, `.cluster`, `.section`, `.eyebrow`, `.prose`,
`.visually-hidden`. Inner grids use `minmax(0, 1fr)` to avoid overflow.

## Content model (Phase 2+)
**projects** (MDX) frontmatter: `title`, `slug`, `summary`, `role`,
`timeline`, `team`, `tools` (string[]), `outcomes` (string[], short metric
statements; 2–3 shown in summary card), `lens` (`product` | `brand` |
`both`), `cover` (image, + `coverAlt` required), `featured` (bool), `order`
(number), `prototype` (optional path under `/prototypes`).

Placeholder projects: `axivus` (product), `bridging-divides` (product),
`glitchard` (product), `brand-identity` (brand), `neighbourhood-coffee`
(both). All featured.

Case study page order: hero (title, cover, 30-second summary card: role,
timeline, team, tools, 2–3 outcomes) → MDX body (context, problem, process,
decisions, final design, results, reflection) → next project link.
MDX components: FullImage, ImagePair, Caption, PullQuote, MetricRow,
VideoEmbed, PhoneFrame (iframe in a 390×844 phone shell, prototypes in
`/public/prototypes`). **Alt text is required** on every image (enforced by
schema / component props).

## Role lens
Buttons: Product / Brand / Everything (default). URL `?lens=product|brand`
(no param = everything) so Afnan can send role-specific links.
- Product (product + web designer roles) → `product` + `both`
- Brand (graphic + marketing designer roles) → `brand` + `both`
- Everything → all, by `order`.
Implementation: static HTML holds all cards; a small script filters/reorders
and syncs the URL with `history.replaceState`. **Without JS every project is
visible.** Lens affects the project grid only (default; revisit if asked).
Buttons are real toggles (`aria-pressed`), announced via a live region.

## Motion plan (Phase 5 only — no animation before then)
1. **Living paint hero:** WebGL stable-fluids / ink sim reacting to
   pointer + touch like paint pushed by a brush. Colours from tokens; brush
   textures from `/src/assets/paint` blended so it reads as hand painted, not
   smoke. Hero text stays crisp HTML on top. On scroll the fluid calms and
   resolves into the first featured project image.
2. **Thumbnails:** subtle liquid distortion on hover with ONE shared canvas.
3. **Page transitions:** painted brush-stroke wipe (View Transitions + mask).
4. Lenis smooth scroll + GSAP ScrollTrigger reveals.
5. Case studies: gentle reveals only, no heavy WebGL.
Scripts must be safe to re-run on `astro:page-load` (ClientRouter arrives in P5).

## Non-negotiable rules
1. Mobile first, fully responsive, no horizontal scroll at 320px+.
2. `prefers-reduced-motion` respected everywhere with calm fallbacks.
3. Accessible: semantic HTML, landmarks, skip link, keyboard nav, visible
   focus (`--focus-ring`), required alt text, WCAG AA contrast, ≥44px targets.
4. Fast: `astro:assets` optimized images, lazy loading, minimal JS.
   Lighthouse ≥ 90 mobile, ≥ 95 desktop.
5. WebGL: lazy-load three.js only where needed, after first paint; static
   painted image on low-power devices, small screens and reduced motion;
   pause when off-screen or tab hidden; DPR capped at 2; 60fps target on a
   mid-range laptop; site fully works if WebGL fails.
6. SEO: meta tags, per-page OG image, sitemap, favicon, canonical URLs.
7. Clean, readable code; comment non-obvious logic.

## Defaults chosen (Afnan said "build" without answering questions)
- Domain `https://www.example.com`, email `hello@example.com`, LinkedIn
  placeholder, resume placeholder path — all in `src/site.config.ts` (TODO).
- Positioning line: "Product designer with a painter's hand." (TODO).
- Lens: three options mapped as above; grid only.
- Lightbox: hand-built on native `<dialog>` (no library).
- Play: video + external links by default; iframe embeds where a web build exists.
- Video: YouTube/Vimeo embeds (lite, click-to-load) rather than large self-hosted files.
- No analytics until asked.
- Header has no JS menu: nav wraps on mobile. Footer is the `#contact` block.

## Phase log
- [x] Phase 1 — scaffold, tokens, base layout, header, footer, grid, light/dark.
- [ ] Phase 2 — content collections, 5 placeholder projects, home + role lens.
- [ ] Phase 3 — case study template + MDX components + PhoneFrame.
- [ ] Phase 4 — Play, Studio (lightbox), About.
- [ ] Phase 5 — immersive motion layer (approval gate before fluid sim).
- [ ] Phase 6 — perf / a11y / SEO pass, Vercel deploy steps.
