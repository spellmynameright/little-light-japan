// A Little Light — the neighborhood: street layout, the eight buildings, and city scenery.
// Each building is split into a `core` (floor, back walls, furniture — always visible)
// and a `shell` (front wall, upper floor, roof — fades away when you look inside).
import * as THREE from '../vendor/three.module.js';
import { Kit, shade, seeded, signMesh } from './kit.js';

// ——— Layout ———
// Two rows of four plots. Every building faces south (toward the camera).
// North row fronts on Lane A; south row fronts on Lane B. Alleys join the lanes.
export const PLOT_X = [-8, -3, 3, 8];
export const NORTH_Z = -3.6, SOUTH_Z = 3.0;
export const LANE_A = -0.3, LANE_B = 6.2;
export const ALLEYS = [-11.2, 0, 11.2];
export const RAIL_Z = -7.1;
export const BOUNDS = { minX: -13.5, maxX: 13.5, minZ: -8.6, maxZ: 10.5 };
export const FRONT = 1.6; // distance from plot centre to the building front

export function plotCenter(i) {
  return new THREE.Vector3(PLOT_X[i % 4], 0, i < 4 ? NORTH_Z : SOUTH_Z);
}
export function laneZ(i) { return i < 4 ? LANE_A : LANE_B; }

// Signs on each building: what it says, and what it means once you can read it.
export const SIGNS = [
  { jp: 'さくら荘', en: 'Sakura House apartments' },
  { jp: 'まるや商店', en: 'Maruya general store' },
  { jp: '喫茶ひだまり', en: 'Café Hidamari — “a sunny spot”' },
  { jp: '公民館', en: 'Community hall' },
  { jp: 'みんなの食堂', en: 'Everyone’s dining room' },
  { jp: 'はる書房', en: 'Haru’s bookshop' },
  { jp: 'みんなの畑', en: 'Everyone’s garden' },
  { jp: 'みんなの家', en: 'Everyone’s house' }
];

// ——— City styles ———
export const STYLES = [
  { // Tokyo, spring
    sky: '#dfe9d6', ground: '#a9bf8f', lane: '#c9c2b2', lane2: '#d8cfba', alley: '#d2c7ae', edge: '#f4f1e6',
    walls: ['#efe6d2', '#e9dcc4', '#f3ede0', '#e2d6c3', '#efe2cf', '#e6dccb', '#d9cdb5', '#e8d9bf'],
    roofs: ['#6f7f8c', '#8a5a44', '#5f6e66', '#7d8c96', '#9a6a4e', '#64737c', '#6f6a5a', '#56616a'],
    wood: '#8e6a4b', tree: 'sakura', water: null, rail: true
  },
  { // Kanazawa, autumn — dark wood, dark tile, the canal
    sky: '#e6e1d3', ground: '#b5ae8c', lane: '#bdb4a2', lane2: '#cdc3ae', alley: '#c6baa2', edge: '#ece6d6',
    walls: ['#e6dac4', '#d9c6a8', '#ebe0cc', '#ddd0b8', '#e1d1b4', '#e7dbc6', '#d3c3a6', '#dccab0'],
    roofs: ['#4c5359', '#45494d', '#525a5e', '#4a4f53', '#4f5559', '#474c50', '#55595c', '#41464a'],
    wood: '#5d4332', tree: 'maple', water: '#7aa3a2', rail: false
  },
  { // Sendai, summer — zelkova shade, Tanabata streamers
    sky: '#d9e8dc', ground: '#8fb27f', lane: '#c4c4b2', lane2: '#d2d1bd', alley: '#cbc7ad', edge: '#f2f2e6',
    walls: ['#f0ebdc', '#e5e0cc', '#f2eee2', '#dfe0cf', '#ece4cc', '#e9e5d4', '#d6d7c2', '#e8dec6'],
    roofs: ['#5e7a74', '#7b6450', '#6b7f86', '#557066', '#866a52', '#5c6f78', '#6d725e', '#4f6460'],
    wood: '#80644a', tree: 'zelkova', water: null, rail: true
  },
  { // Sapporo, winter — snow on everything, colourful roofs
    sky: '#dbe5ec', ground: '#e9eef0', lane: '#cfd6da', lane2: '#dde3e6', alley: '#d8dfe2', edge: '#ffffff',
    walls: ['#ece6dc', '#e3ddd3', '#f0ebe4', '#dcd8d0', '#e8ddd0', '#e6e1d8', '#d5d0c6', '#e2d6c6'],
    roofs: ['#4f6f8a', '#8c4a40', '#5a7a6a', '#3f5f7a', '#9a5a44', '#466a80', '#6a6a5a', '#4a5a70'],
    wood: '#6d5340', tree: 'pine', water: null, rail: true, snow: true
  },
  { // Fukuoka, late summer — the harbor
    sky: '#d8e9e6', ground: '#b4c693', lane: '#cfc6b0', lane2: '#ddd3bb', alley: '#d6caae', edge: '#f6f1e2',
    walls: ['#f4eee2', '#f0e6d2', '#f6f2e8', '#e8e2d2', '#f2e5cf', '#efe9dc', '#e2dac6', '#efe1c8'],
    roofs: ['#a0614a', '#6e7f8a', '#b06f52', '#5f7682', '#9a5d48', '#6a7e86', '#8a7058', '#5a6c76'],
    wood: '#8a6a4c', tree: 'pine', water: '#6fa9b3', rail: false, harbor: true
  }
];

const GLASS = '#a7bfc4', FRAME = '#f3ecdc', DARK = '#3f3a35', SHUTTER = '#aeb1ad';
const CREAM = '#f6efdd', TATAMI = '#cfc48f', FLOOR = '#d8bf98', FLOOR2 = '#c9ab82';

// ——— Shared furniture ———
function table(k, x, z, w = 1.0, d = 0.6, h = 0.62, color = '#b68b5e') {
  k.box(w, 0.07, d, color, x, h, z);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(0.06, h, 0.06, shade(color, -0.25), x + sx * (w / 2 - 0.08), 0, z + sz * (d / 2 - 0.08));
}
function chair(k, x, z, color = '#9fae91', ry = 0) {
  const c = Math.cos(ry), s = Math.sin(ry);
  k.box(0.38, 0.06, 0.38, color, x, 0.38, z, ry);
  k.box(0.38, 0.42, 0.05, color, x - s * 0.17, 0.42, z - c * 0.17, ry);
  for (const [dx, dz] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) k.box(0.04, 0.38, 0.04, shade(color, -0.3), x + dx, 0, z + dz);
}
function stool(k, x, z, color = '#b9a07c') {
  k.cyl(0.17, 0.17, 0.06, color, x, 0.42, z);
  k.cyl(0.03, 0.05, 0.42, shade(color, -0.3), x, 0, z, 6);
}
function cushion(k, x, z, color = '#b9867a') { k.box(0.4, 0.07, 0.4, color, x, 0.12, z); }
function plant(k, x, z, size = 1, pot = '#c08f6a', leaf = '#7f9c62') {
  k.cyl(0.13 * size, 0.1 * size, 0.24 * size, pot, x, 0, z, 8);
  k.ball(0.2 * size, leaf, x, 0.36 * size, z, 1, 1.2, 1, 7);
  k.ball(0.14 * size, shade(leaf, 0.15), x + 0.08 * size, 0.5 * size, z + 0.04 * size, 1, 1.1, 1, 6);
}
function books(k, x, y, z, n, w = 0.8, palette = ['#829c9f', '#c3a56f', '#b48675', '#99a57f', '#a58eb0']) {
  const bw = w / n;
  for (let i = 0; i < n; i++) k.box(bw * 0.85, 0.2 + ((i * 7) % 3) * 0.03, 0.18, palette[i % palette.length], x - w / 2 + bw * (i + 0.5), y, z);
}
function shelf(k, x, z, w = 1.1, h = 1.3, ry = 0, wood = '#a47a53') {
  k.box(w, h, 0.3, wood, x, 0.12, z, ry);
  const rows = Math.floor(h / 0.36);
  for (let r = 0; r < rows; r++) {
    if (ry === 0) books(k, x, 0.2 + r * 0.36, z + 0.06, Math.round(w * 7), w * 0.9);
    else k.box(0.2, 0.24, w * 0.85, ['#829c9f', '#c3a56f', '#b48675'][r % 3], x + 0.06 * Math.sign(Math.sin(ry)), 0.2 + r * 0.36, z);
  }
}
function lamp(k, x, y, z, color = '#f2d9a0') {
  k.cyl(0.005, 0.005, 0.4, '#5c554c', x, y - 0.4, z, 4);
  k.cone(0.14, 0.12, color, x, y - 0.52, z, 10);
}
function bowl(k, x, y, z, color = '#f3ead6') { k.cyl(0.08, 0.05, 0.05, color, x, y, z, 8); }
function cup(k, x, y, z) { k.cyl(0.04, 0.035, 0.07, '#f7f1e2', x, y, z, 8); }

