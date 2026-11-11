/**
 * Desk scene settings. Units ≈ metres, +Y up. The desk is centred at the
 * origin; the device's screen faces +Z; she sits at +Z facing -Z.
 * Which device each project shows: `device:` in the project's frontmatter.
 */
export const DESK = {
  camera: {
    azimuthDeg: 52, // 0 = straight at the screen; positive = from the right (behind her shoulder)
    elevationDeg: 28, // ~30° reads as isometric
    frustum: 2.9, // world units visible vertically at zoom 1
    orbitDeg: 16, // slow drift across the whole scroll
    zoomStart: 1,
    zoomEnd: 1.18,
    /** Scene sits left of centre so the project text fits on the right. */
    shift: 0.17,
  },
  typing: {
    minSpeed: 0.8, // idle
    maxSpeed: 2.2, // fast scroll
    velocityForMax: 2600, // px/s of scroll that reaches maxSpeed
  },
  /** Last part of the scroll (0–1) where the camera pushes into the screen. */
  pushStart: 0.84,
} as const;
