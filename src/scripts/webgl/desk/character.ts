/**
 * Stylised character + furniture, built from primitives (no external model).
 * A young woman in modest clothing — long loose dress (abaya) with long
 * sleeves and a hijab draped over the shoulders — seated at a desk in an
 * office chair, seen from behind at an angle. She faces -Z (toward the desk).
 *
 * Hands type on the keyboard when one exists (desktop/laptop) and rest on
 * the desk otherwise (tablet/phone); `animate()` blends between the two.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Palette } from './device';

const UP = new THREE.Vector3(0, 1, 0);
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Tapered tube between two points (unit height, scaled + oriented). */
function limb(rTop: number, rBottom: number, mat: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, 1, 16), mat);
  const place = (a: THREE.Vector3, b: THREE.Vector3) => {
    const dir = new THREE.Vector3().subVectors(b, a);
    mesh.position.copy(a).addScaledVector(dir, 0.5);
    mesh.scale.set(1, dir.length(), 1);
    // Cylinder +Y runs from b to a here so rTop sits at `a`.
    mesh.quaternion.setFromUnitVectors(UP, dir.normalize().negate());
  };
  return { mesh, place };
}

const ball = (r: number, mat: THREE.Material) => new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat);
const rbox = (w: number, h: number, d: number, r: number, mat: THREE.Material) =>
  new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat);

export const DESK_TOP_Y = 0.765;