// A window: frame + glass. Glass goes in the glow kit so it can light up at night.
function windowPane(k, glow, x, y, z, w = 0.6, h = 0.55, lattice = false) {
  k.cbox(w + 0.08, h + 0.08, 0.04, FRAME, x, y, z);
  glow.cbox(w, h, 0.05, GLASS, x, y, z + 0.005);
  k.cbox(0.03, h, 0.06, FRAME, x, y, z + 0.01);
  if (lattice) for (let i = 1; i < 4; i++) k.cbox(w, 0.02, 0.06, FRAME, x, y - h / 2 + (h / 4) * i, z + 0.01);
  else k.cbox(w, 0.03, 0.06, FRAME, x, y, z + 0.01);
}
function sideWindow(k, glow, x, y, z, w = 0.6, h = 0.5) {
  k.cbox(0.04, h + 0.08, w + 0.08, FRAME, x, y, z);
  glow.cbox(0.05, h, w, GLASS, x + 0.005, y, z);
}

// The bones of a building. Width w (x), depth d (z), floors of height H.
// Front is at +d/2. Returns heights for the caller to decorate.
function walls(core, shell, glow, sglow, { w, d, floors = 1, wall, wood, cut = 0.42, H = 1.3, frontWindows = 2, sideWindows = 1, lattice = false, plinth = '#b7ad9a' }) {
  const top = floors * H;
  // Plinth and floor.
  core.box(w + 0.1, 0.12, d + 0.1, plinth, 0, 0, 0);
  // Back wall (full height) and side walls (cut low in the core, full in the shell).
  core.box(w, top, 0.12, wall, 0, 0.12, -d / 2 + 0.06);
  for (const sx of [-1, 1]) {
    core.box(0.12, cut, d, wall, sx * (w / 2 - 0.06), 0.12, 0);
    shell.box(0.12, top - cut, d, wall, sx * (w / 2 - 0.06), 0.12 + cut, 0);
    // Corner posts read as Japanese timber framing.
    shell.box(0.1, top, 0.1, wood, sx * (w / 2 - 0.02), 0.12, d / 2 - 0.02);
  }
  // Front wall in the shell.
  shell.box(w, top, 0.12, wall, 0, 0.12, d / 2 - 0.06);
  // Low front kerb in the core so the room still has an edge when opened up.
  core.box(w, cut * 0.5, 0.12, shade(wall, -0.04), 0, 0.12, d / 2 - 0.06);
  // Windows.
  for (let f = 0; f < floors; f++) {
    const y = 0.12 + f * H + H * 0.58;
    for (let n = 0; n < frontWindows; n++) {
      const x = -w / 2 + (w / (frontWindows + 1)) * (n + 1) + (f === 0 ? 0.35 : 0);
      if (f === 0 && Math.abs(x) < 0.5) continue;
      windowPane(shell, sglow, x, y, d / 2 + 0.01, 0.6, 0.52, lattice);
    }
    for (let n = 0; n < sideWindows; n++) sideWindow(shell, sglow, w / 2 + 0.01, y, -d / 4 + n * 0.8);
    if (f > 0) shell.box(w + 0.06, 0.06, 0.16, shade(wall, -0.12), 0, 0.12 + f * H, d / 2 - 0.04);
  }
  // Back-wall windows on the inside, for the cutaway view.
  windowPane(core, glow, -w / 4, 0.12 + H * 0.6, -d / 2 + 0.13, 0.55, 0.45, lattice);
  return { top, H };
}

function door(shell, x, z, color, noren = null) {
  shell.cbox(0.62, 0.98, 0.05, color, x, 0.12 + 0.49, z + 0.02);
  shell.cbox(0.05, 0.98, 0.08, shade(color, -0.25), x, 0.61, z + 0.04);
  if (noren) for (let i = 0; i < 3; i++) shell.cbox(0.2, 0.34, 0.02, noren, x - 0.21 + i * 0.21, 0.92, z + 0.07);
}
function awning(shell, w, y, z, color, stripes = null) {
  const n = Math.round(w / 0.3);
  for (let i = 0; i < n; i++) shell.cbox(w / n, 0.05, 0.6, stripes && i % 2 ? stripes : color, -w / 2 + (w / n) * (i + 0.5), y, z + 0.28, 0, 0.32);
}

