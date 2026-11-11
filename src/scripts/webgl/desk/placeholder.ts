/**
 * Stylised placeholder: figure, desk, chair, monitor (+ a jar of paint
 * brushes, a nod to the painter). Built from primitives so motion can be
 * reviewed before the real avatar.glb exists. Typing is procedural.
 */
import * as THREE from 'three';

export interface Palette {
  paper: THREE.Color;
  paperDeep: THREE.Color;
  ink: THREE.Color;
  accent: THREE.Color;
  skin: THREE.Color;
}

export interface Placeholder {
  props: THREE.Group; // desk, chair, monitor…
  figure: THREE.Group; // the character
  screen: THREE.Mesh; // monitor screen plane (material set by caller)
  head: THREE.Object3D;
  chairTop: THREE.Object3D;
  /** Advance procedural typing. phase grows faster when typing faster. */
  animate: (phase: number, time: number) => void;
}

const UP = new THREE.Vector3(0, 1, 0);

/** Cylinder between two points (unit-height geometry, scaled). */
function limb(radius: number, mat: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 12), mat);
  const place = (a: THREE.Vector3, b: THREE.Vector3) => {
    const dir = new THREE.Vector3().subVectors(b, a);
    mesh.position.copy(a).addScaledVector(dir, 0.5);
    mesh.scale.set(1, dir.length(), 1);
    mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
  };
  return { mesh, place };
}

function joint(radius: number, mat: THREE.Material) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), mat);
}

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