export function buildCharacter(p: Palette) {
  const std = (color: THREE.Color | string, roughness = 0.8) =>
    new THREE.MeshStandardMaterial({ color, roughness });
  const hijabMat = std(p.accent, 0.85); // brand terracotta
  const dressMat = std(p.ink, 0.9); // long dark abaya
  const skin = std('#c99272', 0.7);
  const shoeMat = std(p.paperDeep, 0.6);
  const deskMat = std(p.paper, 0.55);
  const chairMat = std(p.ink, 0.5);
  const chairSeat = std(new THREE.Color(p.ink).lerp(new THREE.Color('#3a3f8f'), 0.35), 0.6);

  const props = new THREE.Group();
  const figure = new THREE.Group();

  // ---------- Desk (top + solid side panels + modesty panel) ----------
  const top = rbox(1.36, 0.045, 0.72, 0.008, deskMat);
  top.position.set(0.05, DESK_TOP_Y - 0.0225, 0);
  props.add(top);
  for (const x of [-0.6, 0.7]) {
    const side = rbox(0.04, 0.74, 0.68, 0.006, deskMat);
    side.position.set(x, 0.37, 0);
    props.add(side);
  }
  const modesty = rbox(1.26, 0.42, 0.025, 0.005, deskMat);
  modesty.position.set(0.05, 0.5, -0.3);
  props.add(modesty);

  // ---------- Office chair (base stays, top sways) ----------
  const chair = new THREE.Group();
  chair.position.set(0, 0, 0.8);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.3, 12), chairMat);
  pole.position.y = 0.22;
  chair.add(pole);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    const leg = rbox(0.28, 0.025, 0.035, 0.01, chairMat);
    leg.position.set(Math.cos(a) * 0.14, 0.06, Math.sin(a) * 0.14);
    leg.rotation.y = -a;
    const wheel = ball(0.024, chairMat);
    wheel.position.set(Math.cos(a) * 0.27, 0.025, Math.sin(a) * 0.27);
    chair.add(leg, wheel);
  }
  const chairTop = new THREE.Group();
  chairTop.position.y = 0.42;
  const seat = rbox(0.48, 0.07, 0.46, 0.03, chairSeat);
  const back = rbox(0.44, 0.46, 0.06, 0.04, chairMat);
  back.position.set(0, 0.36, 0.25);
  back.rotation.x = 0.1;
  const backStem = rbox(0.06, 0.2, 0.03, 0.01, chairMat);
  backStem.position.set(0, 0.12, 0.25);
  chairTop.add(seat, back, backStem);
  for (const s of [-1, 1]) {
    const post = rbox(0.03, 0.18, 0.03, 0.01, chairMat);
    post.position.set(0.24 * s, 0.1, 0.06);
    const rest = rbox(0.06, 0.03, 0.26, 0.012, chairMat);
    rest.position.set(0.24 * s, 0.2, 0.02);
    chairTop.add(post, rest);
  }
  chair.add(chairTop);
  props.add(chair);

  // ---------- Figure: seated, facing -Z ----------
  // Torso (long loose dress)
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.3, 8, 20), dressMat);
  torso.position.set(0, 0.85, 0.78);
  torso.rotation.x = -0.12;
  torso.scale.set(1.12, 1, 0.82);
  figure.add(torso);

  // Lap + long skirt falling over the knees to the ankles (modest silhouette)
  for (const s of [-1, 1]) {
    const hip = v(0.09 * s, 0.55, 0.76);
    const knee = v(0.1 * s, 0.55, 0.42);
    const ankle = v(0.11 * s, 0.09, 0.4);
    const thigh = limb(0.085, 0.08, dressMat);
    thigh.place(hip, knee);
    const skirt = limb(0.085, 0.11, dressMat); // flares toward the hem
    skirt.place(knee, ankle);
    const kneeCap = ball(0.085, dressMat);
    kneeCap.position.copy(knee);
    const shoe = rbox(0.08, 0.05, 0.15, 0.02, shoeMat);
    shoe.position.set(ankle.x, 0.03, ankle.z - 0.06);
    figure.add(thigh.mesh, skirt.mesh, kneeCap, shoe);
  }

  // Head: face oval inside a hijab that wraps the head and drapes over the
  // shoulders and chest.
  const head = new THREE.Group();
  head.position.set(0, 1.19, 0.7);
  const wrap = ball(0.118, hijabMat);
  wrap.scale.set(0.95, 1.06, 1);
  const face = ball(0.1, skin);
  face.scale.set(0.72, 0.9, 0.55);
  face.position.set(0, -0.012, -0.072);
  // Soft fold where the hijab frames the face
  const fold = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.016, 10, 28), hijabMat);
  fold.scale.set(0.88, 1.08, 1);
  fold.position.set(0, -0.01, -0.06);
  head.add(wrap, face, fold);
  figure.add(head);
  // Drape: flows from under the head over the shoulders and upper back, so
  // the head and shoulders read as one continuous hijab (no "collar" gap).
  const drapeMat = hijabMat.clone();
  drapeMat.side = THREE.DoubleSide;
  const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.235, 0.34, 32, 1, true), drapeMat);
  drape.position.set(0, 1.0, 0.765);
  drape.scale.set(1.04, 1, 1.0); // wide enough that the dress never pokes through
  drape.rotation.x = -0.12;
  // Rounded shoulder cap that closes the top of the drape around the neck.
  const cap = ball(0.11, hijabMat);
  cap.scale.set(1.05, 0.7, 0.95);
  cap.position.set(0, 1.12, 0.73);
  figure.add(cap);
  figure.add(drape);

  // Arms: long sleeves to the wrist, then hands.
  type Arm = {
    upper: ReturnType<typeof limb>;
    fore: ReturnType<typeof limb>;
    elbow: THREE.Mesh;
    hand: THREE.Mesh;
    s: number;
  };
  const arms: Arm[] = [-1, 1].map((s) => {
    const upper = limb(0.055, 0.05, dressMat);
    const fore = limb(0.05, 0.045, dressMat);
    const elbow = ball(0.05, dressMat);
    const hand = ball(0.038, skin);
    hand.scale.set(1, 0.6, 1.3);
    figure.add(upper.mesh, fore.mesh, elbow, hand);
    return { upper, fore, elbow, hand, s };
  });

  /**
   * @param phase   typing phase (grows faster when typing faster)
   * @param time    seconds, for breathing
   * @param kb      0–1 keyboard presence (1 = typing, 0 = hands rest)
   * @param keysZ   world Z of the keyboard's key rows
   */
  function animate(phase: number, time: number, kb: number, keysZ: number) {
    torso.scale.y = 1 + Math.sin(time * 1.6) * 0.012;
    for (const a of arms) {
      const local = phase + (a.s > 0 ? Math.PI * 0.85 : 0);
      const tap = Math.pow(Math.max(0, Math.sin(local)), 3) * kb;
      const drift = Math.sin(local * 0.37) * 0.025 * kb;
      const shoulder = v(0.19 * a.s, 1.03, 0.73);
      const typing = v(0.11 * a.s + drift, DESK_TOP_Y + 0.045 + tap * 0.025, keysZ + 0.03);
      const resting = v(0.2 * a.s, DESK_TOP_Y + 0.03, 0.27);
      const hand = resting.lerp(typing, kb);
      const elbow = v(0.22 * a.s, 0.84, 0.52);
      a.upper.place(shoulder, elbow);
      a.fore.place(elbow, hand);
      a.elbow.position.copy(elbow);
      a.hand.position.copy(hand);
    }
  }
  animate(0, 0, 1, 0.24);

  return { props, figure, head, chairTop, animate };
}