// ——— The eight places ———
// Each builder fills core/shell/glow kits and returns { work: [x, z, facing], door: x }.
const PLACES = [
  // 0 · Your apartment: a two-storey block with an outside steel stair.
  function apartment(K, style, level) {
    const { core, shell, glow, sglow } = K, w = 3.6, d = 3.0;
    const wall = style.walls[0];
    walls(core, shell, glow, sglow, { w, d, floors: 2, wall, wood: '#9a9690', frontWindows: 2 });
    // Upstairs walkway and railing, outside stair on the east side.
    shell.box(w + 0.2, 0.08, 0.7, '#9da3a4', 0, 1.42, d / 2 + 0.3);
    for (let i = 0; i <= 8; i++) shell.box(0.03, 0.45, 0.03, '#7f8686', -w / 2 + i * (w / 8), 1.5, d / 2 + 0.62);
    shell.box(w + 0.2, 0.04, 0.04, '#7f8686', 0, 1.94, d / 2 + 0.62);
    for (let i = 0; i < 9; i++) core.box(0.5, 0.06, 0.24, '#9aa1a3', w / 2 + 0.35, 0.12 + i * 0.16, d / 2 - 0.2 - i * 0.24);
    core.box(0.05, 1.5, 0.05, '#7f8686', w / 2 + 0.6, 0.12, d / 2 - 0.2);
    // Upstairs doors and the laundry pole.
    for (const x of [-1, 0.6]) shell.cbox(0.5, 0.85, 0.04, '#b9b2a4', x, 1.97, d / 2 + 0.01);
    shell.cyl(0.015, 0.015, w, '#c9c4b8', 0, 2.25, d / 2 + 0.55, 6, 0, Math.PI / 2);
    door(shell, 0.9, d / 2, '#a59a88');
    shell.box(w + 0.3, 0.12, d + 0.4, shade(style.roofs[0], 0.05), 0, 2.72, 0);
    // Inside: desk under the window, futon, a low table.
    table(core, -0.9, -0.95, 1.1, 0.5, 0.62, '#b48a5f');
    chair(core, -0.9, -0.45, '#8fa3a0', Math.PI);
    books(core, -1.2, 0.69, -1.05, 4, 0.35);
    core.box(0.36, 0.02, 0.26, '#f4efe0', -0.75, 0.69, -0.9);
    core.cyl(0.07, 0.07, 0.03, '#776655', -0.45, 0.69, -1.08);
    core.box(0.03, 0.34, 0.03, '#776655', -0.45, 0.72, -1.08);
    core.cone(0.12, 0.12, '#e9cf91', -0.45, 1.02, -1.08);
    core.box(1.0, 0.12, 0.62, '#efe8d8', 0.95, 0.12, -0.75);
    core.box(0.32, 0.1, 0.5, '#f8f4ea', 0.6, 0.24, -0.75);
    core.box(0.6, 0.04, 0.6, '#9cae8e', 1.1, 0.24, -0.75);
    if (level >= 10) plant(core, 1.45, 0.9, 0.9);
    if (level >= 25) { // a kotatsu
      core.box(0.8, 0.22, 0.8, '#c9a77a', 0.5, 0.12, 0.45);
      core.box(0.95, 0.04, 0.95, '#d8b88b', 0.5, 0.34, 0.45);
      core.ball(0.09, '#e59a4a', 0.45, 0.42, 0.45, 1, 0.9, 1, 8);
    }
    if (level >= 50) shelf(core, 1.6, -0.2, 0.9, 1.1, -Math.PI / 2);
    return { work: [-0.9, -0.38, Math.PI], door: 0.9 };
  },

  // 1 · The corner shop: deep awning, crates out front, living space above.
  function shop(K, style, level, open) {
    const { core, shell, glow, sglow } = K, w = 3.8, d = 3.0;
    const wall = style.walls[1];
    walls(core, shell, glow, sglow, { w, d, floors: 2, wall, wood: style.wood, frontWindows: 0 });
    // The shopfront is open (a big glass front) under the awning.
    sglow.cbox(2.6, 0.75, 0.05, GLASS, -0.3, 0.75, d / 2 + 0.02);
    shell.cbox(2.7, 0.06, 0.07, FRAME, -0.3, 1.14, d / 2 + 0.04);
    door(shell, 1.35, d / 2, '#c4b79c');
    if (open) awning(shell, 3.9, 1.45, d / 2, '#6f9a7a', '#f1ead6');
    else shell.cbox(2.7, 0.9, 0.06, SHUTTER, -0.3, 0.7, d / 2 + 0.06);
    for (let f = 0; f < 2; f++) windowPane(shell, sglow, -1 + f * 1.6, 1.95, d / 2 + 0.01, 0.6, 0.5);
    shell.gable(w, d, 0.8, style.roofs[1], 0, 2.72, 0);
    if (open) {
      // Crates of vegetables on the pavement.
      const produce = ['#c76a4a', '#86a35a', '#e1b45a', '#7b5a8a', '#d98a52'];
      for (let i = 0; i < 4; i++) {
        core.box(0.5, 0.26, 0.4, '#b48a5a', -1.45 + i * 0.55, 0.12, d / 2 + 0.45);
        for (let n = 0; n < 4; n++) core.ball(0.07, produce[(i + n) % 5], -1.6 + i * 0.55 + (n % 2) * 0.16, 0.44, d / 2 + 0.38 + Math.floor(n / 2) * 0.14, 1, 1, 1, 6);
      }
    }
    // Inside: shelves of goods, the counter, a drinks fridge.
    shelf(core, -0.6, -1.25, 2.0, 1.2, 0, '#9c8a6e');
    core.box(1.1, 0.75, 0.5, '#9c7a55', 0.95, 0.12, -0.2);
    core.box(0.3, 0.14, 0.24, '#dad3c2', 1.1, 0.87, -0.2);
    core.box(0.6, 1.3, 0.5, '#e8ecec', -1.5, 0.12, 0.2);
    glow.cbox(0.48, 1.0, 0.04, '#cfe4ea', -1.5, 0.82, 0.47);
    if (level >= 10) plant(core, 1.6, 1.0, 0.8);
    if (level >= 25) for (let i = 0; i < 3; i++) core.box(0.4, 0.35, 0.3, '#c9a77a', -0.8 + i * 0.45, 0.12, 0.45);
    return { work: [0.95, 0.25, Math.PI], door: 1.35 };
  },

  // 2 · Café Hidamari: a wooden kissaten with a big window and hanging lamps.
  function cafe(K, style, level, open) {
    const { core, shell, glow, sglow } = K, w = 3.4, d = 3.0;
    const wall = style.walls[2];
    walls(core, shell, glow, sglow, { w, d, floors: 1, wall, wood: style.wood, frontWindows: 0, H: 1.45 });
    // Dark wood front with a wide window.
    shell.box(w, 1.45, 0.06, style.wood, 0, 0.12, d / 2 + 0.01);
    sglow.cbox(1.7, 0.8, 0.05, GLASS, -0.6, 0.85, d / 2 + 0.05);
    shell.cbox(1.8, 0.06, 0.08, '#d9c39c', -0.6, 0.42, d / 2 + 0.06);
    door(shell, 1.0, d / 2 + 0.03, '#c9a374', open ? '#a65a4a' : null);
    if (!open) shell.cbox(1.75, 0.82, 0.06, SHUTTER, -0.6, 0.85, d / 2 + 0.09);
    shell.hip(w, d, 0.85, style.roofs[2], 0, 1.57, 0);
    // A standing menu board outside.
    if (open) {
      core.box(0.32, 0.5, 0.04, '#5a4a3c', 1.55, 0.12, d / 2 + 0.45, 0, -0.15);
      core.box(0.26, 0.38, 0.05, '#36322e', 1.55, 0.18, d / 2 + 0.46, 0, -0.15);
    }
    // Inside: the counter and coffee machine, two tables, hanging lamps.
    core.box(2.2, 0.85, 0.45, '#7a5a42', -0.4, 0.12, -1.0);
    core.box(2.3, 0.05, 0.55, '#c9a374', -0.4, 0.97, -1.0);
    core.box(0.32, 0.36, 0.3, '#9aa0a2', -1.15, 1.02, -1.05);
    cup(core, -0.6, 1.02, -0.95);
    cup(core, -0.4, 1.02, -0.95);
    for (let i = 0; i < 4; i++) stool(core, -1.2 + i * 0.55, -0.55);
    table(core, 0.4, 0.55, 0.7, 0.6, 0.6);
    chair(core, 0.0, 0.55, '#a46d58', Math.PI / 2);
    chair(core, 0.8, 0.55, '#a46d58', -Math.PI / 2);
    cup(core, 0.3, 0.67, 0.5);
    lamp(core, 0.4, 1.57, 0.55);
    lamp(core, -0.6, 1.57, -0.9);
    if (level >= 10) plant(core, 1.45, -1.05, 1.1);
    if (level >= 25) {
      table(core, -1.0, 0.6, 0.6, 0.6, 0.6);
      chair(core, -1.0, 1.0, '#a46d58', Math.PI);
    }
    if (level >= 50) for (let i = 0; i < 5; i++) core.ball(0.06, '#e8c27a', -1.4 + i * 0.7, 1.45, 1.2, 1, 1, 1, 6);
    return { work: [0.0, -0.45, Math.PI], door: 1.0 };
  },

  // 3 · The community hall: white walls, wide windows, a notice board.
  function hall(K, style, level, open) {
    const { core, shell, glow, sglow } = K, w = 3.8, d = 3.0;
    const wall = style.walls[3];
    walls(core, shell, glow, sglow, { w, d, floors: 1, wall, wood: '#b0a690', frontWindows: 3, H: 1.4 });
    door(shell, 0.0, d / 2, '#9fb0b2');
    shell.box(w + 0.3, 0.1, d + 0.3, '#9aa29c', 0, 1.52, 0);
    shell.box(w - 0.4, 0.22, d - 0.4, shade(style.roofs[3], 0.1), 0, 1.62, 0);
    // Notice board outside.
    core.box(0.05, 0.9, 0.05, '#7d6a52', -1.3, 0.12, d / 2 + 0.5);
    core.box(0.05, 0.9, 0.05, '#7d6a52', -0.6, 0.12, d / 2 + 0.5);
    core.box(0.8, 0.5, 0.05, '#c3a06e', -0.95, 0.5, d / 2 + 0.52);
    if (open) for (let i = 0; i < 4; i++) core.box(0.16, 0.2, 0.06, ['#f6f1e2', '#f2dcc7', '#dce8e6', '#f5e7b8'][i], -1.22 + i * 0.18, 0.62 + (i % 2) * 0.1, d / 2 + 0.53);
    // Inside: a long table, chairs around it, a whiteboard.
    table(core, 0.0, -0.1, 2.0, 0.7, 0.62, '#c8b08a');
    for (const x of [-0.65, 0, 0.65]) {
      chair(core, x, -0.7, '#93a3b8', 0);
      chair(core, x, 0.5, '#93a3b8', Math.PI);
    }
    core.box(1.5, 0.75, 0.04, '#f6f6f2', 0.6, 0.65, -d / 2 + 0.14);
    for (let i = 0; i < 3; i++) core.box(0.9 - i * 0.2, 0.025, 0.01, '#7e8fa8', 0.5, 1.2 - i * 0.12, -d / 2 + 0.17);
    for (let i = 0; i < 3; i++) core.box(0.28, 0.02, 0.2, '#f3eedf', -0.6 + i * 0.6, 0.69, -0.15);
    if (level >= 10) plant(core, 1.55, 1.0, 0.9);
    if (level >= 25) shelf(core, -1.55, -0.6, 0.8, 1.0, Math.PI / 2, '#b7a07a');
    return { work: [0.0, 0.42, 0], door: 0.0 };
  },

  // 4 · Everyone's dining room: a house with a noren and the big shared table.
  function kitchen(K, style, level, open) {
    const { core, shell, glow, sglow } = K, w = 3.8, d = 3.0;
    const wall = style.walls[4];
    walls(core, shell, glow, sglow, { w, d, floors: 1, wall, wood: style.wood, frontWindows: 2, H: 1.4, lattice: true });
    door(shell, 0.0, d / 2, '#b38b62', open ? '#3f5f7a' : null);
    shell.gable(w, d, 0.9, style.roofs[4], 0, 1.52, 0);
    // A chimney for cooking steam.
    shell.box(0.3, 0.6, 0.3, '#a59b8c', 1.2, 1.9, -0.6);
    // Inside: a kitchen along the back wall, the long table, bowls.
    core.box(2.6, 0.8, 0.5, '#a9b6a6', -0.4, 0.12, -1.05);
    core.box(2.65, 0.05, 0.55, '#e3d7bd', -0.4, 0.92, -1.05);
    core.cyl(0.17, 0.15, 0.2, '#5d6a66', 0.3, 0.97, -1.05);
    core.cyl(0.13, 0.13, 0.14, '#c0bba9', -0.5, 0.97, -1.05);
    const seats = level >= 50 ? 4 : level >= 10 ? 3 : 2;
    const len = 0.5 + seats * 0.5;
    table(core, 0.1, 0.35, len, 0.75, 0.6, '#b8915f');
    for (let i = 0; i < seats; i++) {
      const x = 0.1 - len / 2 + 0.5 * (i + 0.5) + 0.25;
      stool(core, x, -0.15, '#a8946a');
      stool(core, x, 0.85, '#a8946a');
      bowl(core, x, 0.67, 0.2);
      bowl(core, x, 0.67, 0.5);
    }
    core.cyl(0.18, 0.14, 0.12, '#d79b5a', 0.1, 0.67, 0.35, 10);
    if (level >= 25) for (let i = 0; i < 3; i++) lamp(core, -0.6 + i * 0.7, 1.5, 0.35, '#f0c98a');
    return { work: [0.3, -0.6, Math.PI], door: 0.0 };
  },

  // 5 · The bookshop and reading room.
  function bookshop(K, style, level, open) {
    const { core, shell, glow, sglow } = K, w = 3.6, d = 3.0;
    const wall = style.walls[5];
    walls(core, shell, glow, sglow, { w, d, floors: 2, wall, wood: style.wood, frontWindows: 2 });
    sglow.cbox(1.6, 0.8, 0.05, GLASS, -0.7, 0.8, d / 2 + 0.03);
    shell.cbox(1.7, 0.06, 0.07, FRAME, -0.7, 1.22, d / 2 + 0.05);
    door(shell, 1.05, d / 2, '#7d8f8a');
    if (!open) shell.cbox(1.65, 0.85, 0.06, SHUTTER, -0.7, 0.8, d / 2 + 0.07);
    shell.hip(w, d, 0.9, style.roofs[5], 0, 2.72, 0);
    if (open) { // a cart of bargain books
      core.box(0.9, 0.45, 0.4, '#8e6a4b', -0.7, 0.12, d / 2 + 0.45);
      books(core, -0.7, 0.57, d / 2 + 0.45, 7, 0.8);
    }
    // Inside: shelves along the walls, a reading sofa, a rug, a little table.
    shelf(core, -0.2, -1.2, 2.6, 1.3, 0, '#8e6a4b');
    shelf(core, -1.55, 0.0, 1.4, 1.1, Math.PI / 2, '#8e6a4b');
    core.box(1.3, 0.02, 1.0, '#b88a7a', 0.4, 0.12, 0.35);
    core.box(1.0, 0.35, 0.45, '#8da696', 0.5, 0.12, 0.85);
    core.box(1.0, 0.35, 0.12, '#8da696', 0.5, 0.42, 1.04);
    table(core, 0.45, 0.2, 0.6, 0.4, 0.36, '#c9a77a');
    if (level >= 10) for (let i = 0; i < 3; i++) cushion(core, -0.5 + i * 0.45, 0.6, ['#d6a75a', '#9cb3a7', '#c9877a'][i]);
    if (level >= 25) lamp(core, 0.5, 1.4, 0.3);
    if (level >= 50) shelf(core, 1.55, -0.3, 1.0, 1.0, -Math.PI / 2, '#8e6a4b');
    return { work: [0.0, -0.6, Math.PI], door: 1.05 };
  },

  // 6 · The community garden: raised beds, a shed, a water butt. No roof to lift.
  function garden(K, style, level, open) {
    const { core, shell } = K, w = 4.2, d = 3.6;
    const soil = '#6e5a46';
    core.box(w, 0.08, d, open ? '#8fae76' : '#9aa77a', 0, 0, 0);
    // Low bamboo fence.
    for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) core.box(0.05, 0.4, 0.05, '#c9b27a', sx * w / 2, 0.08, -d / 2 + i * (d / 8));
    for (let i = 0; i < 11; i++) if (Math.abs(-w / 2 + i * (w / 10)) > 0.4) core.box(0.05, 0.4, 0.05, '#c9b27a', -w / 2 + i * (w / 10), 0.08, d / 2);
    for (const sx of [-1, 1]) core.box(0.03, 0.03, d, '#b39a64', sx * w / 2, 0.38, 0);
    if (!open) {
      const r = seeded(6);
      for (let i = 0; i < 40; i++) core.ball(0.12 + r() * 0.1, ['#7f9a5c', '#94a868', '#6f8a52'][i % 3], -w / 2 + 0.3 + r() * (w - 0.6), 0.15, -d / 2 + 0.3 + r() * (d - 0.6), 1, 0.8, 1, 5);
      core.box(0.05, 0.5, 0.05, '#8a7a5a', 0, 0.08, d / 2 + 0.05);
      return { work: [0, 0, Math.PI], door: 0 };
    }
    const grow = Math.min(1, 0.35 + level / 60);
    const crops = ['#c45a42', '#e1b24a', '#7aa04a', '#a2557a'];
    const rows = level >= 50 ? 4 : 3;
    for (let k = 0; k < rows; k++) {
      const z = -1.25 + k * (2.4 / (rows - 1));
      core.box(2.8, 0.2, 0.5, '#9a7550', -0.3, 0.08, z);
      core.box(2.65, 0.04, 0.4, soil, -0.3, 0.28, z);
      for (let n = 0; n < 7; n++) {
        const x = -1.45 + n * 0.38;
        core.ball(0.09 * grow + 0.04, '#7ea35c', x, 0.34 + 0.08 * grow, z, 1, 1.3, 1, 6);
        if (level >= 10) core.ball(0.045, crops[k % 4], x + 0.04, 0.4 + 0.1 * grow, z + 0.06, 1, 1, 1, 5);
      }
    }
    // The shed and the water barrel.
    core.box(0.9, 1.0, 0.8, '#a58a66', 1.45, 0.08, -1.2);
    shell.gable(0.9, 0.8, 0.35, style.roofs[6], 1.45, 1.08, -1.2, Math.PI / 2, 0.1);
    core.cyl(0.2, 0.2, 0.5, '#5f7a8a', 1.6, 0.08, 0.2, 10);
    if (level >= 25) { // a scarecrow
      core.box(0.04, 0.9, 0.04, '#8a6a46', 1.3, 0.08, 1.1);
      core.box(0.5, 0.04, 0.04, '#8a6a46', 1.3, 0.75, 1.1);
      core.ball(0.11, '#e6d2a8', 1.3, 1.05, 1.1);
      core.cone(0.2, 0.12, '#c9a35a', 1.3, 1.12, 1.1, 10);
      core.box(0.26, 0.3, 0.1, '#7a8fa8', 1.3, 0.55, 1.1);
    }
    return { work: [-0.3, 0.75, Math.PI], door: 0 };
  },

  // 7 · Everyone's house: an old wooden house with a tiled roof and a veranda.
  function house(K, style, level, open) {
    const { core, shell, glow, sglow } = K, w = 3.9, d = 3.0;
    const wall = style.walls[7];
    walls(core, shell, glow, sglow, { w, d, floors: 1, wall, wood: style.wood, frontWindows: 0, sideWindows: 1, H: 1.4, plinth: '#9e927c' });
    // Sliding shoji front (glows warmly at night) or closed shutters.
    if (open) {
      for (let i = 0; i < 4; i++) {
        sglow.cbox(0.7, 0.9, 0.05, '#efe6cc', -1.3 + i * 0.8, 0.62, d / 2 + 0.02);
        for (let r = 0; r < 4; r++) shell.cbox(0.7, 0.02, 0.06, style.wood, -1.3 + i * 0.8, 0.22 + r * 0.27, d / 2 + 0.04);
        shell.cbox(0.03, 0.9, 0.07, style.wood, -1.3 + i * 0.8, 0.62, d / 2 + 0.04);
      }
    } else for (let i = 0; i < 4; i++) shell.cbox(0.78, 0.95, 0.06, '#8a7a64', -1.3 + i * 0.8, 0.6, d / 2 + 0.03);
    // The engawa veranda.
    core.box(w, 0.08, 0.5, '#b38f66', 0, 0.22, d / 2 + 0.25);
    shell.hip(w, d, 0.95, style.roofs[7], 0, 1.52, 0, 0.42);
    if (open) { // a paper lantern by the door
      core.box(0.04, 1.2, 0.04, '#5d4a3a', 1.85, 0.12, d / 2 + 0.45);
      glow.add(new THREE.SphereGeometry(0.13, 10, 8), '#f6e2b4', 1.85, 1.2, d / 2 + 0.45, 0, 0, 0, 1, 1.3, 1);
    }
    // Inside: tatami, cushions in a circle around low tables, a simple wooden cross.
    core.box(w - 0.3, 0.03, d - 0.3, TATAMI, 0, 0.12, 0);
    for (let i = 0; i < 3; i++) core.box(0.02, 0.005, d - 0.3, '#b9ad78', -1.2 + i * 1.2, 0.15, 0);
    core.box(1.2, 0.25, 0.6, '#9a7552', 0, 0.12, 0.1);
    const ring = level >= 25 ? 8 : 6;
    for (let i = 0; i < ring; i++) {
      const a = (i / ring) * Math.PI * 2;
      cushion(core, Math.cos(a) * 1.0, 0.1 + Math.sin(a) * 0.75, ['#b9867a', '#8fa48a', '#c9a35a', '#8a93b0'][i % 4]);
    }
    cup(core, -0.2, 0.37, 0.1);
    cup(core, 0.2, 0.37, 0.05);
    if (level >= 10) {
      core.box(0.06, 0.55, 0.04, '#7a5a3e', 0.9, 0.85, -d / 2 + 0.14);
      core.box(0.32, 0.06, 0.04, '#7a5a3e', 0.9, 1.22, -d / 2 + 0.14);
      plant(core, -1.5, -1.1, 0.9, '#9a8a7a', '#9ab07a');
    }
    if (level >= 25) { // a small keyboard
      core.box(0.8, 0.08, 0.3, '#3d3a37', -1.0, 0.62, -1.1);
      core.box(0.75, 0.02, 0.12, '#f4f1ea', -1.0, 0.7, -1.04);
      table(core, -1.0, -1.1, 0.85, 0.32, 0.6, '#7a6a5a');
    }
    return { work: [0.0, 0.9, Math.PI], door: 0.0 };
  }
];

