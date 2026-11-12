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

## DESIGN DIRECTION — single source of truth (Afnan, merged)
Afnan asked to follow TWO reference sites and merge them into one best
version: **dversostudio.io** (bold studio: cream bg, Geist + Geist Mono labels,
italic serif accent words, outlined wordmark over a grid with lit squares,
bold colour block with flying service cards, project table) × **itsamy.ca**
(calm, recruiter-friendly: Lora headings, "Hi, I'm …", typed "I am ___",
2-col project cards with device-style images + tag chips, testimonial card,
own-art services, italic marquee, simple "Let's get in touch!").
Studied directly in a browser (screens, fonts, colours). Follow THIS system
everywhere; do not mix in other references. Never copy their logos, 3D
characters, illustrations, testimonials or text.
- Colours (Afnan chose): cream #fcf6e7 bg, near-black #111 text, deep sage
  #2f4a3c bold block, clay #b4532f decorative / #a24826 text accent, white cards.
- Fonts: Geist (text + big sans headlines, tight -0.04em), Geist Mono (small
  uppercase labels), Lora (section headings, italic accent words via *word*).
- Home: Loader → Hero → Disciplines (sage) → Featured Projects → All projects
  table → From the studio → Contact/footer.
- **Marquee ("✿ Product designer with a painter's hand") REMOVED** (Afnan's
  decision). Do not re-add unless she asks.
