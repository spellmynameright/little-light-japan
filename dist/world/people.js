// A Little Light — the people of the neighborhood.
// Rounded "clay" figures built from a few merged meshes each: a body (torso, head, hair),
// two arms and two legs, so they can walk, work, wave and bow.
import * as THREE from '../vendor/three.module.js';
import { Kit, shade } from './kit.js';

const SKIN = ['#e3b48f', '#d9a57f', '#c99472', '#e8bf9c'];

// look: { coat, hair, skin, pants, style, glasses, apron, pack, bag, scale, hat }
export function makePerson(look, material) {
  const coat = look.coat || '#6e9275', hair = look.hair || '#3f3129', skin = look.skin || SKIN[0];
  const pants = look.pants || '#5d6670', style = look.style || 'short';
  const root = new THREE.Group();
  const scale = look.scale || 1;
  root.scale.setScalar(scale);

  const body = new THREE.Group();
  root.add(body);
  const b = new Kit();
  // Torso: a soft rounded shape.
  b.add(new THREE.CapsuleGeometry(0.17, 0.2, 4, 10), coat, 0, 0.5, 0, 0, 0, 0, 1, 1, 0.78);
  if (look.apron) b.add(new THREE.CapsuleGeometry(0.15, 0.16, 3, 8), look.apron, 0, 0.47, 0.035, 0, 0, 0, 1, 1, 0.75);
  if (look.pack) {
    b.cbox(0.26, 0.3, 0.12, look.pack, 0, 0.55, -0.16);
    b.cbox(0.16, 0.1, 0.03, shade(look.pack, 0.2), 0, 0.5, -0.225);
  }
  // Neck and head.
  b.cyl(0.06, 0.07, 0.08, skin, 0, 0.72, 0, 8);
  b.ball(0.2, skin, 0, 0.93, 0, 1, 1.02, 0.96, 14);
  // Eyes, cheeks, a hint of a nose.
  for (const x of [-0.07, 0.07]) {
    b.ball(0.022, '#2f2a26', x, 0.95, 0.182, 1, 1.2, 0.6, 6);
    b.ball(0.03, '#e89a8a', x * 1.5, 0.88, 0.16, 1, 0.6, 0.4, 6);
  }
  b.ball(0.022, shade(skin, -0.08), 0, 0.91, 0.195, 1, 1, 1, 6);
  if (look.glasses) for (const x of [-0.072, 0.072]) b.add(new THREE.TorusGeometry(0.045, 0.008, 4, 12), '#5a4a3a', x, 0.95, 0.19);
  // Hair styles.
  if (style === 'short') {
    b.ball(0.21, hair, 0, 1.0, -0.02, 1.0, 0.75, 1.0, 12);
    b.ball(0.12, hair, 0.08, 1.08, 0.1, 1.2, 0.5, 0.8, 8);
  } else if (style === 'bob') {
    b.ball(0.225, hair, 0, 0.98, -0.03, 1.05, 0.85, 1.0, 12);
    for (const x of [-0.16, 0.16]) b.ball(0.1, hair, x, 0.86, -0.02, 0.7, 1.2, 1.0, 8);
  } else if (style === 'bun') {
    b.ball(0.21, hair, 0, 0.99, -0.03, 1.0, 0.78, 1.0, 12);
    b.ball(0.1, hair, 0, 1.12, -0.16, 1, 1, 1, 8);
  } else if (style === 'long') {
    b.ball(0.22, hair, 0, 0.98, -0.03, 1.04, 0.82, 1.0, 12);
    b.add(new THREE.CapsuleGeometry(0.17, 0.25, 3, 10), hair, 0, 0.72, -0.1, 0, 0, 0, 1, 1, 0.5);
  } else if (style === 'grey') {
    b.ball(0.215, hair, 0, 0.99, -0.03, 1.03, 0.78, 1.0, 12);
    for (const x of [-0.17, 0.17]) b.ball(0.07, hair, x, 0.9, -0.02, 0.8, 1, 1, 6);
  } else if (style === 'tousled') {
    b.ball(0.215, hair, 0, 1.0, -0.02, 1.02, 0.78, 1.0, 12);
    for (let i = 0; i < 5; i++) b.ball(0.07, hair, Math.cos(i * 1.3) * 0.13, 1.1 + (i % 2) * 0.03, Math.sin(i * 1.3) * 0.12, 1, 0.8, 1, 6);
  }
  if (look.hat) {
    b.cyl(0.17, 0.2, 0.12, look.hat, 0, 1.06, 0, 12);
    b.cyl(0.27, 0.27, 0.02, look.hat, 0, 1.05, 0.02, 14);
  }
  const bodyMesh = b.build(material);
  body.add(bodyMesh);

  const arms = [-1, 1].map(side => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.2, 0.64, 0);
    const k = new Kit();
    k.add(new THREE.CapsuleGeometry(0.05, 0.2, 3, 8), coat, 0, -0.13, 0);
    k.ball(0.055, skin, 0, -0.27, 0, 1, 1, 1, 8);
    pivot.add(k.build(material));
    body.add(pivot);
    return pivot;
  });
  const legs = [-1, 1].map(side => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.08, 0.34, 0);
    const k = new Kit();
    k.add(new THREE.CapsuleGeometry(0.06, 0.17, 3, 8), pants, 0, -0.16, 0);
    k.cbox(0.11, 0.06, 0.16, '#efe6d2', 0, -0.31, 0.03);
    pivot.add(k.build(material));
    root.add(pivot);
    return pivot;
  });
  // Something carried in the hand (a book, a cup, a bag), swapped per activity.
  const held = new THREE.Group();
  arms[1].add(held);
  held.position.set(0, -0.3, 0.06);

  // A soft blob shadow — far cheaper than real shadows for moving figures.
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.24, 16), shadowMaterial());
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.015;
  root.add(blob);
  root.traverse(o => { if (o.isMesh && o !== blob) o.castShadow = false; });

  return { root, body, arms, legs, held, look, heading: 0, walkT: 0 };
}

