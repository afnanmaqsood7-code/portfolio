/**
 * Desk scene settings — the one file to edit when the real avatar.glb arrives.
 * Units are metres (Blender default), +Y up. The desk is centred at the
 * origin, the monitor screen faces +Z, the chair sits at +Z facing -Z.
 */
export const DESK = {
  modelUrl: '/models/avatar.glb',
  // Draco decoder: three.js bundles it (hashed, self-hosted, fetched only
  // when a Draco-compressed model loads). No path to configure.

  /** Clip names are matched case-insensitively; first match wins. The browser
   *  console logs every clip in the file as "[desk] clips: …". */
  clips: {
    typing: ['typing', 'type', 'keyboard', 'work'],
    idle: ['idle', 'breathing', 'sit'],
  },
  /** Bone that turns toward the cursor (exact name, case-insensitive). */
  headBones: ['head', 'mixamorig:head', 'mixamorighead', 'def-head', 'head_jnt'],
  /** If the GLB includes its own monitor, name its screen mesh one of these
   *  and the project covers will be shown on it. */
  screenMeshes: ['screen', 'monitor_screen', 'display'],

  /** Where the avatar sits. Adjust if your export's origin isn't at the hips/floor. */
  model: {
    /** true = the GLB has its own desk/chair/monitor, so hide the placeholder props. */
    includesProps: false,
    scale: 1,
    position: [0, 0, 0.78] as [number, number, number],
    rotationY: Math.PI, // face the monitor (-Z)
  },

  camera: {
    azimuthDeg: 52, // 0 = looking straight at the screen; positive = from the right
    elevationDeg: 28, // ~30° reads as isometric
    frustum: 3.35, // world units visible vertically at zoom 1
    orbitDeg: 16, // total orbit across the scroll
    zoomStart: 1,
    zoomEnd: 1.22,
    /** Scene sits left of centre so the project text fits on the right. */
    shift: 0.17,
  },

  typing: {
    minSpeed: 0.8, // idle scroll
    maxSpeed: 2.2, // fast scroll
    velocityForMax: 2600, // px/s of scroll that reaches maxSpeed
  },

  /** Last part of the scroll (0–1) where the camera pushes into the monitor. */
  pushStart: 0.84,
} as const;