- **Kind words / testimonials REMOVED** (Afnan's decision). Do not re-add
  unless she asks.
- Nav (clear navigation, Afnan's request): simple text links, no pills.
  Name (left) = Home. Order Work · About · Studio · Play · Contact, then
  "Resume ↓" set apart (accent colour, left hairline). Current page
  underlined (`aria-current="page"`); on the home page only, a scroll-spy
  (IntersectionObserver, -45% margins) underlines Work / Contact while those
  sections cross mid-screen. Phones (< 56rem): `<details>` "Menu" opens a
  full-screen list of big Lora links + resume + email; works without JS,
  JS adds Esc / link-click close and locks page scroll. The header's
  `backdrop-filter` is dropped while the menu is open (it would trap the
  fixed panel inside the header). Footer repeats the nav and now holds the
  sound toggle.
- Contact: email `afnanmaqsood7@gmail.com`, LinkedIn
  `https://www.linkedin.com/in/afnan-maqsood7/` (in `site.config.ts`).
  Domain and resume PDF still TODO.
- Removed in the merge: black hero, liquid glass, Unbounded/Instrument
  Serif/Inter, laptop badge, sage-paper palette.

## Working agreement
- Build in phases; **stop after each phase** for review with: short summary,
  how to run locally, what to check.
- Plan before coding. Ask only important questions.
- **Ask before adding any dependency not in the stack list below.**
- Phase 5: explain the fluid-simulation approach and **wait for approval**
  before coding it.
- Commit at the end of each phase and push to GitHub:
  https://github.com/afnanmaqsood7-code/portfolio (branch `main`).
- Afnan is on Windows (PowerShell). Give Windows-friendly run instructions.
- No model identifiers in commits or code.

## Stack (approved)
| Purpose | Choice |
| --- | --- |
| Framework | Astro 7.x (latest stable), static output |
| Content | MDX content collections (`@astrojs/mdx`, added Phase 2) |
| Styling | Plain CSS + custom properties. **No Tailwind.** |
| Fonts | Astro built-in Fonts API, Google provider, self-hosted at build |
| WebGL | three.js + custom GLSL shaders (motion phase) |
| Motion | GSAP (core, ScrollTrigger, SplitText), Lenis (motion phase) |
| Sound | Web Audio API (built in, no files) |
| Transitions | Astro View Transitions / `<ClientRouter />` (Phase 5) |
| Sitemap | `@astrojs/sitemap` (official, Phase 6) |
| Types | TypeScript, strict, kept simple |
| Deploy | Vercel (static) |

Installed so far: `astro`, `@astrojs/mdx`, `gsap` 3.15, `lenis` 1.3, `three` 0.187;
dev: `@astrojs/check`, `typescript`, `@types/three` (types only, never shipped).
`astro.config.mjs` has no `// @ts-check` (it imports `node:fs`; no @types/node).

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
    home/    RoleLens, ProjectGrid, ProjectCard
    case-study/  SummaryCard, NextProject (Phase 3)
    mdx/     FullImage, ImagePair, Caption, PullQuote, MetricRow, VideoEmbed, PhoneFrame (Phase 3)
    studio/  StudioGrid, Lightbox (Phase 4)
  layouts/   BaseLayout, CaseStudyLayout (Phase 3)
  pages/     index, work/[slug], play, studio, about, 404
  scripts/   motion/ (capabilities, lifecycle, smooth-scroll, cursor, magnetic,
             button-fill, sound), webgl/fluid/ (step c, three.js)
  styles/    tokens.css, reset.css, grid.css, global.css
  utils/     seo.ts, projects.ts
```

## Design tokens (`src/styles/tokens.css`)
- **Colours "Cream, sage & clay"** (merged direction). Swap in one place:
  palette blocks in `tokens.css`; fonts by `name` in `astro.config.mjs`.
  Components use semantic tokens (`--color-bg/surface/card/text/text-muted/
  border/accent/on-accent/focus`) plus `--sage`, `--on-sage`, `--on-sage-soft`,
  `--clay-bright` (decorative only).
- Light: paper `#fcf6e7`, paper-deep `#f3ecdb`, card `#fff`, ink `#111`,
  ink-soft `#57524a`, line `#e2d9c4`, accent `#a24826`, clay-bright `#b4532f`,
  sage `#2f4a3c`, on-sage `#fcf6e7`, on-sage-soft `#c9d3c6`.
- Dark (prefers-color-scheme): paper `#121411`, paper-deep `#1b1e1a`, card
  `#1f231e`, ink `#f3ede0`, ink-soft `#b3ad9f`, line `#2d322b`, accent `#e08a63`.
- Verified AA: ink/cream 17.5, ink-soft/cream 7.2, clay text/cream 5.6,
  cream/sage 9.0, on-sage-soft/sage 6.3; dark ink 15.9, ink-soft 8.3, accent
  7.0. Clay on sage = decorative only (1.95).
- Fonts: **Lora** (`--font-display`, 400/500 + italic), **Geist**
  (`--font-text`, 300–600), **Geist Mono** (`--font-mono`, 400). Helpers:
  `.accent` (italic Lora), `.mono-label` (uppercase mono), `[data-reveal]`.
- Fluid scales, layout and motion tokens unchanged.
- Network: the "portfolio" cloud environment allows fonts.google(apis).com /
  gstatic.com, so sandbox builds now use the real fonts.

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
(number, position in Everything), `lensOrder` (optional `{product, brand}`
position overrides), `format` (`case-study` default | `showcase`),
`prototype` (optional path under `/prototypes`). Schema lives in
`src/content.config.ts`; the `slug` field is the entry id and the URL.

Placeholder projects (all featured), covers in `src/assets/projects/<slug>/cover.jpg`:
1. `axivus` (product) — zero-to-one B2B automotive SaaS, mechanic mobile app, 24 flows
2. `bridging-divides` (product) — TMU research platform, ORCID, researcher workflows
3. `glitchard` (product) — AI MetaHuman comedian; Unreal, Convai, ElevenLabs; human in the loop
4. `brand-identity` (brand, brand lens #1) — brand book, identity, packaging
5. `web-saas-design` (both, **showcase format**, product #4 / brand #2) — curated
   Figma web + product UI: SaaS landing pages, SaaS dashboards, e-commerce,
   mobile app screens. Large images grouped by type + short process note
   (research → wireframes → hi-fi). Replaced `neighbourhood-coffee` (removed at
   Afnan's request).

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
(moves DOM nodes, never CSS `order`, so tab order matches) and syncs the URL
with `history.replaceState`. Rules shared by build and browser in
`src/utils/lens.ts`, incl. `cardSizes(n)` so rows fill the 12-col grid
(5 → half half third third third; 4 → halves; 3 → wide half half; 2 → halves;
1 → wide). Unknown `?lens=` values fall back to Everything. **Without JS every project is
visible.** Lens affects the project grid only (default; revisit if asked).
Buttons are real toggles (`aria-pressed`), announced via a live region.

## Motion system — "award-level" brief (STATUS: APPROVED, building step by step)
Inspiration for feel and quality only: lusion.co, dversostudio.io, funtech.inc.
**Never copy their code, assets or exact designs.** Everything is original and
built around "product designer who is also a painter". Shaders are written
from the published stable-fluids method (Stam 1999 / GPU Gems ch. 38), not
ported from existing fluid repos.

Motion stack: three.js + custom GLSL, GSAP (core, ScrollTrigger, SplitText —
all in the free `gsap` package), Lenis, Astro View Transitions. **Ask before
adding anything else.** UI sounds are synthesised with the Web Audio API (no
audio files, no library).

### Architecture
- `src/scripts/motion/` — `capabilities.ts` (one decision: `full` | `lite` |
  `none`), `lenis.ts`, `cursor.ts`, `magnetic.ts`, `micro.ts`, `sound.ts`,
  `preloader.ts`, `hero-text.ts`, `scroll/` (marquee, studio strip, counters,
  section colours), `lifecycle.ts` (init on `astro:page-load`, cleanup on
  `astro:before-swap`; every module returns a `destroy()`).
- `src/scripts/webgl/` — ONE renderer and ONE fixed full-screen canvas
  ("stage") shared by the hero fluid and the gallery planes. `stage.ts`,
  `fluid/` (sim passes + display shader), `gallery/` (DOM-synced planes),
  `shaders/*.glsl`.
- Tiers: **full** = desktop-class, WebGL2, no reduced motion → everything.
  **lite** = small screens (< 64rem), low power (≤ 2 cores, deviceMemory ≤ 2,
  Save-Data), or WebGL failure → no three.js; static painted hero image, CSS
  hover, Lenis off on touch, simple GSAP fades. **none** = reduced motion →
  no preloader, no smooth scroll, no cursor, no parallax/marquee/pinning;
  instant or 0.2s opacity fades only.
- Runtime guard: if average FPS < 45 for 2s, halve sim resolution; still low
  → fade WebGL out to the static image. DPR capped at 2 (sim at ¼ res).
- Rendering pauses when the stage is off screen (IntersectionObserver), the
  tab is hidden (`visibilitychange`), or nothing changed (gallery idles).
- No-JS / WebGL-fail: all content is plain HTML + `<img>`; motion only ever
  enhances. Nothing waits on animation to become readable or focusable.

### 1. Preloader (home, first visit per session, < 1.5s)
Inline `<head>` script checks `sessionStorage['am-intro']`; only then adds
`html.has-intro` (no JS → never shown; reduced motion → skipped). Overlay:
painted stroke drawn via an animated SVG mask over the stroke from
`/src/assets/paint`, counter 0→100 driven by real readiness (fonts + hero
image) but time-capped at ~1.1s, then the stroke wipes off to reveal the page.
`aria-hidden`, pointer-transparent; any key/click skips it. Page renders
underneath the whole time (no LCP blocking).

### 2. Home sections (merged direction — BUILT)
- `Preloader.astro`: dark blurred screen, "afnan" sharpening from blur,
  "Loading" + counter + hairline bar, ≤ 1.1 s, home only, first visit per
  session (`sessionStorage['am-intro']`, inline head-time check), skipped by
  click/key, never with reduced motion or no JS.
- `Hero.astro`: cream; canvas hairline GRID (64 px cells, 40 on phones,
  ~72% × 56% band) whose cells light clay under the cursor/touch and fade
  over 1.2 s, plus a random cell every 1.4 s; huge outlined "afnan" (Geist
  600, text-stroke); "I am ___" typing `site.home.words` in Lora italic;
  bottom-left H1 = mono "Hi, I'm Afnan Maqsood." + Geist headline with italic
  accents (`site.home.headline`); corner mono labels (Ontario + live Toronto
  clock; "Scroll down to discover" + clay square → #disciplines).
- `Disciplines.astro` (#disciplines): sage block, title with accents; a CSS
  3D sketchbook (cover rotates open) and 4 white cards (Geist title + mono
  hairline lists, `site.home.disciplines`) fly out into a tilted fan — GSAP
  ScrollTrigger scrub, sticky stage, ≥ 48rem with motion. Else a card grid.
- `ProjectGrid.astro` (#work): centred Lora "Featured Projects" + role lens;
  Amy-style 2-col cards (image on a soft panel, title + mono tag chips from
  optional `tags` frontmatter, else discipline + first tool).
- `ProjectTable.astro`: "All *projects* ↙" rows (mono name · type · year ·
  View case →); hover = floating cover preview following the cursor with a
  velocity tilt (mouse + motion only).
- `StudioStrip.astro`: "From the *studio*" 4 tiles, link to /studio. Tile 1
  = Afnan's real painting `src/assets/studio/whirling-dervish.jpg`
  ("Whirling dervish"); tiles 2–3 = her vector illustrations
  `portrait-glasses.png`, `portrait-city.webp`; tile 4 (Social) placeholder.
  Tile 3 plays her animation `public/studio/city-portrait.mp4` (720², no
  audio, ~100 KB) over the still poster: muted loop, plays only on screen,
  never with reduced motion, 44px pause/play button (WCAG 2.2.2).
- `Footer.astro` (#contact, all pages): "Let's get in touch!" + email,
  LinkedIn, resume; footer nav (Home + pages + Resume ↓); mono meta row
  (© · Ontario · sound toggle · Back to top).
- `Header.astro`: sticky cream, name + text links + "Resume ↓"; scroll-spy
  on home; full-screen `<details>` Menu on phones (see Nav above).

### 2c. Video ribbon — REMOVED (Afnan's decision)
The 3D "Vante" ribbon section (cards sweeping along a 3D rail into a grid)
was built and then removed at Afnan's request, with its Inter Tight font.
Do not re-add unless she asks; it's in git history (commit "Home: 3D video
ribbon of work…").

### 3. Custom cursor
DOM element (not WebGL), transform-only, lerped via `gsap.quickTo`. States by
`data-cursor`: `view` (projects, grows + "View"), `play` (videos, "Play"),
`brush` (painted elements → small brush dab from `/src/assets/paint`). Only on
`(hover: hover) and (pointer: fine)` in tier full/lite; native cursor stays
visible over text inputs; keyboard focus styles are untouched.

### 4. Project gallery (home)
- DOM `<img>` stays in the HTML for a11y/no-JS; in tier full it goes
  `opacity: 0` and a plane on the shared stage is synced to its rect each
  frame (Lenis drives the scroll position).
- Fragment shader: hover ripple (radial, from pointer UV, decays), RGB split
  offset along the pointer's movement direction. Vertex shader: bend
  proportional to Lenis scroll velocity (stretch then relax).
- Titles: SplitText lines in masks, revealed on enter (ScrollTrigger, once).
- Magnetic hover (cards subtle, buttons stronger) via `gsap.quickTo`, fine
  pointers only.

### 5. Scroll storytelling
- Lenis site-wide, driven by `gsap.ticker`, synced with ScrollTrigger. Off on
  touch devices (native momentum) and reduced motion. Anchor links + skip link
  routed through Lenis so focus still moves.
- Studio preview: pinned section, horizontal track scrubbed by scroll (tier
  full, ≥ 64rem). Lite/touch: native horizontal scroll-snap strip.
- Disciplines marquee (Product, Brand, Web, Motion, Painting): GSAP loop;
  speed += |scroll velocity|, direction follows scroll direction; pauses on
  hover/focus; duplicates aria-hidden; reduced motion → static row.
- Count-up metrics: final number is in the HTML (no-JS correct, SR reads the
  final value via visually-hidden text); animates from 0 on enter, once.
- Section colours: each section declares `data-theme-section` (paper, deep,
  ink, accent-wash); ScrollTrigger tweens `--section-bg` / `--section-fg` on
  `<body>`. Every pair is a pre-verified AA token pair in tokens.css.

### 6. Page transitions
Astro `<ClientRouter />`. Shared element: card cover and case-study hero cover
share `transition:name="cover-<slug>"` → native View Transition morph;
browser back reverses it automatically. Painted wipe: `::view-transition-*`
pseudo-elements masked with a brush stroke from `/src/assets/paint`. Before
navigating from a WebGL card, the DOM image is made visible so the snapshot
is real. Fallback where View Transitions are unsupported: simple fade.
Reduced motion: no wipe, instant swap.

### 7. Micro interactions
- Brush underline: `::after` masked by a stroke from `/src/assets/paint`,
  drawn left→right on hover/focus (mask-size/position transition).
- Buttons: circular fill grows from the pointer entry point (CSS vars set on
  `pointerenter`, `clip-path: circle()`), reverses toward exit point.
- Role lens: one sliding pill indicator moved to the pressed button (FLIP).
- Sound toggle in header: `aria-pressed`, **off by default**, saved in
  localStorage; soft synthesized ticks on hover/press; never autoplays.

### 8. Case study pages (calm)
No three.js. CSS scroll-driven animations (`animation-timeline: view()` /
`scroll()`) for fade-and-rise reveals, gentle image parallax and a reading
progress bar, inside `@supports` + reduced-motion guards (zero JS cost).
Lenis still active for consistent scroll feel.

### 9. Desk scene — REMOVED (Afnan's decision)
The "At the desk" scroll section was removed entirely at Afnan's request
(after several iterations: 3D figure → morphing device → animated stock
illustration with hijab). Do not re-add it unless she asks. Removed with it:
DeskScene/DeskIllustration components, `scripts/motion/desk.ts`,
`utils/desk-devices.ts`, the `device` frontmatter field, scene colour tokens
and the illustration credit line (the stock illustration is no longer used).
Kept: `--font-mono` (JetBrains Mono, for the project list effect) and the
optional `year` frontmatter field. Full history is in git if ever needed.

### 10. Next effects (CHOSEN by Afnan from the dversostudio.io recording —
build ORIGINAL versions in the painter style, never copies)
1. **Text scramble reveal** — headings/name resolve from cycling glyphs
   (< 1 s; reduced motion → plain text).
2. **Project list + hover image** — table rows (name, type, year); hovering
   shows the project image floating by the cursor with a slight liquid
   wobble; with or replacing the All work grid.
3. **Sketchbook opens to cards** — a closed sketchbook/paint box opens on
   scroll; cards for Product / Brand / Web / Motion / Painting fly out.
4. **Painted grid follows cursor** — canvas-like grid behind About; squares
   get soft brush dabs where the cursor passes, then fade.

### Performance budget
Initial JS on home before idle: Lenis + GSAP core/ScrollTrigger/SplitText
(~50 KB gz). three.js (~130 KB
gz) is reserved for the hero fluid (step c): dynamic `import()` after the
`load` event + `requestIdleCallback`, home only, tier full only. Lighthouse
mobile runs as tier lite (no three.js), target ≥ 90.

### Build order (APPROVED — stop for review after each)
(a) Lenis, cursor, micro interactions ✅ → ~~desk scene~~ (built, then removed by Afnan) →
**section 10 effects** (scramble, project list hover, sketchbook cards, painted grid) →
(b) preloader → ~~(c) WebGL hero~~ (replaced by the video hero ✅) →
(d) gallery effects → replaced by section 10 #2 (project list + hover image) → **Phase 3** case-study template (+ part 8)
→ (e) scroll storytelling → (f) page transitions → **Phase 4** Play, Studio,
About → (g) performance + accessibility pass.

### Decisions log
- Native cursor is HIDDEN for mouse users in motion tiers (custom cursor
  only); native cursor kept over text inputs/selects/contenteditable.
- Every motion module uses event delegation on `document`, so it survives
  ClientRouter page swaps without re-binding.
- JS budget measured after step (a): everyone 2 KB gz (entry: sound, button
  fill, tier); mouse + motion users +50 KB gz (GSAP+ScrollTrigger 27 KB,
  Lenis 23 KB incl. shared bits). Phones / reduced motion load neither.
- Lenis honours `html { scroll-padding-top }` — never add a manual header
  offset to `lenis.scrollTo` (it double-counts).
- Brush underline (`.brush-link`, `.prose a`) is CSS only and uses
  `isolation: isolate` so the z-index:-1 stroke stays above section backgrounds.
- Button fill: `.btn` contains `.btn__fill` + `.btn__label`; JS sets --fx/--fy
  and toggles `.is-filled`; `html.has-button-fill` disables the no-JS hover.
- Sound: header toggle `[data-sound-toggle]`, `aria-pressed`, localStorage
  `am-sound`, AudioContext only after a gesture. Visible on all devices.
- Cursor states via `data-cursor="view|play|brush"`; magnetic via
  `data-magnetic="<strength>"` (buttons 0.25, project cards 0.04). Canvas
  scenes override with `document.dispatchEvent(new CustomEvent('cursor:state',
  { detail: 'view' | null }))`.
- Lenis instance exposed as `window.__lenis` for lazily loaded modules.
- Home order: see DESIGN DIRECTION (Loader → Hero → Disciplines → Featured
  Projects `#work` → All projects → Studio → #contact).

### Painted assets needed from Afnan (placeholders until then)
Brush-stroke scans (PNG, transparent), a bristle/brush stamp texture, a
paper/canvas texture, a wipe stroke for transitions, a hero-fallback painting
photo, 6–10 paintings/illustrations for the Studio strip. Specs in
`/src/assets/paint/README.md`.

## Non-negotiable rules
1. Mobile first, fully responsive, no horizontal scroll at 320px+.
2. `prefers-reduced-motion` respected everywhere with calm fallbacks.
3. Accessible: semantic HTML, landmarks, skip link, keyboard nav, visible
   focus (`--focus-ring`), required alt text, WCAG AA contrast, ≥44px targets.
4. Fast: `astro:assets` optimized images, lazy loading, minimal JS.
   Lighthouse ≥ 90 mobile, ≥ 95 desktop.
5. WebGL: lazy-load three.js only on pages that use it, after first paint;
   static painted image + simple fades on low-power devices, small screens
   and reduced motion; pause when off-screen or tab hidden; DPR capped at 2;
   60fps target on a mid-range laptop; site fully works if WebGL **or
   JavaScript** fails.
8. All motion keyboard accessible and never blocking content (preloader is
   skippable and never hides content from assistive tech).
6. SEO: meta tags, per-page OG image, sitemap, favicon, canonical URLs.
7. Clean, readable code; comment non-obvious logic.

## Defaults chosen (Afnan said "build" without answering questions)
- Domain `https://www.example.com` and resume placeholder path (TODO); email
  and LinkedIn are Afnan's real ones — all in `src/site.config.ts`.
- Positioning line: "Product designer with a painter's hand." (TODO).
- Hero copy: `site.heroTitle`, `heroSubtitle`, `heroCta` (TODO: Afnan's
  final words).
- Lens: three options mapped as above; grid only.
- Lightbox: hand-built on native `<dialog>` (no library).
- Play: video + external links by default; iframe embeds where a web build exists.
- Video: YouTube/Vimeo embeds (lite, click-to-load) rather than large self-hosted files.
- No analytics until asked.
- Header has no JS menu: nav wraps on mobile. Footer is the `#contact` block.

## Phase log
- [x] Phase 1 — scaffold, tokens, base layout, header, footer, grid, light/dark.
- [x] Phase 2 — content collections, 5 placeholder projects, home + role lens.
      `/work/[slug]` is a basic stub until Phase 3.
- [ ] Phase 3 — case study template + MDX components + PhoneFrame + showcase
      gallery layout for `format: showcase`.
- [ ] Phase 4 — Play, Studio (lightbox), About.
- [ ] Phase 5 — immersive motion layer, expanded to the award-level brief
      (steps a–g above). Approved. Step (a) done. Desk scene built then removed.
   Home rebuilt to the merged dverso × itsamy direction (cream/sage/clay,
   Geist/Lora).
- [ ] Phase 6 — perf / a11y / SEO pass, Vercel deploy steps.