let blobMat;
function shadowMaterial() {
  if (!blobMat) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 32);
    g.addColorStop(0, 'rgba(40,40,30,0.38)');
    g.addColorStop(1, 'rgba(40,40,30,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    blobMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false });
  }
  return blobMat;
}

// Things a person can hold.
export function setHeld(p, kind, material) {
  for (const c of [...p.held.children]) { p.held.remove(c); c.geometry?.dispose(); }
  if (!kind) return;
  const k = new Kit();
  if (kind === 'book') { k.cbox(0.2, 0.03, 0.15, '#f1e8cf', 0, 0, 0.04); k.cbox(0.21, 0.02, 0.16, '#7a9aa0', 0, -0.02, 0.04); }
  if (kind === 'bag') { k.cbox(0.18, 0.2, 0.1, '#c6a77a', 0, -0.06, 0); k.ball(0.06, '#8aa86a', 0, 0.06, 0, 1, 1, 1, 6); }
  if (kind === 'cup') k.cyl(0.045, 0.04, 0.08, '#f7efe0', 0, -0.02, 0.03, 8);
  if (kind === 'plate') { k.cyl(0.13, 0.1, 0.03, '#efe4c8', 0, 0, 0.06, 12); k.ball(0.06, '#d9a46a', 0, 0.04, 0.06, 1.3, 0.5, 1, 8); }
  if (kind === 'can') { k.cyl(0.08, 0.07, 0.12, '#6f9a96', 0, -0.06, 0.04, 8); k.cbox(0.16, 0.03, 0.03, '#6f9a96', 0.1, 0.0, 0.04); }
  if (kind === 'card') k.cbox(0.16, 0.12, 0.01, '#f5efe0', 0, 0, 0.06);
  if (kind === 'chair') k.cbox(0.2, 0.2, 0.2, '#b3a37c', 0, -0.05, 0.08);
  const m = k.build(material);
  if (m) { m.castShadow = false; p.held.add(m); }
}

