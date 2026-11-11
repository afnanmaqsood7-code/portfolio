/**
 * One morphing device: desktop monitor ⇄ laptop ⇄ tablet ⇄ phone.
 *
 * The front (bezel + screen) is a single plane whose shape is drawn in the
 * fragment shader with a rounded-rectangle SDF, so size, corner radius and
 * bezel can change every frame with crisp edges and no geometry rebuilds.
 * Thickness = a few stacked SDF "slices" behind the front (cheap extrusion).
 * Stand and keyboard are ordinary meshes that scale/slide in and out.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type DeviceKind = 'desktop' | 'laptop' | 'tablet' | 'phone';

export interface Palette {
  paper: THREE.Color;
  paperDeep: THREE.Color;
  ink: THREE.Color;
  accent: THREE.Color;
}

/** Every value that morphs. Sizes in metres; heights are above the desk top. */
interface Shape {
  w: number; // screen width
  h: number; // screen height
  radius: number; // outer corner radius
  bezel: number;
  thick: number;
  bottom: number; // height of the device's bottom edge (hinge/pivot)
  z: number; // pivot depth
  tilt: number; // lean back (radians)
  stand: number; // 0–1 desktop stand
  kb: number; // 0–1 keyboard presence
  kbZ: number; // keyboard centre depth
  kbW: number; // keyboard width scale
  kbD: number; // keyboard depth scale (laptop base is deeper)
  camY: number; // camera target height
  camZoom: number; // extra zoom so small devices still read large
}

export const SHAPES: Record<DeviceKind, Shape> = {
  desktop: { w: 0.86, h: 0.54, radius: 0.025, bezel: 0.02, thick: 0.03, bottom: 0.14, z: 0, tilt: 0, stand: 1, kb: 1, kbZ: 0.42, kbW: 1, kbD: 1, camY: 0.42, camZoom: 1 },
  laptop: { w: 0.7, h: 0.44, radius: 0.022, bezel: 0.018, thick: 0.014, bottom: 0.022, z: 0.02, tilt: -0.26, stand: 0, kb: 1, kbZ: 0.24, kbW: 1.2, kbD: 2.1, camY: 0.24, camZoom: 1.28 },
  tablet: { w: 0.44, h: 0.6, radius: 0.04, bezel: 0.024, thick: 0.012, bottom: 0.03, z: 0.08, tilt: -0.32, stand: 0, kb: 0, kbZ: 0.42, kbW: 1, kbD: 1, camY: 0.32, camZoom: 1.3 },
  phone: { w: 0.24, h: 0.5, radius: 0.05, bezel: 0.012, thick: 0.016, bottom: 0.03, z: 0.1, tilt: -0.2, stand: 0, kb: 0, kbZ: 0.42, kbW: 1, kbD: 1, camY: 0.3, camZoom: 1.5 },
};

export function mixShape(a: Shape, b: Shape, t: number): Shape {
  const out = {} as Shape;
  (Object.keys(a) as (keyof Shape)[]).forEach((k) => (out[k] = a[k] + (b[k] - a[k]) * t));
  return out;
}

const SLICES = 6; // thickness layers

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Shared GLSL: signed distance to a rounded rectangle (centre 0, half size b). */
const sdf = /* glsl */ `
  float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
`;