// Decorations that appear outside as a place grows.
function outdoorProps(k, glow, i, level, style, rnd) {
  const front = 1.75, side = i === 6 ? 2.25 : 1.95;
  if (level >= 10) {
    plant(k, -side + 0.1, front, 0.9, '#b98a66', style.tree === 'maple' ? '#9a8a52' : '#7f9c62');
    if (i !== 6) { // a bench
      k.box(0.9, 0.05, 0.3, '#a07d58', side - 0.6, 0.32, front + 0.15);
      for (const dx of [-0.35, 0.35]) k.box(0.05, 0.32, 0.25, '#7a5d42', side - 0.6 + dx, 0, front + 0.15);
    }
  }
  if (level >= 25) { // a red paper lantern or a banner flag
    if (i % 2) {
      k.box(0.03, 1.3, 0.03, '#8a8a8a', -side + 0.5, 0, front + 0.2);
      k.box(0.24, 0.8, 0.02, ['#d8a04a', '#5f8a7a', '#c96a52', '#6a7aa8'][i % 4], -side + 0.38, 0.45, front + 0.2);
    } else {
      k.box(0.03, 0.15, 0.03, '#3d3a37', -side + 0.45, 1.25, front - 0.15);
      glow.add(new THREE.SphereGeometry(0.11, 10, 8), '#e98a6a', -side + 0.45, 1.12, front - 0.15, 0, 0, 0, 1, 1.3, 1);
    }
    // A bicycle.
    const bx = side - 0.2, bz = front + 0.55;
    for (const dx of [-0.25, 0.25]) k.add(new THREE.TorusGeometry(0.16, 0.025, 6, 14), '#3d4446', bx + dx, 0.18, bz, 0, Math.PI / 2 + 0.3);
    k.cbox(0.55, 0.03, 0.03, ['#4f7a9a', '#b85a4a', '#5a8a5a'][i % 3], bx, 0.32, bz + 0.08, -0.3);
  }
  if (level >= 50) { // string lights along the front
    for (let n = 0; n < 7; n++) glow.add(new THREE.SphereGeometry(0.045, 6, 5), '#ffe0a0', -side + 0.2 + n * (side * 2 - 0.4) / 6, 1.55 - Math.sin((n / 6) * Math.PI) * 0.15, front - 0.05);
  }
  if (level >= 100) { // a young tree, planted together
    k.cyl(0.05, 0.07, 0.8, '#8a6a4a', side - 0.1, 0, front - 0.6, 6);
    k.ball(0.38, style.tree === 'sakura' ? '#e8b8b0' : '#88a86a', side - 0.1, 1.05, front - 0.6, 1, 1.1, 1, 8);
  }
}

