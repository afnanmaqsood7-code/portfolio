# /src/assets/paint — Afnan's painted material

Every painted effect on the site reads from this folder. The files here now
are **simple placeholders**: replace them with your scans.

| File | Used for | Spec |
| --- | --- | --- |
| `stroke-01.svg` | Underline accent in hero / section dividers (Phase 1+) | Single-colour SVG, `fill="currentColor"`, wide (≈10:1) |
| `stroke-wipe.png` *(Phase 5)* | Page-transition brush-wipe mask | PNG, transparent bg, white stroke, ≥ 2400px wide |
| `texture-*.png` *(Phase 5)* | Brush/paper textures blended into the WebGL fluid | PNG, 1024 or 2048 square, greyscale, tileable if possible |
| `hero-fallback.jpg` *(Phase 5)* | Static painted hero for reduced motion / low-power / no WebGL | JPG/WebP, ≥ 2400px wide, a photo of a real painting |

Tips
- Scan at 600 dpi, clean in Photoshop, export with transparency.
- SVG strokes: vectorise (Illustrator Image Trace), single path, remove fills
  other than the stroke, set `fill="currentColor"` so tokens colour them.
- Keep names lowercase-kebab. If you add new files, note them in this table.