function frontMaterial(ink: THREE.Color) {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uOuter: { value: new THREE.Vector2(1, 1) },
      uRadius: { value: 0.02 },
      uBezel: { value: 0.02 },
      uInk: { value: ink.clone() },
      // Screen content (same contract as the old screen material)
      uTexA: { value: null as THREE.Texture | null },
      uTexB: { value: null as THREE.Texture | null },
      uAspectA: { value: 4 / 3 },
      uAspectB: { value: 4 / 3 },
      uMix: { value: 0 },
      uFlicker: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: vert,
    fragmentShader: /* glsl */ `
      uniform vec2 uOuter;
      uniform float uRadius, uBezel, uAspectA, uAspectB, uMix, uFlicker, uTime;
      uniform vec3 uInk;
      uniform sampler2D uTexA, uTexB;
      varying vec2 vUv;
      ${sdf}
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

      vec2 coverUv(vec2 uv, float screenAspect, float texAspect) {
        vec2 s = screenAspect > texAspect ? vec2(1.0, texAspect / screenAspect) : vec2(screenAspect / texAspect, 1.0);
        return (uv - 0.5) * s + 0.5;
      }

      void main() {
        vec2 p = (vUv - 0.5) * uOuter;               // metres from the centre
        float aa = fwidth(p.x) * 1.2;
        float outer = sdRoundRect(p, uOuter * 0.5, uRadius);
        if (outer > aa) discard;
        vec2 inner = uOuter * 0.5 - uBezel;
        float screen = sdRoundRect(p, inner, max(uRadius - uBezel, 0.004));

        // Bezel: ink with a soft top highlight so it reads as an object.
        vec3 bezel = uInk + 0.06 * smoothstep(-0.5, 0.5, vUv.y);

        // Screen: project cover with flicker/scanlines.
        vec2 suv = p / (inner * 2.0) + 0.5;
        float sAspect = inner.x / inner.y;
        float band = floor(suv.y * 36.0);
        suv.x += (hash(vec2(band, floor(uTime * 40.0))) - 0.5) * 0.06 * uFlicker;
        vec3 a = texture2D(uTexA, coverUv(suv, sAspect, uAspectA)).rgb;
        vec3 b = texture2D(uTexB, coverUv(suv, sAspect, uAspectB)).rgb;
        vec3 col = mix(a, b, uMix);
        col = mix(col, vec3(hash(suv * 900.0 + uTime)), 0.35 * uFlicker) + 0.25 * uFlicker;
        col *= 0.97 + 0.03 * sin(suv.y * 520.0);

        vec3 c = mix(col, bezel, smoothstep(-aa, aa, screen));
        gl_FragColor = vec4(c, 1.0 - smoothstep(-aa, aa, outer));
        #include <colorspace_fragment>
      }
    `,
  });
}

function sliceMaterial(ink: THREE.Color) {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uOuter: { value: new THREE.Vector2(1, 1) },
      uRadius: { value: 0.02 },
      uColor: { value: ink.clone().multiplyScalar(0.8) },
    },
    vertexShader: vert,
    fragmentShader: /* glsl */ `
      uniform vec2 uOuter;
      uniform float uRadius;
      uniform vec3 uColor;
      varying vec2 vUv;
      ${sdf}
      void main() {
        vec2 p = (vUv - 0.5) * uOuter;
        float aa = fwidth(p.x) * 1.2;
        float d = sdRoundRect(p, uOuter * 0.5, uRadius);
        if (d > aa) discard;
        gl_FragColor = vec4(uColor, 1.0 - smoothstep(-aa, aa, d));
        #include <colorspace_fragment>
      }
    `,
  });
}

const rbox = (w: number, h: number, d: number, r: number, mat: THREE.Material) =>
  new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), mat);