// Builds one place as a THREE.Group positioned on its plot.
export function buildPlace(i, level, city, materials) {
  const style = STYLES[city];
  const K = { core: new Kit(), shell: new Kit(), glow: new Kit(), sglow: new Kit() };
  const open = level > 0;
  const info = PLACES[i](K, style, level, open);
  const rnd = seeded(i * 31 + city * 7);
  if (open) outdoorProps(K.core, K.glow, i, level, style, rnd);
  if (style.snow) snowCaps(K.shell, i);
  const g = new THREE.Group();
  const c = plotCenter(i);
  g.position.copy(c);
  const core = K.core.build(materials.solid);
  const shellMat = materials.solid.clone();
  shellMat.userData.fade = true;
  const shell = K.shell.build(shellMat);
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const glow = K.glow.build(glowMat);
  if (core) g.add(core);
  if (shell) { shell.userData.shell = true; g.add(shell); }
  if (glow) { glow.userData.glow = true; glow.castShadow = false; g.add(glow); }
  // Windows set in the front walls light up too, and fade away with the walls.
  const sglow = K.sglow.build(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, transparent: true }));
  if (sglow) { sglow.userData.glow = true; sglow.userData.shellGlow = true; sglow.castShadow = false; g.add(sglow); }
  // The building's sign.
  const sign = SIGNS[i];
  if (i === 6) {
    const s = signMesh(sign.jp, 1.1, 0.32, { bg: '#efe2c0', fg: '#4a3b2c', border: '#8a6a4a' });
    s.position.set(-0.9, 0.62, 1.84);
    const post = new Kit().box(0.06, 0.62, 0.04, '#7d6a52', -0.9, 0.08, 1.8).build(materials.solid);
    g.add(post, s);
  } else {
    const vertical = i === 1 || i === 5 || i === 7;
    const s = vertical
      ? signMesh(sign.jp, 0.3, 0.3 * [...sign.jp].length + 0.12, { vertical: true, bg: i === 7 ? '#f2ead6' : '#3f4a46', fg: i === 7 ? '#3d3329' : '#f4ead2', border: null })
      : signMesh(sign.jp, Math.min(2.2, 0.32 * [...sign.jp].length + 0.3), 0.36, { bg: i === 2 ? '#3f3329' : '#f4ead2', fg: i === 2 ? '#f2d9a0' : '#3d3329', border: i === 2 ? '#c9a374' : '#8a6a4a' });
    const h = signHeight(i);
    s.position.set(vertical ? -1.62 : 0, vertical ? h : h, 1.62);
    if (i === 7) s.position.set(-1.9, 0.9, 1.75);
    g.add(s);
    if (i === 7 && level >= 25) {
      const notice = signMesh('日曜礼拝 10:30', 0.9, 0.22, { bg: '#f7f1e2', fg: '#5a4a3a', border: '#a08060' });
      notice.position.set(1.35, 0.45, 2.02);
      g.add(notice);
    }
    if (!open && i !== 7) {
      const closed = signMesh('準備中', 0.6, 0.2, { bg: '#f2ecdc', fg: '#8a4a3a', border: '#8a4a3a' });
      closed.position.set(0.2, 0.7, 1.68);
      g.add(closed);
    }
  }
  const front = i === 6 ? 1.8 : 1.5;
  g.userData = {
    place: i,
    work: new THREE.Vector3(c.x + info.work[0], 0.12, c.z + info.work[1]),
    facing: info.work[2],
    door: new THREE.Vector3(c.x + info.door, 0, c.z + front + 0.35),
    label: new THREE.Vector3(c.x, i === 0 || i === 1 || i === 5 ? 3.2 : 2.3, c.z + 0.6)
  };
  g.traverse(o => { if (o.isMesh) o.userData.place = i; });
  return g;
}
function signHeight(i) { return [2.35, 1.95, 1.3, 1.3, 1.3, 2.0, 0.6, 0.9][i]; }