export function buildPlaceholder(p: Palette): Placeholder {
  const mat = (color: THREE.Color, roughness = 0.75) => new THREE.MeshStandardMaterial({ color, roughness });
  const paper = mat(p.paper);
  const paperDeep = mat(p.paperDeep);
  const ink = mat(p.ink, 0.6);
  const accent = mat(p.accent);
  const skin = mat(p.skin, 0.8);

  // ---------- Props ----------
  const props = new THREE.Group();

  // Desk
  props.add(box(1.5, 0.05, 0.72, paper, 0, 0.74, 0));
  for (const [x, z] of [[-0.7, -0.31], [0.7, -0.31], [-0.7, 0.31], [0.7, 0.31]]) {
    props.add(box(0.04, 0.72, 0.04, ink, x, 0.36, z));
  }

  // Monitor (screen faces +Z)
  props.add(box(0.18, 0.02, 0.14, ink, 0, 0.775, -0.2)); // foot
  props.add(box(0.04, 0.26, 0.03, ink, 0, 0.9, -0.23)); // neck
  props.add(box(0.66, 0.42, 0.03, ink, 0, 1.08, -0.215)); // bezel
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.38));
  screen.position.set(0, 1.08, -0.199);
  props.add(screen);

  // Keyboard + mouse
  props.add(box(0.44, 0.02, 0.15, paperDeep, -0.02, 0.775, 0.1));
  props.add(box(0.06, 0.02, 0.09, paperDeep, 0.32, 0.775, 0.12));

  // Jar of brushes (the painter's corner)
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.14, 20), paperDeep);
  jar.position.set(-0.56, 0.835, -0.12);
  props.add(jar);
  [[-0.015, 0.2, accent], [0.02, -0.15, ink], [0.0, 0.05, accent]].forEach(([dx, tilt, m], i) => {
    const brush = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.3, 8), ink);
    handle.position.y = 0.15;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.05, 8), m as THREE.Material);
    tip.position.y = 0.32;
    brush.add(handle, tip);
    brush.position.set(-0.56 + (dx as number), 0.79, -0.12 + i * 0.01);
    brush.rotation.z = tilt as number;
    props.add(brush);
  });

  // A small canvas leaning on the desk (painter detail)
  const canvas = box(0.3, 0.38, 0.02, paper, 0.58, 0.96, -0.24);
  canvas.rotation.x = -0.18;
  const paint = box(0.22, 0.26, 0.005, accent, 0.58, 0.965, -0.226);
  paint.rotation.x = -0.18;
  props.add(canvas, paint);

  // Chair: base stays put, top (seat + back) sways.
  const chairBase = new THREE.Group();
  chairBase.position.set(0, 0, 0.78);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 12), ink);
  pole.position.y = 0.24;
  chairBase.add(pole);
  for (let i = 0; i < 5; i++) {
    const leg = box(0.3, 0.03, 0.04, ink, 0, 0.05, 0);
    leg.rotation.y = (i / 5) * Math.PI * 2;
    leg.translateX(0.15);
    chairBase.add(leg);
  }
  const chairTop = new THREE.Group();
  chairTop.position.y = 0.44;
  chairTop.add(box(0.48, 0.07, 0.46, ink, 0, 0, 0)); // seat
  chairTop.add(box(0.44, 0.34, 0.05, ink, 0, 0.27, 0.24)); // back (low, so the figure reads)
  chairBase.add(chairTop);
  props.add(chairBase);

  // ---------- Figure (sits at z ≈ 0.78, faces -Z) ----------
  const figure = new THREE.Group();
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  // Torso leaning slightly toward the desk
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.3, 6, 16), accent);
  torso.position.set(0, 0.86, 0.76);
  torso.rotation.x = -0.14;
  torso.scale.set(1.15, 1, 0.8);
  figure.add(torso);

  // Neck + head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.1, 10), skin);
  neck.position.set(0, 1.1, 0.71);
  figure.add(neck);
  const head = new THREE.Group();
  head.position.set(0, 1.2, 0.69);
  const skull = joint(0.115, skin);
  skull.scale.set(0.95, 1.05, 1);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.122, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), ink);
  hair.rotation.x = 0.35; // hair sits back on the head
  hair.position.z = 0.012;
  const bun = joint(0.05, ink);
  bun.position.set(0, 0.07, 0.1);
  // Face details (it faces -Z) so head turns are readable: nose, ears, glasses.
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.06, 8), skin);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, -0.01, -0.12);
  const ears = [-1, 1].map((s) => {
    const ear = joint(0.028, skin);
    ear.scale.set(0.5, 1, 0.8);
    ear.position.set(0.112 * s, 0, 0.0);
    return ear;
  });
  const glasses = new THREE.Group();
  [-1, 1].forEach((s) => {
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20), ink);
    lens.position.set(0.045 * s, 0.025, -0.105);
    glasses.add(lens);
  });
  head.add(skull, hair, bun, nose, ...ears, glasses);
  figure.add(head);

  // Legs (static, seated)
  const trousers = ink;
  for (const s of [-1, 1]) {
    const hip = v(0.09 * s, 0.56, 0.76);
    const knee = v(0.11 * s, 0.56, 0.4);
    const foot = v(0.11 * s, 0.07, 0.38);
    const thigh = limb(0.065, trousers);
    thigh.place(hip, knee);
    const shin = limb(0.05, trousers);
    shin.place(knee, foot);
    const shoe = box(0.09, 0.06, 0.18, paperDeep, foot.x, 0.04, foot.z - 0.04);
    figure.add(thigh.mesh, shin.mesh, joint(0.065, trousers).translateX(knee.x).translateY(knee.y).translateZ(knee.z), shoe);
  }

  // Arms: shoulder → elbow → hand. Hands rest on the keyboard and tap.
  type Arm = { upper: ReturnType<typeof limb>; fore: ReturnType<typeof limb>; elbowJ: THREE.Mesh; hand: THREE.Mesh; s: number };
  const arms: Arm[] = [-1, 1].map((s) => {
    const upper = limb(0.048, accent);
    const fore = limb(0.04, skin);
    const elbowJ = joint(0.048, accent);
    const hand = joint(0.045, skin);
    hand.scale.set(1, 0.6, 1.3);
    figure.add(upper.mesh, fore.mesh, elbowJ, hand);
    return { upper, fore, elbowJ, hand, s };
  });

  const animate = (phase: number, time: number) => {
    // Gentle breathing
    torso.scale.y = 1 + Math.sin(time * 1.6) * 0.012;
    for (const a of arms) {
      // Each hand taps on its own rhythm: sharp down-strokes, soft lift.
      const local = phase + (a.s > 0 ? Math.PI * 0.85 : 0);
      const tap = Math.pow(Math.max(0, Math.sin(local)), 3);
      const drift = Math.sin(local * 0.37) * 0.025; // hands wander across keys
      const shoulder = v(0.2 * a.s, 1.04, 0.73);
      const hand = v(0.11 * a.s + drift, 0.81 + tap * 0.025, 0.13 + Math.cos(local * 0.5) * 0.015);
      const elbow = v(0.23 * a.s, 0.86, 0.5);
      a.upper.place(shoulder, elbow);
      a.fore.place(elbow, hand);
      a.elbowJ.position.copy(elbow);
      a.hand.position.copy(hand);
    }
  };
  animate(0, 0);

  for (const o of [props, figure]) {
    o.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).castShadow = false;
    });
  }

  return { props, figure, screen, head, chairTop, animate };
}