export function buildDevice(p: Palette) {
  const ink = new THREE.MeshStandardMaterial({ color: p.ink, roughness: 0.45, metalness: 0.1 });
  const body = new THREE.MeshStandardMaterial({ color: p.paper, roughness: 0.6 });
  const keyMat = new THREE.MeshStandardMaterial({ color: p.paperDeep, roughness: 0.7 });
  const accent = new THREE.MeshStandardMaterial({ color: p.accent, roughness: 0.6 });

  const root = new THREE.Group();

  // ---------- Morphing panel (pivot = bottom centre, so tilt hinges there) ----------
  const pivot = new THREE.Group();
  root.add(pivot);
  const plane = new THREE.PlaneGeometry(1, 1);
  const front = new THREE.Mesh(plane, frontMaterial(p.ink));
  const frontMat = front.material as THREE.ShaderMaterial;
  front.renderOrder = 2;
  pivot.add(front);
  const slices = Array.from({ length: SLICES }, () => {
    const m = new THREE.Mesh(plane, sliceMaterial(p.ink));
    m.material.side = THREE.DoubleSide;
    pivot.add(m);
    return m;
  });

  // ---------- Desktop stand ----------
  const neck = rbox(0.06, 1, 0.03, 0.01, ink); // unit height, scaled
  const foot = rbox(0.3, 0.018, 0.2, 0.008, ink);
  root.add(neck, foot);

  // ---------- Keyboard / laptop base ----------
  const keyboard = new THREE.Group();
  const base = rbox(0.62, 0.022, 0.2, 0.008, body);
  base.position.y = 0.011;
  keyboard.add(base);
  const rows = [14, 14, 13, 12];
  const pitch = 0.04;
  const keyGeo = new RoundedBoxGeometry(0.034, 0.012, 0.034, 2, 0.005);
  const keys = new THREE.InstancedMesh(keyGeo, keyMat, rows.reduce((a, b) => a + b, 0) + 1);
  const m4 = new THREE.Matrix4();
  let i = 0;
  rows.forEach((n, r) => {
    const z = -0.06 + r * pitch;
    const x0 = -((n - 1) * pitch) / 2;
    for (let k = 0; k < n; k++) {
      m4.makeTranslation(x0 + k * pitch, 0.028, z);
      if (r === 0 && k === 0) m4.scale(new THREE.Vector3(0, 0, 0)); // replaced by the accent key
      keys.setMatrixAt(i++, m4);
    }
  });
  m4.compose(new THREE.Vector3(0, 0.026, -0.06 + 4 * pitch), new THREE.Quaternion(), new THREE.Vector3(6.5, 1, 1));
  keys.setMatrixAt(i, m4);
  keyboard.add(keys);
  const esc = rbox(0.034, 0.012, 0.034, 0.005, accent);
  esc.position.set(-((14 - 1) * pitch) / 2, 0.028, -0.06);
  keyboard.add(esc);
  root.add(keyboard);

  const screenCenter = new THREE.Vector3();

  /** Apply a (possibly in-between) shape. Cheap: uniforms + transforms only. */
  function apply(s: Shape) {
    const ow = s.w + 2 * s.bezel;
    const oh = s.h + 2 * s.bezel;
    pivot.position.set(0, s.bottom, s.z);
    pivot.rotation.x = s.tilt;

    front.scale.set(ow, oh, 1);
    front.position.set(0, oh / 2, s.thick / 2);
    frontMat.uniforms.uOuter.value.set(ow, oh);
    frontMat.uniforms.uRadius.value = s.radius;
    frontMat.uniforms.uBezel.value = s.bezel;
    slices.forEach((sl, k) => {
      sl.scale.set(ow, oh, 1);
      sl.position.set(0, oh / 2, s.thick / 2 - (s.thick * (k + 1)) / SLICES);
      const mat = sl.material as THREE.ShaderMaterial;
      mat.uniforms.uOuter.value.set(ow, oh);
      mat.uniforms.uRadius.value = s.radius;
    });

    // Stand grows from the foot up to the panel's bottom edge.
    const standH = Math.max(0.001, (s.bottom - 0.018) * s.stand);
    neck.scale.set(s.stand, standH, s.stand);
    neck.position.set(0, 0.018 + standH / 2, s.z - 0.03);
    foot.scale.setScalar(Math.max(0.001, s.stand));
    foot.position.set(0, 0.009, s.z - 0.04);
    neck.visible = foot.visible = s.stand > 0.01;

    // Keyboard: slides back under the panel to become the laptop base,
    // and shrinks away for tablet/phone.
    keyboard.visible = s.kb > 0.01;
    keyboard.scale.set(s.kbW * s.kb, Math.max(0.001, s.kb), s.kbD * s.kb);
    keyboard.position.set(0, 0, s.kbZ);

    front.updateWorldMatrix(true, false);
    screenCenter.set(0, 0, 0).applyMatrix4(front.matrixWorld);
  }

  return { root, front, frontMat, apply, screenCenter };
}