function snowCaps(shell, i) {
  if (i === 6) return;
  const two = i === 0 || i === 1 || i === 5;
  shell.box(3.7, 0.14, 2.9, '#fbfdfd', 0, (two ? 2.84 : 1.64) + (i === 3 ? 0.2 : 0.25), 0);
}

// ——— The street and its scenery ———
export function buildEnvironment(city, materials) {
  const style = STYLES[city];
  const k = new Kit(), glow = new Kit(), rnd = seeded(100 + city);
  const g = new THREE.Group();
  const W = BOUNDS.maxX - BOUNDS.minX, D = BOUNDS.maxZ - BOUNDS.minZ;
  const cx = (BOUNDS.maxX + BOUNDS.minX) / 2, cz = (BOUNDS.maxZ + BOUNDS.minZ) / 2;
  // Ground slab with a soft earth edge.
  k.box(W, 0.5, D, shade(style.ground, -0.25), cx, -0.52, cz);
  k.box(W, 0.02, D, style.ground, cx, -0.02, cz);
  // Lanes with white edge lines, like Japanese residential streets.
  for (const z of [LANE_A, LANE_B]) {
    k.box(W, 0.02, 2.0, z === LANE_A ? style.lane : style.lane2, cx, 0, z);
    for (const e of [-0.85, 0.85]) k.box(W, 0.005, 0.06, style.edge, cx, 0.02, z + e);
  }
  // Alleys joining the lanes; 止まれ painted where the small street meets the lane.
  for (const x of ALLEYS) k.box(1.4, 0.015, LANE_B - LANE_A, style.alley, x, 0.005, (LANE_A + LANE_B) / 2);
  // Plot yards: paving in front of each building.
  for (let i = 0; i < 8; i++) {
    const c = plotCenter(i);
    k.box(4.4, 0.03, 0.9, shade(style.lane2, 0.06), c.x, 0.005, c.z + 1.95);
  }
  // Hedges behind the south row (between lane A and the backs of the south buildings).
  for (const x of PLOT_X) for (let n = 0; n < 6; n++) k.ball(0.32, shade(style.tree === 'pine' && style.snow ? '#7a9a86' : '#6f9a5c', (n % 2) * 0.06), x - 1.8 + n * 0.72, 0.25, 1.05, 1, 0.8, 0.8, 7);
  if (style.snow) for (const x of PLOT_X) k.box(4.2, 0.16, 0.5, '#f8fbfb', x, 0.3, 1.05);

  // The railway behind the north row (most cities), with a fence.
  if (style.rail) {
    k.box(W, 0.12, 1.4, '#b7b49f', cx, 0, RAIL_Z);
    for (let n = 0; n < 54; n++) k.box(0.12, 0.04, 1.0, '#7c7064', BOUNDS.minX + 0.3 + n * 0.5, 0.12, RAIL_Z);
    for (const dz of [-0.33, 0.33]) k.box(W, 0.06, 0.05, '#8a9090', cx, 0.16, RAIL_Z + dz);
    for (let n = 0; n < 28; n++) k.box(0.04, 0.6, 0.04, '#9aa0a0', BOUNDS.minX + 0.4 + n * 1.0, 0, RAIL_Z + 0.9);
    k.box(W, 0.03, 0.03, '#9aa0a0', cx, 0.55, RAIL_Z + 0.9);
  } else if (style.water) {
    // Canal (Kanazawa) or harbor (Fukuoka) at the back, with a stone edge.
    k.box(W, 0.1, 1.8, style.water, cx, -0.06, RAIL_Z);
    k.box(W, 0.16, 0.2, '#a49a86', cx, 0, RAIL_Z + 1.0);
    k.box(W, 0.16, 0.2, '#a49a86', cx, 0, RAIL_Z - 1.0);
  }
  // South edge: a riverside walk with water (Kanazawa canal), a harbor (Fukuoka), or a park.
  const southZ = (LANE_B + 1.0 + BOUNDS.maxZ) / 2;
  if (style.water) {
    k.box(W, 0.1, BOUNDS.maxZ - LANE_B - 1.6, style.water, cx, -0.07, southZ + 0.3);
    k.box(W, 0.2, 0.22, '#a49a86', cx, -0.02, LANE_B + 1.2);
    if (style.harbor) { // moored boats and a jetty
      k.box(3.0, 0.12, 0.8, '#8a6a4a', 6, 0.0, LANE_B + 2.3);
      for (const x of [-6, 1]) {
        k.box(1.8, 0.3, 0.7, '#f2eee4', x, -0.05, LANE_B + 2.8);
        k.box(0.8, 0.3, 0.5, '#5f7a9a', x - 0.2, 0.25, LANE_B + 2.8);
      }
    } else for (const x of [-5, 4]) { // stone bridges
      k.box(1.4, 0.18, 3.2, '#a8a08c', x, 0.02, southZ + 0.2);
      for (const dx of [-0.62, 0.62]) k.box(0.1, 0.35, 3.2, '#8f8774', x + dx, 0.2, southZ + 0.2);
    }
  } else {
    k.box(W, 0.03, BOUNDS.maxZ - LANE_B - 1.2, shade(style.ground, 0.06), cx, 0, southZ + 0.1);
    for (let n = 0; n < 9; n++) k.box(1.0, 0.04, 0.5, '#d9d0bc', -10 + n * 2.5, 0.02, LANE_B + 2.6 + (n % 2) * 0.3);
  }

  // Trees along the edges, styled per city and season.
  const trees = [[-12.6, -4.5], [-12.6, 3.0], [12.6, -4.5], [12.6, 3.0], [-6, 9.0], [0, 9.3], [6.5, 9.0], [-10.5, 9.4], [10.5, 9.4]];
  for (const [x, z] of trees) if (!(style.water && z > 8)) tree(k, x, z, style.tree, rnd, style.snow);

  // Utility poles and their wires along lane A — the sound of a Japanese street.
  const poles = [-12.2, -5.5, 0.9, 5.5, 12.2];
  for (const x of poles) {
    k.cyl(0.07, 0.09, 3.6, '#a8a49a', x, 0, LANE_A - 1.05, 8);
    k.box(0.9, 0.06, 0.06, '#8a867e', x, 3.3, LANE_A - 1.05);
    k.cyl(0.12, 0.12, 0.3, '#7d8a86', x + 0.2, 2.9, LANE_A - 0.95, 8);
  }
  // Street lamps.
  for (const [x, z] of [[-9.6, LANE_A + 0.95], [4.2, LANE_A + 0.95], [-4.2, LANE_B + 1.0], [9.6, LANE_B + 1.0]]) {
    k.cyl(0.04, 0.05, 2.2, '#6f7a78', x, 0, z, 6);
    k.box(0.4, 0.06, 0.12, '#6f7a78', x - 0.15, 2.2, z);
    glow.cbox(0.25, 0.06, 0.12, '#fff1c8', x - 0.25, 2.17, z);
  }
  // A vending machine outside the apartment, a rubbish station, a postbox.
  k.box(0.6, 1.2, 0.45, '#e9ecec', -10.6, 0, LANE_A - 1.0);
  glow.cbox(0.48, 0.55, 0.03, '#cfe6f0', -10.6, 0.9, LANE_A - 0.76);
  for (let n = 0; n < 6; n++) k.box(0.06, 0.12, 0.02, ['#d65a4a', '#4a8ad6', '#f2c34a', '#5aa86a', '#e8e8e8', '#a85a9a'][n], -10.78 + (n % 3) * 0.18, 0.72 + Math.floor(n / 3) * 0.16, LANE_A - 0.76);
  k.box(1.1, 0.5, 0.6, '#7d9a8a', -6.1, 0, LANE_A - 1.05);
  k.box(1.12, 0.04, 0.62, '#5d7a6a', -6.1, 0.5, LANE_A - 1.05);
  k.cyl(0.18, 0.18, 0.9, '#c84a3a', 5.4, 0, LANE_B + 1.0, 10);
  k.cyl(0.21, 0.21, 0.08, '#a83a2a', 5.4, 0.9, LANE_B + 1.0, 10);

  // City landmarks.
  if (city === 0) station(k, glow, style, g, materials);
  if (city === 2) tanabata(k);
  if (city === 3) snowScene(k, rnd);
  if (city === 4) yatai(k, glow);
  if (city === 1) for (let n = 0; n < 6; n++) { // stone lanterns along the canal
    const x = -11 + n * 4.4;
    k.box(0.3, 0.5, 0.3, '#9a9488', x, 0, LANE_B + 1.05);
    k.box(0.45, 0.08, 0.45, '#8a8478', x, 0.5, LANE_B + 1.05);
    glow.cbox(0.18, 0.12, 0.18, '#f6d9a0', x, 0.64, LANE_B + 1.05);
    k.box(0.5, 0.1, 0.5, '#7a7468', x, 0.72, LANE_B + 1.05);
  }

  const mesh = k.build(materials.solid);
  mesh.castShadow = false;
  g.add(mesh);
  const glowMesh = glow.build(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
  if (glowMesh) { glowMesh.userData.glow = true; glowMesh.castShadow = false; g.add(glowMesh); }
  // Wires between the poles: gentle sagging lines.
  const wireMat = new THREE.LineBasicMaterial({ color: '#4c4f4f', transparent: true, opacity: 0.55 });
  for (const h of [3.25, 3.05, 2.85]) {
    const pts = [];
    for (let p = 0; p < poles.length - 1; p++) for (let t = 0; t <= 10; t++) {
      const x = poles[p] + (poles[p + 1] - poles[p]) * (t / 10);
      pts.push(new THREE.Vector3(x, h - Math.sin((t / 10) * Math.PI) * 0.22, LANE_A - 1.05 + (h - 3.05) * 0.8));
    }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat));
  }
  // A painted 止まれ ("stop") on the alley where it meets lane B.
  const tomare = signMesh('止まれ', 1.0, 0.4, { bg: style.alley, fg: '#f7f5ee', border: null });
  tomare.rotation.x = -Math.PI / 2;
  tomare.position.set(0, 0.03, LANE_B - 1.25);
  g.add(tomare);
  return g;
}

