/**
 * About hero: an original 3D night scene of the CN Tower with a curved band
 * of cards around the pod (three.js). Scroll and drag spin the band; clicking
 * a card follows its link. Returns destroy(). Caller handles fallbacks.
 */
import * as THREE from 'three';

export interface Card { k: string; t: string; href: string }

function bandTexture(cards: Card[]) {
  const W = 4096, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const n = cards.length, cw = W / n;
  g.clearRect(0, 0, W, H);
  cards.forEach((card, i) => {
    const x = i * cw + 22, y = 40, w = cw - 44, h = H - 80, r = 36;
    const grd = g.createLinearGradient(x, y, x + w, y + h);
    if (i % 2) { grd.addColorStop(0, '#ff8f5e'); grd.addColorStop(1, '#ee4f1c'); } else { grd.addColorStop(0, '#d9fbf1'); grd.addColorStop(1, '#a9e9dc'); }
    g.fillStyle = grd; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; g.stroke();
    const ink = i % 2 ? '#ffffff' : '#162a3a';
    g.fillStyle = ink; g.globalAlpha = .7; g.font = '600 38px Archivo, Arial, sans-serif'; g.fillText(card.k, x + 34, y + 70); g.globalAlpha = 1;
    g.font = '700 62px Archivo, Arial, sans-serif';
    let size = 62; while (g.measureText(card.t).width > w - 68 && size > 36) { size -= 2; g.font = `700 ${size}px Archivo, Arial, sans-serif`; }
    g.fillText(card.t, x + 34, y + h - 80);
    g.font = '500 30px Archivo, Arial, sans-serif'; g.globalAlpha = .75; g.fillText('Explore  →', x + 34, y + h - 34); g.globalAlpha = 1;
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function ribbonTexture(text: string) {
  const c = document.createElement('canvas'); c.width = 4096; c.height = 160; const g = c.getContext('2d')!;
  g.fillStyle = '#ff6a3d'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#2a0f20'; g.font = '800 96px Archivo, Arial, sans-serif'; g.textBaseline = 'middle';
  let x = 30; const unit = text + '   ✦   ';
  while (x < c.width) { g.fillText(unit, x, 84); x += g.measureText(unit).width; }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
}

export async function cnTower(canvas: HTMLCanvasElement, cards: Card[], reduce: boolean) {
  await document.fonts.ready;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x2a1a4a, 14, 34);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 1.2, 12.5); camera.lookAt(0, 0.6, 0);

  scene.add(new THREE.HemisphereLight(0xcab8ff, 0x2a1440, 1.1));
  const key = new THREE.DirectionalLight(0xfff1e6, 1.6); key.position.set(-5, 6, 8); scene.add(key);
  const rim = new THREE.PointLight(0xff5fb0, 30, 20); rim.position.set(4, 2, -3); scene.add(rim);
  const warm = new THREE.PointLight(0xff8a50, 18, 12); warm.position.set(0, -0.5, 3.5); scene.add(warm);

  const tower = new THREE.Group(); scene.add(tower);
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x9a8cc4, roughness: .55, metalness: .25 });
  const lilac = new THREE.MeshStandardMaterial({ color: 0xc9b8ef, roughness: .4, metalness: .35 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.95, 12, 3, 1), shaftMat); shaft.position.y = -6.3; tower.add(shaft);
  // Pod: stacked discs.
  const podBody = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.25, 1.25, 64), lilac); podBody.position.y = 0.2; tower.add(podBody);
  const podTop = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.7, 0.32, 64), new THREE.MeshStandardMaterial({ color: 0xf2b6e6, roughness: .35, metalness: .3, emissive: 0x6a1d5a, emissiveIntensity: .4 })); podTop.position.y = 1.0; tower.add(podTop);
  const podBot = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.1, 0.42, 64), new THREE.MeshStandardMaterial({ color: 0xff6a3d, roughness: .4, emissive: 0xff4a1a, emissiveIntensity: .35 })); podBot.position.y = -0.62; tower.add(podBot);
  // Upper sky pod + antenna.
  const sky = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.5, 32), lilac); sky.position.y = 3.0; tower.add(sky);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.0, 24), shaftMat); neck.position.y = 1.95; tower.add(neck);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 3.6, 12), new THREE.MeshStandardMaterial({ color: 0xe9e2ff, metalness: .6, roughness: .3 })); antenna.position.y = 5.0; tower.add(antenna);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff3b3b })); beacon.position.y = 6.85; tower.add(beacon);
  // Halo rings in the sky.
  const halo = (r: number, y: number) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 8, 128), new THREE.MeshBasicMaterial({ color: 0xd8c8ff, transparent: true, opacity: .35 })); m.rotation.x = Math.PI / 2; m.position.y = y; tower.add(m); };
  halo(1.4, 5.6); halo(2.4, 5.3);
  // Bulbs around the pod rim.
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 10, 10), new THREE.MeshBasicMaterial({ color: 0xfff1c9 }), 64);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; m4.makeTranslation(Math.cos(a) * 1.62, 1.12, Math.sin(a) * 1.62); bulbs.setMatrixAt(i, m4); }
  tower.add(bulbs);

  // Curved card band (spins) + ribbon below (spins the other way).
  const bandTex = bandTexture(cards);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 1.05, 128, 1, true), new THREE.MeshStandardMaterial({ map: bandTex, transparent: true, side: THREE.DoubleSide, roughness: .45, metalness: .05, emissive: 0xffffff, emissiveMap: bandTex, emissiveIntensity: .25 }));
  band.position.y = 0.22; tower.add(band);
  const ribTex = ribbonTexture('AFNAN MAQSOOD · PRODUCT · BRAND · WEB'); ribTex.repeat.set(2, 1);
  const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(1.86, 1.86, 0.3, 128, 1, true), new THREE.MeshStandardMaterial({ map: ribTex, side: THREE.DoubleSide, emissive: 0xff5a2a, emissiveMap: ribTex, emissiveIntensity: .5 }));
  ribbon.position.y = -0.62; tower.add(ribbon);

  // Moon + stars.
  const starG = new THREE.BufferGeometry(); const pts: number[] = [];
  for (let i = 0; i < 500; i++) pts.push((Math.random() - .5) * 60, Math.random() * 26 - 4, -10 - Math.random() * 20);
  starG.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  scene.add(new THREE.Points(starG, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: .8 })));

  // Interaction.
  let angle = 0, vel = 0, lastY = scrollY, drag: number | null = null, moved = 0, visible = true, raf = 0;
  const onScroll = () => { vel += (scrollY - lastY) * 0.0009; lastY = scrollY; };
  const onDown = (e: PointerEvent) => { drag = e.clientX; moved = 0; canvas.setPointerCapture(e.pointerId); };
  const onMove = (e: PointerEvent) => { if (drag !== null) { const d = e.clientX - drag; moved += Math.abs(d); vel += d * 0.0012; drag = e.clientX; } hover(e); };
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const pick = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera); const hit = ray.intersectObject(band)[0];
    if (!hit || !hit.uv) return null; const i = Math.floor(hit.uv.x * cards.length) % cards.length; return cards[i];
  };
  const hover = (e: PointerEvent) => { canvas.style.cursor = drag !== null ? 'grabbing' : pick(e) ? 'pointer' : 'grab'; };
  const onUp = (e: PointerEvent) => { if (drag !== null && moved < 6) { const c = pick(e); if (c) location.href = c.href; } drag = null; };
  addEventListener('scroll', onScroll, { passive: true });
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp);

  const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();
  const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible && !raf && !reduce) raf = requestAnimationFrame(tick); }); io.observe(canvas);

  const t0 = performance.now();
  function tick(t: number) {
    raf = 0;
    angle += (reduce ? 0 : 0.0016) + vel; vel *= 0.92;
    band.rotation.y = -angle; ribbon.rotation.y = angle * 0.6; ribTex.offset.x = (t - t0) * 0.00002;
    tower.rotation.y = Math.sin((t - t0) * 0.00025) * 0.08;
    bulbs.rotation.y = -angle * .3;
    renderer.render(scene, camera);
    if (visible && !document.hidden) raf = requestAnimationFrame(tick);
  }
  if (reduce) { band.rotation.y = -0.3; renderer.render(scene, camera); } else raf = requestAnimationFrame(tick);
  const onVis = () => { if (!document.hidden && visible && !raf && !reduce) raf = requestAnimationFrame(tick); };
  document.addEventListener('visibilitychange', onVis);

  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener('scroll', onScroll); document.removeEventListener('visibilitychange', onVis);
    renderer.dispose(); bandTex.dispose(); ribTex.dispose();
  };
}
