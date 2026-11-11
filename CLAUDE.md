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
    home/    DeskScene, RoleLens, ProjectGrid, ProjectCard (+ previews later)
    case-study/  SummaryCard, NextProject (Phase 3)
    mdx/     FullImage, ImagePair, Caption, PullQuote, MetricRow, VideoEmbed, PhoneFrame (Phase 3)
    studio/  StudioGrid, Lightbox (Phase 4)
  layouts/   BaseLayout, CaseStudyLayout (Phase 3)
  pages/     index, work/[slug], play, studio, about, 404
  scripts/   motion/ (capabilities, lifecycle, smooth-scroll, cursor, magnetic,
             button-fill, sound), webgl/desk/ (device, character, scene,
             controller, config), webgl/fluid/ (step c)
  assets/desk/desk-poster.jpg  # static render of the desk scene
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
  **lite** = small screens (< 64rem), low power (≤ 4 cores, deviceMemory ≤ 4,
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

### 2. WebGL hero (signature moment)
- GPU stable fluids on half-float render targets: advect → pointer splats →
  vorticity (low, for "wet paint" curls) → divergence → ~20 Jacobi pressure
  iterations → gradient subtract → advect dye. Velocity grid ~128px, dye
  ~512–1024px.
- Splats are stamped with a brush texture from `/src/assets/paint` (bristle
  streaks, not round blobs), sized by pointer speed. Touch supported.
- Display shader maps dye channels to token colours (accent + ink + a second
  paint colour read from CSS vars at init and on theme change), adds a
  paper/canvas texture from `/src/assets/paint`, and a subtle wet sheen from
  dye-gradient normals.
- Depth: fluid rendered to a texture on a plane in a perspective camera plus
  a painted foreground layer; both tilt a few degrees with the mouse (lerped).
- Scroll (ScrollTrigger scrub, hero pinned briefly): camera dollies forward,
  dissipation rises and splat force drops (paint calms), the first featured
  cover is revealed through the dye as a mask, then the plane shrinks onto the
  first project card's rect and hands off to the gallery plane (seamless).
- Hero text is real HTML. SplitText splits name + positioning into chars
  inside line masks; chars rise and settle with stagger. Screen readers get
  the unsplit text (aria-label on the parent, chars aria-hidden).
- Static fallback: a painted hero image (`/src/assets/paint/hero-fallback`),
  served through astro:assets, always in the HTML; the canvas fades in over it.

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

### 9. Desk scene — morphing device + hijab character (STATUS: BUILT, placeholder character)
Scroll-driven isometric three.js scene in "Selected work" (`#work`), followed
by the "All work" grid + lens (`#all-work`). Original build; inspired by
"person at a desk" studio sites, no copied code/assets.

**Afnan's direction (latest wins):**
1. Character = a young woman in MODEST clothing: long loose dark dress
   (abaya), long sleeves, HIJAB wrapping the head and draping over the
   shoulders/upper back (brand terracotta). Pose follows Afnan's reference:
   seated in an office chair (armrests, 5-star base) at a white desk with
   solid side panels, seen from behind at an angle. Do NOT copy the
   reference's background — keep the `--color-scene` token.
2. The device MORPHS while scrolling: one device per project (frontmatter
   `device: desktop | laptop | tablet | phone`), shape blends continuously
   between chapters. Current mapping: axivus phone, bridging-divides laptop,
   glitchard desktop, brand-identity tablet, web-saas-design desktop.
3. The screen switches to each project's cover with a ~250 ms flicker.
4. Removed at Afnan's request: the earlier blocky male figure, brush jar,
   small canvas, desk with legs. GLB/avatar loading was removed too (it can
   return if a real model is supplied — see git history b96d860 for the
   loader + Blender export settings).

**Files** (`src/scripts/webgl/desk/`)
- `device.ts` — morphing device. Front = one plane, bezel+screen drawn with a
  rounded-rect SDF in the fragment shader (size/radius/bezel animate every
  frame, crisp corners, no geometry rebuild); thickness = 6 stacked SDF
  slices; desktop stand + keyboard (InstancedMesh keys, accent Esc key)
  scale/slide; the keyboard becomes the laptop base. `SHAPES` holds every
  morphing value per device (heights are above the desk top).
- `character.ts` — woman in hijab + office chair + desk (primitives).
  Hands type while `kb` > 0 and blend to resting on the desk for
  tablet/phone. `DESK_TOP_Y = 0.765`.
- `scene.ts` — renderer, lights, blob shadows, morph timing
  (`MORPH_FROM = 0.62` of each chapter, finishing as the next chapter and
  cover begin), typing speed from scroll velocity, chair sway, head-follow
  (±15°/±10°), screen flicker, camera drift + push-in that faces the tilted
  screen square-on (`elevation → -tilt`), raycast hover ("View") + click.
- `controller.ts` — tier gate, ScrollTrigger progress/velocity, chapters,
  label, lines, lens (`setDevices` on lens change), focus → scroll, lazy
  import, pause off-screen / hidden tab. No three.js inside.
- `config.ts` — camera, typing speeds, push start.
- `src/components/home/DeskScene.astro` — markup + fallback/live CSS.
- `src/assets/desk/desk-poster.jpg` — still render (fallback + loading
  placeholder). Regenerate from the live scene whenever the scene changes
  (Playwright, `?motion=full`, UI hidden, crop x60 y150 900×700 @1440×900;
  the `.desk__poster` live CSS position matches that crop).

**Unchanged mechanics:** CSS sticky pin + ScrollTrigger progress; chapters
are real focusable HTML; three.js lazy-loaded ~1 viewport early; DPR ≤ 2 +
frame-time guard; fallback = blue panel + poster for no-JS, tier lite/none,
WebGL errors. `?motion=full|lite|none` forces a tier; the console logs
`[motion] tier: … — reason`.

**Tier detection (relaxed):** low power = Save-Data, ≤ 2 cores or
deviceMemory ≤ 2 (4-core laptops get the full scene). Reduced motion
(Windows "Animation effects" off) → still image by design.

**Honest limit:** a primitive-built figure can't match a sculpted, rigged
character like Afnan's reference. For that quality: a custom/licensed
rigged GLB (hijab, modest clothing) + Mixamo-style "Typing" clip; re-add the
GLTFLoader path from b96d860.

**Tokens:** `--color-scene` (#2f4bff), `--color-on-scene`,
`--color-on-scene-muted`, `--color-scene-line`, `--font-mono` (JetBrains Mono
placeholder). Frontmatter: optional `year` (big label), `device` (default desktop).

### Performance budget
Initial JS on home before idle: Lenis + GSAP core/ScrollTrigger/SplitText
(~50 KB gz). three.js (~130 KB gz) + shaders: dynamic `import()` after the
`load` event + `requestIdleCallback`, home only, tier full only. Lighthouse
mobile runs as tier lite (no three.js), target ≥ 90.

### Build order (APPROVED — stop for review after each)
(a) Lenis, cursor, micro interactions ✅ → **desk scene ✅ (morphing device + hijab character)** →
(b) preloader + hero text → (c) WebGL hero (settles into the scene blue) →
~~(d) WebGL gallery~~ (dropped; desk scene replaces it) → **Phase 3** case-study template (+ part 8)
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
- Home order: hero → desk scene `#work` → All work grid `#all-work` → Play →
  Studio → About → footer `#contact`.

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
- [x] Phase 2 — content collections, 5 placeholder projects, home + role lens.
      `/work/[slug]` is a basic stub until Phase 3.
- [ ] Phase 3 — case study template + MDX components + PhoneFrame + showcase
      gallery layout for `format: showcase`.
- [ ] Phase 4 — Play, Studio (lightbox), About.
- [ ] Phase 5 — immersive motion layer, expanded to the award-level brief
      (steps a–g above). Approved. Step (a) done. Desk scene done (morphing device,
   hijab character placeholder).
- [ ] Phase 6 — perf / a11y / SEO pass, Vercel deploy steps.