function tree(k, x, z, kind, rnd, snow) {
  const s = 0.85 + rnd() * 0.35;
  if (kind === 'pine') {
    k.cyl(0.1 * s, 0.14 * s, 1.0 * s, '#7a5f46', x, 0, z, 6);
    for (let i = 0; i < 3; i++) k.cone((0.85 - i * 0.2) * s, 0.9 * s, snow ? ['#5f7d6a', '#6a8a72', '#76967c'][i] : ['#4f7a52', '#5a8a5a', '#669a62'][i], x, (0.7 + i * 0.55) * s, z, 9);
    if (snow) k.cone(0.35 * s, 0.4 * s, '#f6fafa', x, 2.0 * s, z, 9);
    return;
  }
  const leaves = {
    sakura: ['#efc2bb', '#f5d2c9', '#e7b2aa'],
    maple: ['#d77a42', '#e39a4a', '#c45a3a'],
    zelkova: ['#5f8f54', '#6f9f5c', '#7aa864']
  }[kind];
  k.cyl(0.11 * s, 0.15 * s, 1.5 * s, '#7d6249', x, 0, z, 7);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.1 + rnd();
    k.ball((0.55 + rnd() * 0.2) * s, leaves[i % 3], x + Math.cos(a) * 0.5 * s, (1.7 + rnd() * 0.5) * s, z + Math.sin(a) * 0.45 * s, 1, 0.85, 1, 8);
  }
}