// Poses. `t` is time in seconds; `mode` is one of: idle, walk, work:<kind>, wave, bow.
export function animate(p, t, mode, speed = 1) {
  const [la, ra] = p.arms, [ll, rl] = p.legs;
  let bob = Math.sin(t * 2) * 0.008, lean = 0;
  let a0 = Math.sin(t * 1.4) * 0.04, a1 = -Math.sin(t * 1.4) * 0.04, l0 = 0, l1 = 0, az0 = 0.05, az1 = -0.05;
  if (mode === 'walk') {
    const w = Math.sin(t * 9 * speed);
    l0 = w * 0.6; l1 = -w * 0.6; a0 = -w * 0.5; a1 = w * 0.5;
    bob = Math.abs(Math.cos(t * 9 * speed)) * 0.04;
  } else if (mode === 'wave') {
    a1 = -2.6 + Math.sin(t * 8) * 0.25; az1 = -0.3;
  } else if (mode === 'bow') {
    lean = 0.45 + Math.sin(t * 2) * 0.05;
  } else if (mode.startsWith('work')) {
    const kind = mode.slice(5), s = Math.sin(t * 5 * speed);
    if (kind === 'write') { a1 = -1.1 + s * 0.15; a0 = -0.9; lean = 0.12; }
    else if (kind === 'carry') { a0 = -0.8; a1 = -0.8; bob += Math.abs(s) * 0.01; }
    else if (kind === 'cup') { a1 = -1.2 + Math.max(0, s) * 0.5; a0 = -0.3 + s * 0.2; }
    else if (kind === 'talk') { a0 = -0.6 + s * 0.4; a1 = -0.3 - Math.sin(t * 3.7) * 0.4; bob += Math.abs(s) * 0.008; }
    else if (kind === 'cook') { a1 = -1.2 + Math.sin(t * 7) * 0.2; az1 = Math.cos(t * 7) * 0.2; a0 = -0.7; lean = 0.08; }
    else if (kind === 'read') { a0 = -1.2; a1 = -1.2; lean = 0.08 + Math.sin(t * 0.7) * 0.03; }
    else if (kind === 'water') { lean = 0.3; a1 = -0.9 + s * 0.15; a0 = -0.2; }
    else if (kind === 'arrange') { lean = 0.2 + Math.max(0, s) * 0.15; a0 = -0.9 - s * 0.2; a1 = -0.9 - s * 0.2; }
  }
  la.rotation.x = a0; ra.rotation.x = a1;
  la.rotation.z = -az0; ra.rotation.z = -az1;
  ll.rotation.x = l0; rl.rotation.x = l1;
  p.body.position.y = bob;
  p.body.rotation.x = lean;
}

// Turn smoothly toward a heading (radians, 0 = facing +z).
export function face(p, heading, dt) {
  let d = heading - p.root.rotation.y;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  p.root.rotation.y += d * Math.min(1, dt * 10);
}

// A simple cat. It sits, it washes, it occasionally relocates.
export function makeCat(material) {
  const k = new Kit();
  const fur = '#e8d2b0', dark = '#b8946a';
  k.add(new THREE.CapsuleGeometry(0.08, 0.14, 3, 8), fur, 0, 0.12, 0, Math.PI / 2, 0, 0, 1, 1, 1);
  k.ball(0.075, fur, 0, 0.2, 0.13, 1, 0.95, 1, 10);
  for (const x of [-0.04, 0.04]) k.cone(0.025, 0.05, dark, x, 0.25, 0.13, 6);
  k.add(new THREE.CapsuleGeometry(0.018, 0.16, 2, 6), dark, 0, 0.18, -0.15, -0.9, 0, 0, 1, 1, 1);
  for (const x of [-0.025, 0.025]) k.ball(0.009, '#2f2a26', x, 0.21, 0.2, 1, 1, 1, 4);
  const m = k.build(material);
  m.castShadow = false;
  const g = new THREE.Group();
  g.add(m);
  return g;
}

// A train of two or three carriages, travelling along x.
export function makeTrain(material, colors = ['#eef0e6', '#5f8a6f']) {
  const k = new Kit();
  for (let i = 0; i < 3; i++) {
    const x = i * 2.25;
    k.box(2.1, 0.7, 0.8, colors[0], x, 0.2, 0);
    k.box(2.12, 0.1, 0.82, colors[1], x, 0.45, 0);
    for (let n = 0; n < 4; n++) k.cbox(0.32, 0.26, 0.83, '#8fa7ae', x - 0.7 + n * 0.46, 0.72, 0);
    k.box(2.0, 0.08, 0.7, '#c9cbc4', x, 0.9, 0);
    for (const dx of [-0.75, 0.75]) k.cyl(0.11, 0.11, 0.1, '#5a5f5c', x + dx, 0.12, 0, 10, Math.PI / 2);
  }
  const m = k.build(material);
  m.castShadow = false;
  const g = new THREE.Group();
  g.add(m);
  return g;
}