function station(k, glow, style, group, materials) {
  // A small local station at the east end of the line: platform, shelter, sign.
  const x = 10.4, z = RAIL_Z - 1.05;
  k.box(5.0, 0.35, 0.8, '#c9c2b0', x - 1.2, 0, z);
  k.box(0.08, 1.2, 0.08, '#8a8a84', x - 2.6, 0.35, z);
  k.box(0.08, 1.2, 0.08, '#8a8a84', x + 0.2, 0.35, z);
  k.box(3.2, 0.08, 0.9, '#b8584a', x - 1.2, 1.55, z);
  const sign = signMesh('花見町駅', 1.3, 0.3, { bg: '#f7f7f2', fg: '#2f3a44', border: '#3f6a8a' });
  sign.position.set(x - 1.2, 1.2, z + 0.42);
  group.add(sign);
}
function tanabata(k) {
  // Bamboo poles hung with paper streamers along lane A.
  const colors = ['#e46a6a', '#f2c34a', '#5aa0d6', '#7ac07a', '#c47ad0'];
  for (const x of [-10.2, -5.5, 0, 5.5, 10.2]) {
    k.cyl(0.04, 0.05, 3.4, '#8aa85a', x + 0.4, 0, LANE_A + 1.0, 6);
    for (let n = 0; n < 5; n++) k.box(0.06, 0.9, 0.06, colors[n], x + 0.4 + Math.cos(n * 1.3) * 0.3, 2.2 - (n % 2) * 0.2, LANE_A + 1.0 + Math.sin(n * 1.3) * 0.3);
    k.ball(0.18, '#f6e2b4', x + 0.4, 3.0, LANE_A + 1.0, 1, 1.2, 1, 8);
  }
}
function snowScene(k, rnd) {
  // Snow banks along the lanes and a snowman.
  for (const z of [LANE_A - 1.2, LANE_B + 1.25]) for (let n = 0; n < 16; n++) k.ball(0.35 + rnd() * 0.2, '#f7fafb', -12.5 + n * 1.65, 0.05, z, 1.5, 0.45, 1, 7);
  k.ball(0.38, '#fbfcfc', 11.4, 0.36, LANE_B + 2.2);
  k.ball(0.26, '#fbfcfc', 11.4, 0.88, LANE_B + 2.2);
  k.ball(0.04, '#e0703a', 11.4, 0.88, LANE_B + 2.46, 2.2, 1, 1, 6);
  k.cyl(0.18, 0.2, 0.18, '#c44a3a', 11.4, 1.08, LANE_B + 2.2, 10);
}
function yatai(k, glow) {
  // Food stalls by the water, glowing in the evening.
  for (const x of [-8, -2.5, 3.5]) {
    k.box(1.4, 0.9, 0.7, '#8a5a3a', x, 0, LANE_B + 1.75);
    k.box(1.6, 0.06, 0.9, '#b48a5a', x, 0.9, LANE_B + 1.75);
    for (const dx of [-0.7, 0.7]) k.box(0.05, 0.7, 0.05, '#6a4a32', x + dx, 0.96, LANE_B + 1.4);
    k.box(1.7, 0.05, 1.0, '#c43a2a', x, 1.66, LANE_B + 1.75);
    for (let n = 0; n < 3; n++) glow.add(new THREE.SphereGeometry(0.1, 8, 6), '#f05a3a', x - 0.5 + n * 0.5, 1.5, LANE_B + 1.32, 0, 0, 0, 1, 1.3, 1);
    for (let n = 0; n < 3; n++) { k.cyl(0.14, 0.14, 0.05, '#c9a37a', x - 0.45 + n * 0.45, 0.5, LANE_B + 2.4, 8); k.box(0.04, 0.5, 0.04, '#6a4a32', x - 0.45 + n * 0.45, 0, LANE_B + 2.4); }
  }
}

// Community project landmarks: a notice board, shared tables, lanterns across the lane.
export function buildLandmarks(city, projects, materials) {
  const k = new Kit(), glow = new Kit();
  const g = new THREE.Group();
  if (projects >= 1) { // the welcome board at the centre alley
    k.box(0.06, 1.3, 0.06, '#6f5a44', -0.6, 0, LANE_A + 1.05);
    k.box(0.06, 1.3, 0.06, '#6f5a44', 0.6, 0, LANE_A + 1.05);
    k.box(1.4, 0.7, 0.06, '#b48a5a', 0, 0.6, LANE_A + 1.06);
    for (let i = 0; i < 5; i++) k.box(0.22, 0.26, 0.04, ['#f6f1e2', '#f2dcc7', '#dce8e6', '#f5e7b8', '#e8dcef'][i], -0.48 + i * 0.24, 0.78 + (i % 2) * 0.12, LANE_A + 1.1);
    k.gable(1.5, 0.3, 0.2, '#6a5a4a', 0, 1.3, LANE_A + 1.06, 0, 0.08);
    const s = signMesh('ようこそ', 0.7, 0.16, { bg: '#f7f1e2', fg: '#5a4a3a', border: null });
    s.position.set(0, 0.68, LANE_A + 1.14);
    g.add(s);
  }
  if (projects >= 2) { // shared tables and parasols on the south walk
    for (const x of [-9.2, 9.2]) {
      table(k, x, LANE_B + 2.3, 1.0, 0.7, 0.6, '#b8915f');
      for (const dz of [-0.55, 0.55]) stool(k, x, LANE_B + 2.3 + dz, '#a8946a');
      k.cyl(0.02, 0.02, 1.6, '#8a8a84', x, 0.6, LANE_B + 2.3, 6);
      k.cone(0.85, 0.3, ['#d97a5a', '#6f9a7a'][x > 0 ? 1 : 0], x, 2.0, LANE_B + 2.3, 12);
    }
  }
  if (projects >= 3) { // lanterns strung across lane A
    for (let n = 0; n < 23; n++) {
      const x = -11 + n;
      glow.add(new THREE.SphereGeometry(0.1, 8, 6), ['#f2a65a', '#f6d38a', '#e8786a'][n % 3], x, 2.55 - Math.sin(((n % 6) / 5) * Math.PI) * 0.12, LANE_A + 0.4, 0, 0, 0, 1, 1.25, 1);
    }
  }
  const mesh = k.build(materials.solid);
  if (mesh) g.add(mesh);
  const glowMesh = glow.build(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
  if (glowMesh) { glowMesh.userData.glow = true; glowMesh.castShadow = false; g.add(glowMesh); }
  return g;
}
