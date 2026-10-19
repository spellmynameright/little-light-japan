// A Little Light — the living neighborhood (Three.js).
// Reads game state through window.GameBridge every frame and never changes it directly:
// taps on buildings and people are passed back to the game through the bridge.
import * as THREE from './vendor/three.module.js';
import { buildPlace, buildEnvironment, buildLandmarks, STYLES, SIGNS, plotCenter, laneZ, LANE_A, LANE_B, ALLEYS, RAIL_Z, BOUNDS } from './world/town.js';
import { makePerson, animate, face, setHeld, makeCat, makeTrain } from './world/people.js';
import { clearSignCache } from './world/kit.js';

const host = document.getElementById('world-view');
const canvas = document.getElementById('world-canvas');
const overlay = document.getElementById('world-overlay');
const bridge = () => window.GameBridge;

// ——— Renderer ———
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
} catch (error) {
  renderer = null;
}

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-10, 10, 8, -8, 0.1, 200);
const hemi = new THREE.HemisphereLight('#fff5db', '#8d9d84', 2.1);
const sun = new THREE.DirectionalLight('#fff1d2', 3.0);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 14, bottom: -14, near: 1, far: 80 });
sun.shadow.bias = -0.0008;
sun.shadow.normalBias = 0.03;
scene.add(hemi, sun, sun.target);

const materials = { solid: new THREE.MeshLambertMaterial({ vertexColors: true }) };

// ——— World contents ———
let cityKey = -1, env = null, landmarks = null, landmarkKey = '';
const places = []; // { group, shell, glow, key, fade, pool }
let style = STYLES[0];
const people = {}; // id -> actor
let player = null, cat = null, train = null;
const helpers = [];
const townsfolk = [];
let weather = null;

// Night-time "light pools" on the ground in front of lit buildings.
const poolTexture = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,214,150,0.9)');
  g.addColorStop(1, 'rgba(255,214,150,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();

function placeKey(state, i) {
  const l = state.stations[i].level;
  return [state.city, l > 0, l >= 10, l >= 25, l >= 50, l >= 100].join(':');
}

function disposeGroup(g) {
  g.traverse(o => {
    o.geometry?.dispose();
    if (o.material && o.material !== materials.solid && !o.material.map) o.material.dispose?.();
  });
}

function rebuildCity(state) {
  cityKey = state.city;
  style = STYLES[state.city];
  if (env) { scene.remove(env); disposeGroup(env); }
  clearSignCache();
  env = buildEnvironment(state.city, materials);
  scene.add(env);
  places.forEach(p => p && (scene.remove(p.group), scene.remove(p.pool), disposeGroup(p.group)));
  places.length = 0;
  landmarkKey = '';
  if (train) { scene.remove(train); train = null; }
  if (style.rail) {
    train = makeTrain(materials.solid, state.city === 3 ? ['#eef0e6', '#c4523f'] : state.city === 2 ? ['#eef0e6', '#3f7a5f'] : ['#eef0e6', '#5f8a6f']);
    train.position.set(-40, 0.12, RAIL_Z);
    train.userData.next = 4;
    scene.add(train);
  }
  setupPeople(state);
  setupWeather(state.city);
  shadowDirty = true;
}

function syncPlaces(state) {
  for (let i = 0; i < 8; i++) {
    const key = placeKey(state, i);
    if (places[i]?.key === key) continue;
    const old = places[i];
    if (old) { scene.remove(old.group); scene.remove(old.pool); disposeGroup(old.group); }
    const group = buildPlace(i, state.stations[i].level, state.city, materials);
    scene.add(group);
    const shell = group.children.find(o => o.userData.shell);
    const glow = group.children.find(o => o.userData.glow);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.2), new THREE.MeshBasicMaterial({ map: poolTexture, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2;
    const c = plotCenter(i);
    pool.position.set(c.x, 0.03, c.z + 2.3);
    scene.add(pool);
    places[i] = { group, shell, glow, key, fade: old?.fade ?? 1, pool, bounce: old ? 0.6 : 0 };
    shadowDirty = true;
  }
  const lk = state.city + ':' + state.projects.length;
  if (lk !== landmarkKey) {
    landmarkKey = lk;
    if (landmarks) { scene.remove(landmarks); disposeGroup(landmarks); }
    landmarks = buildLandmarks(state.city, state.projects.length, materials);
    scene.add(landmarks);
    shadowDirty = true;
  }
}

// ——— People ———
const SKINS = ['#e3b48f', '#d9a57f', '#cf9b76', '#e8bf9c', '#d4a07c'];
const NEIGHBOR_LOOKS = {
  sato: { coat: '#98a57b', hair: '#d4d1c6', style: 'bun', glasses: true, skin: '#e3b896', scale: 0.92 },
  emi: { coat: '#efe6d2', apron: '#c46a52', hair: '#4d3830', style: 'bun', skin: '#e3b48f' },
  haru: { coat: '#7d93a8', hair: '#2f2a26', style: 'short', glasses: true, skin: '#dcaa84' },
  kenji: { coat: '#8f9f74', hair: '#8a8a7e', style: 'short', hat: '#c9b07a', skin: '#c99472' },
  aiko: { coat: '#a593ad', hair: '#3f3129', style: 'bob', skin: '#e3b48f' }
};
const LOCAL_STYLES = [['long', 'short', 'bun'], ['short', 'grey', 'bob'], ['short', 'grey', 'long'], ['short', 'grey', 'long'], ['bob', 'long', 'short']];

function actor(id, look, kind) {
  const p = makePerson(look, materials.solid);
  p.id = id;
  p.kind = kind;
  p.path = [];
  p.wait = 2 + Math.random() * 6;
  p.at = null;
  p.root.userData.person = id;
  p.root.traverse(o => { o.userData.person = id; });
  scene.add(p.root);
  return p;
}
function removeActor(p) { scene.remove(p.root); disposeGroup(p.root); }

function setupPeople(state) {
  for (const id of Object.keys(people)) { removeActor(people[id]); delete people[id]; }
  helpers.splice(0).forEach(removeActor);
  townsfolk.splice(0).forEach(removeActor);
  if (cat) { scene.remove(cat); cat = null; }
  if (!player) {
    player = actor('player', { coat: state.coat, hair: '#5a4332', style: 'tousled', pack: '#b48a5a', skin: '#e3b48f', pants: '#56606a' }, 'player');
    player.coat = state.coat;
  }
  const start = places[state.focus]?.group.userData.work || new THREE.Vector3(-8, 0.12, -3.6);
  player.root.position.copy(start);
  player.at = state.focus;
  player.path = [];
  playerFocus = state.focus;
  const C = window.Content, J = window.Journey;
  if (state.city === 0) for (const n of C.PEOPLE) people[n.id] = actor(n.id, NEIGHBOR_LOOKS[n.id], 'neighbor');
  J.cities[state.city].locals.forEach((l, i) => {
    people['local' + i] = actor('local' + i, { coat: l.color, hair: ['#2f2a26', '#4a3a30', '#8a8478'][(i + state.city) % 3], style: LOCAL_STYLES[state.city][i], skin: SKINS[(i * 2 + state.city) % 5], scale: 0.97 }, 'local');
    people['local' + i].local = i;
  });
  for (let i = 0; i < 8; i++) {
    const h = actor('helper' + i, { coat: ['#b7947b', '#999f76', '#a092ad', '#ac956a', '#829e92', '#8e9fb2', '#a18f70', '#9da880'][i], hair: ['#2f2a26', '#4a3a30', '#6a5a4a'][i % 3], style: ['short', 'bob', 'bun', 'short', 'grey', 'long', 'short', 'bob'][i], skin: SKINS[i % 5], scale: 0.9 }, 'helper');
    h.place = i;
    h.root.visible = false;
    helpers.push(h);
  }
  cat = makeCat(materials.solid);
  cat.position.set(-10.2, 0.6, LANE_A - 1.0);
  cat.userData.spots = [[-10.6, 1.2, LANE_A - 1.0], [-6.1, 0.54, LANE_A - 1.05], [5.4, 0.98, LANE_B + 1.0], [-3.6, 0.12, LANE_B + 1.0]];
  cat.userData.next = 20;
  scene.add(cat);
  for (let i = 0; i < 8; i++) {
    const t = actor('folk' + i, { coat: ['#c98a6a', '#6a8aa8', '#8aa86a', '#d6b46a', '#a87aa8', '#6aa8a0', '#b86a6a', '#7a7a9a'][i], hair: ['#2f2a26', '#4a3a30', '#c9c4b8'][i % 3], style: ['short', 'long', 'grey', 'bob', 'bun', 'short', 'long', 'short'][i], skin: SKINS[(i + 2) % 5], scale: i === 3 || i === 6 ? 0.72 : 0.92, pack: i === 3 || i === 6 ? '#c84a3a' : null }, 'folk');
    t.root.visible = false;
    t.root.position.set(-14, 0, LANE_A);
    townsfolk.push(t);
  }
}

// Paths follow the lanes and alleys, like real people would.
function routeTo(p, target, targetPlace) {
  const pos = p.root.position;
  const pts = [];
  const fromPlace = p.at;
  if (fromPlace !== null && places[fromPlace]) {
    const door = places[fromPlace].group.userData.door;
    pts.push(new THREE.Vector3(door.x, 0, door.z));
  }
  const fromLane = fromPlace !== null ? laneZ(fromPlace) : Math.abs(pos.z - LANE_A) < Math.abs(pos.z - LANE_B) ? LANE_A : LANE_B;
  const startX = pts.length ? pts[0].x : pos.x;
  pts.push(new THREE.Vector3(startX, 0, fromLane + (Math.random() - 0.5) * 0.4));
  const toLane = targetPlace !== null ? laneZ(targetPlace) : Math.abs(target.z - LANE_A) < Math.abs(target.z - LANE_B) ? LANE_A : LANE_B;
  const endDoor = targetPlace !== null ? places[targetPlace].group.userData.door : target;
  if (toLane !== fromLane) {
    const alley = ALLEYS.reduce((best, x) => Math.abs(x - startX) + Math.abs(x - endDoor.x) < Math.abs(best - startX) + Math.abs(best - endDoor.x) ? x : best, ALLEYS[0]);
    pts.push(new THREE.Vector3(alley, 0, fromLane), new THREE.Vector3(alley, 0, toLane));
  }
  pts.push(new THREE.Vector3(endDoor.x, 0, toLane));
  if (targetPlace !== null) pts.push(new THREE.Vector3(endDoor.x, 0, endDoor.z));
  pts.push(target.clone());
  p.path = pts;
  p.at = null;
  p.goal = targetPlace;
}

function step(p, dt, speed = 2.6) {
  if (!p.path.length) return false;
  const goal = p.path[0], pos = p.root.position;
  const dx = goal.x - pos.x, dz = goal.z - pos.z, dist = Math.hypot(dx, dz);
  if (dist < 0.06) {
    p.path.shift();
    if (!p.path.length) { p.at = p.goal ?? null; pos.y = goal.y || 0; }
    return true;
  }
  const move = Math.min(dist, dt * speed);
  pos.x += dx / dist * move;
  pos.z += dz / dist * move;
  pos.y = p.path.length === 1 ? goal.y * (1 - dist / 2) : 0;
  face(p, Math.atan2(dx, dz), dt);
  return true;
}

const WORK = ['write', 'carry', 'cup', 'talk', 'cook', 'read', 'water', 'arrange'];
const HELD = ['book', 'bag', 'cup', 'card', 'plate', 'book', 'can', 'chair'];
let playerFocus = -1;

function updatePlayer(state, dt, t, now) {
  if (player.coat !== state.coat) {
    removeActor(player);
    const pos = player.root.position.clone(), at = player.at, path = player.path;
    player = actor('player', { coat: state.coat, hair: '#5a4332', style: 'tousled', pack: '#b48a5a', skin: '#e3b48f', pants: '#56606a' }, 'player');
    player.coat = state.coat;
    player.root.position.copy(pos);
    player.at = at;
    player.path = path;
    setHeld(player, HELD[state.focus], materials.solid);
  }
  if (playerFocus !== state.focus && places[state.focus]) {
    playerFocus = state.focus;
    const u = places[state.focus].group.userData;
    routeTo(player, u.work, state.focus);
    setHeld(player, null);
  }
  const walking = step(player, dt, 3.2);
  if (!walking && player.at === state.focus) {
    if (!player.heldSet) { setHeld(player, HELD[state.focus], materials.solid); player.heldSet = true; }
    face(player, places[state.focus].group.userData.facing, dt);
  } else player.heldSet = false;
  const working = state.started && !walking;
  const hop = now < hopUntil ? Math.sin((hopUntil - now) / 260 * Math.PI) * 0.08 : 0;
  animate(player, motion ? t : 0, walking ? 'walk' : working ? 'work:' + WORK[state.focus] : 'idle', now < hopUntil ? 2.2 : 1);
  player.body.position.y += hop;
}

function updateNeighbors(state, dt, t) {
  const B = bridge();
  for (const p of Object.values(people)) {
    let home, present, ready;
    if (p.kind === 'neighbor') {
      const n = window.Content.PEOPLE.find(x => x.id === p.id);
      present = state.stations[n.place].level > 0 && state.jp >= n.needs;
      home = n.place;
      ready = B?.personReady?.(p.id);
    } else {
      present = window.Idle.localPresent(state, p.local);
      home = window.Idle.LOCAL_PLACE[p.local];
      ready = B?.personReady?.(p.id);
    }
    p.root.visible = present;
    if (!present) { p.placed = false; continue; }
    const door = places[home].group.userData.door;
    const spot = new THREE.Vector3(door.x + (p.kind === 'local' ? 0.75 : -0.75), 0, door.z + 0.15);
    if (!p.placed) { p.root.position.copy(spot); p.placed = true; p.at = null; p.path = []; }
    const walking = step(p, dt, 1.8);
    if (!walking) {
      p.wait -= dt;
      const atHome = p.root.position.distanceTo(spot) < 0.3;
      if (ready && !atHome) { routeTo(p, spot, null); p.goal = null; }
      else if (!ready && p.wait <= 0) {
        // Wander: visit another open place for a while, then come home.
        const open = state.stations.map((s, i) => s.level > 0 ? i : -1).filter(i => i >= 0 && i !== home);
        if (atHome && open.length && Math.random() < 0.6) {
          const target = places[open[Math.floor(Math.random() * open.length)]].group.userData.door;
          routeTo(p, new THREE.Vector3(target.x + (Math.random() - 0.5) * 1.2, 0, target.z + 0.25), null);
        } else if (!atHome) routeTo(p, spot, null);
        p.goal = null;
        p.wait = 10 + Math.random() * 18;
      }
      face(p, ready ? Math.atan2(player.root.position.x - p.root.position.x, player.root.position.z - p.root.position.z) : 0.2, dt);
    }
    animate(p, motion ? t + p.root.id : 0, walking ? 'walk' : ready ? (Math.sin(t * 0.8 + p.root.id) > 0.4 ? 'wave' : 'idle') : 'idle', 0.8);
  }
}

function updateHelpers(state, t) {
  for (const h of helpers) {
    const i = h.place, st = state.stations[i];
    const visible = st.auto && i !== state.focus && !!places[i];
    h.root.visible = visible;
    if (!visible) continue;
    const u = places[i].group.userData;
    h.root.position.set(u.work.x + 0.15, u.work.y, u.work.z + 0.05);
    h.root.rotation.y = u.facing;
    animate(h, motion ? t + i : 0, 'work:' + WORK[i], 0.9);
  }
}

// Passers-by: the street gets busier as your circle of friends grows.
function updateTownsfolk(state, dt, t) {
  const want = 2 + Math.min(6, Math.floor(state.bonds / 40) + state.projects.length);
  townsfolk.forEach((p, i) => {
    if (!p.root.visible) {
      if (i < want && Math.random() < dt * 0.15) {
        const lane = Math.random() < 0.5 ? LANE_A : LANE_B, dir = Math.random() < 0.5 ? 1 : -1;
        p.root.position.set(-14 * dir, 0, lane + (Math.random() - 0.5) * 0.9);
        p.path = [new THREE.Vector3(14 * dir, 0, p.root.position.z)];
        p.root.visible = true;
      }
      return;
    }
    const walking = step(p, dt, i % 3 === 0 ? 1.4 : 1.9);
    if (!walking) p.root.visible = false;
    animate(p, motion ? t + i * 3 : 0, 'walk', i % 3 === 0 ? 0.7 : 0.9);
  });
}

function updateTrain(dt) {
  if (!train) return;
  const u = train.userData;
  if (u.running) {
    train.position.x += dt * 7 * u.dir;
    if (Math.abs(train.position.x) > 24) { u.running = false; u.next = 35 + Math.random() * 30; }
  } else if ((u.next -= dt) <= 0) {
    u.running = true;
    u.dir = Math.random() < 0.5 ? 1 : -1;
    train.position.x = -22 * u.dir - (u.dir < 0 ? 4.5 : 0);
    bridge()?.sound?.('train');
  }
}

function updateCat(dt, t) {
  if (!cat) return;
  const u = cat.userData;
  if ((u.next -= dt) <= 0) {
    const s = u.spots[Math.floor(Math.random() * u.spots.length)];
    cat.position.set(s[0], s[1], s[2]);
    cat.rotation.y = Math.random() * Math.PI * 2;
    u.next = 40 + Math.random() * 60;
  }
  if (motion) cat.children[0].rotation.z = Math.sin(t * 0.6) * 0.03;
}

// ——— Weather: petals, leaves, fireflies, snow ———
function setupWeather(city) {
  if (weather) { scene.remove(weather.points); weather.points.geometry.dispose(); weather.points.material.dispose(); weather = null; }
  const kind = ['petals', 'leaves', 'fireflies', 'snow', 'sparkle'][city];
  const count = kind === 'snow' ? 160 : kind === 'fireflies' ? 40 : kind === 'sparkle' ? 30 : 70;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  const color = { petals: '#f6c6c0', leaves: '#e08a4a', fireflies: '#fff2a0', snow: '#ffffff', sparkle: '#fff8e0' }[kind];
  const g = x.createRadialGradient(16, 16, 1, 16, 16, 16);
  g.addColorStop(0, color);
  g.addColorStop(kind === 'fireflies' || kind === 'sparkle' ? 0.25 : 0.55, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  if (kind === 'petals' || kind === 'leaves') { x.beginPath(); x.ellipse(16, 16, 11, 6, 0.6, 0, Math.PI * 2); x.fill(); } else x.fillRect(0, 0, 32, 32);
  const pos = new Float32Array(count * 3), seed = [];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = BOUNDS.minX + Math.random() * (BOUNDS.maxX - BOUNDS.minX);
    pos[i * 3 + 1] = Math.random() * 7;
    pos[i * 3 + 2] = BOUNDS.minZ + Math.random() * (BOUNDS.maxZ - BOUNDS.minZ);
    seed.push(Math.random() * 100);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    map: new THREE.CanvasTexture(c), size: kind === 'snow' ? 0.16 : kind === 'fireflies' ? 0.22 : kind === 'sparkle' ? 0.2 : 0.2,
    transparent: true, depthWrite: false, opacity: 0.9,
    blending: kind === 'fireflies' || kind === 'sparkle' ? THREE.AdditiveBlending : THREE.NormalBlending
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);
  weather = { kind, points, seed, count };
}

function updateWeather(dt, t, night) {
  if (!weather) return;
  const { kind, points, seed, count } = weather;
  const visible = motion && quality !== 'low' && (kind === 'fireflies' ? night > 0.3 : kind === 'sparkle' ? night > 0.3 : true);
  points.visible = visible;
  if (!visible) return;
  if (kind === 'fireflies' || kind === 'sparkle') points.material.opacity = night * (0.6 + Math.sin(t * 3) * 0.2);
  const a = points.geometry.attributes.position.array;
  for (let i = 0; i < count; i++) {
    const s = seed[i];
    if (kind === 'snow') { a[i * 3 + 1] -= dt * (0.5 + (s % 1) * 0.4); a[i * 3] += Math.sin(t + s) * dt * 0.2; }
    else if (kind === 'petals' || kind === 'leaves') { a[i * 3 + 1] -= dt * (0.35 + (s % 1) * 0.3); a[i * 3] += dt * (0.5 + Math.sin(t * 0.8 + s) * 0.6); a[i * 3 + 2] += Math.cos(t * 0.6 + s) * dt * 0.3; }
    else { a[i * 3] += Math.sin(t * 0.7 + s) * dt * 0.4; a[i * 3 + 1] = 0.4 + (s % 2) + Math.sin(t * 0.9 + s) * 0.4; a[i * 3 + 2] += Math.cos(t * 0.5 + s) * dt * 0.4; }
    if (a[i * 3 + 1] < 0) { a[i * 3 + 1] = 6 + Math.random(); a[i * 3] = BOUNDS.minX + Math.random() * (BOUNDS.maxX - BOUNDS.minX); }
    if (a[i * 3] > BOUNDS.maxX) a[i * 3] = BOUNDS.minX;
  }
  points.geometry.attributes.position.needsUpdate = true;
}

// ——— Time of day ———
// Keyframes: hour, sky, hemisphere sky/ground/intensity, sun colour/intensity, night (0–1).
const KEYS = [
  [0, '#33405f', '#a3b1dc', '#515a72', 1.75, '#b8c6f0', 1.0, 1],
  [5, '#384664', '#a3b1dc', '#515a72', 1.75, '#b8c6f0', 1.0, 1],
  [6.3, '#e9cdb4', '#ffdcbc', '#7a7470', 1.7, '#ffcf9a', 1.8, 0.45],
  [8, null, '#fff5db', '#8d9d84', 2.1, '#fff1d2', 3.0, 0],
  [16.5, null, '#fff5db', '#8d9d84', 2.1, '#fff1d2', 3.0, 0],
  [17.8, '#efc49c', '#ffd8b0', '#8a7a6a', 1.8, '#ffb878', 2.2, 0.35],
  [19.2, '#46507a', '#aab0dc', '#59546a', 1.8, '#c4b8ec', 1.1, 0.92],
  [24, '#33405f', '#a3b1dc', '#515a72', 1.75, '#b8c6f0', 1.0, 1]
];
const cA = new THREE.Color(), cB = new THREE.Color();
function lerpColor(a, b, f) { return cA.set(a).lerp(cB.set(b), f).clone(); }
function timeOfDay(state) {
  let h;
  if (state.clock === 'day') h = 10.5;
  else { const d = new Date(); h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }
  let k = 0;
  while (k < KEYS.length - 2 && KEYS[k + 1][0] <= h) k++;
  const a = KEYS[k], b = KEYS[k + 1], f = (h - a[0]) / (b[0] - a[0]);
  const sky = (v) => v || style.sky;
  return {
    hour: h,
    sky: lerpColor(sky(a[1]), sky(b[1]), f),
    hemiSky: lerpColor(a[2], b[2], f), hemiGround: lerpColor(a[3], b[3], f), hemiI: a[4] + (b[4] - a[4]) * f,
    sunColor: lerpColor(a[5], b[5], f), sunI: a[6] + (b[6] - a[6]) * f,
    night: a[7] + (b[7] - a[7]) * f
  };
}
const WARM = new THREE.Color(1.55, 1.18, 0.72), DIM = new THREE.Color(0.45, 0.5, 0.62), WHITE = new THREE.Color(1, 1, 1);
let lastSunUpdate = 0;
function applyLight(state, now) {
  const d = timeOfDay(state);
  scene.background = d.sky;
  renderer?.setClearColor(d.sky);
  hemi.color.copy(d.hemiSky);
  hemi.groundColor.copy(d.hemiGround);
  hemi.intensity = d.hemiI;
  sun.color.copy(d.sunColor);
  sun.intensity = d.sunI;
  // The sun swings slowly across the day; shadows refresh every few seconds.
  if (now - lastSunUpdate > 8000 || shadowDirty) {
    lastSunUpdate = now;
    const day = Math.min(1, Math.max(0, (d.hour - 6) / 13));
    const az = -0.9 + day * 1.8;
    sun.position.set(Math.sin(az) * 14, 18, 8 + Math.cos(az) * 6);
    sun.target.position.set(0, 0, 1);
    shadowDirty = true;
  }
  places.forEach((p, i) => {
    if (!p?.glow) return;
    const owned = state.stations[i].level > 0;
    p.glow.material.color.copy(WHITE).lerp(owned ? WARM : DIM, d.night);
    p.pool.material.opacity = owned ? d.night * 0.55 : 0;
  });
  for (const g of [env, landmarks]) g?.children.forEach(o => { if (o.userData.glow) o.material.color.copy(WHITE).lerp(WARM, d.night); });
  return d;
}

// ——— Camera ———
const view = { mode: 'close', target: new THREE.Vector3(), span: 3, pan: new THREE.Vector3(), zoom: 1, az: 0.62, el: 0.74 };
let currentSpan = 6, currentTarget = new THREE.Vector3(0, 0, 0);
function fitTown(aspect) {
  const sa = Math.sin(view.az), ca = Math.cos(view.az), se = Math.sin(view.el), ce = Math.cos(view.el);
  const right = new THREE.Vector3(ca, 0, -sa), up = new THREE.Vector3(-se * sa, ce, -se * ca);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const x of [BOUNDS.minX + 0.5, BOUNDS.maxX - 0.5]) for (const z of [BOUNDS.minZ + 1.2, BOUNDS.maxZ - 0.8]) for (const y of [0, 2.8]) {
    const v = new THREE.Vector3(x, y, z);
    const px = v.dot(right), py = v.dot(up);
    minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py);
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  // A point on the ground that the camera should centre on.
  const target = right.clone().multiplyScalar(cx).add(new THREE.Vector3(-sa, 0, -ca).multiplyScalar(cy / se));
  return { span: Math.max((maxY - minY) / 2, (maxX - minX) / 2 / aspect) * 1.0, target };
}
function updateCamera(state, dt) {
  const w = host.clientWidth || 1, h = host.clientHeight || 1, aspect = w / h;
  const viewed = bridge()?.selection?.() ?? state.focus;
  let target, span;
  if (view.mode === 'town') {
    const f = fitTown(aspect);
    span = f.span;
    target = f.target;
  } else {
    const c = plotCenter(viewed);
    target = new THREE.Vector3(c.x + 0.3, 0.7, c.z + 0.35);
    // A building plus a little of the street, whatever the screen shape.
    span = Math.max(3.1, 4.4 / aspect) * Math.min(1.7, Math.max(1, h / 330));
  }
  span /= view.zoom;
  target.add(view.pan);
  const k = reduced ? 1 : Math.min(1, dt * 4);
  currentTarget.lerp(target, k);
  currentSpan += (span - currentSpan) * k;
  camera.left = -currentSpan * aspect;
  camera.right = currentSpan * aspect;
  camera.top = currentSpan;
  camera.bottom = -currentSpan;
  const R = 60;
  camera.position.set(
    currentTarget.x + Math.sin(view.az) * Math.cos(view.el) * R,
    currentTarget.y + Math.sin(view.el) * R,
    currentTarget.z + Math.cos(view.az) * Math.cos(view.el) * R);
  camera.lookAt(currentTarget);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  // Fade the roof and front of the building you are looking into.
  places.forEach((p, i) => {
    if (!p?.shell) return;
    const want = view.mode === 'close' && i === viewed ? 0 : 1;
    p.fade += (want - p.fade) * (reduced ? 1 : Math.min(1, dt * 5));
    const m = p.shell.material;
    m.transparent = p.fade < 0.99;
    m.opacity = p.fade;
    m.depthWrite = p.fade > 0.6;
    p.shell.visible = p.fade > 0.03;
    p.shell.castShadow = p.fade > 0.5;
    if (p.bounce > 0) {
      p.bounce = Math.max(0, p.bounce - dt * 1.6);
      const s = 1 + Math.sin(p.bounce * Math.PI * 2) * p.bounce * 0.05;
      p.group.scale.set(s, 1 + (s - 1) * 1.6, s);
    } else p.group.scale.set(1, 1, 1);
  });
}

// ——— Overlay: labels and bubbles ———
const pins = [], personPins = {};
let mePin = null;
function makeOverlay() {
  overlay.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const b = document.createElement('button');
    b.className = 'place-pin';
    b.dataset.place = i;
    b.innerHTML = '<span class="pin-icon"></span><span class="pin-text"><b class="pin-name"></b><small class="pin-sub"></small></span><i class="pin-bar"><i></i></i>';
    b.addEventListener('click', e => { e.stopPropagation(); bridge()?.select(i); });
    overlay.append(b);
    pins.push(b);
  }
  mePin = document.createElement('button');
  mePin.className = 'me-pin';
  mePin.setAttribute('aria-label', 'Help with the current task');
  mePin.innerHTML = '<svg viewBox="0 0 44 44" aria-hidden="true"><circle class="ring-bg" cx="22" cy="22" r="19"/><circle class="ring" cx="22" cy="22" r="19"/></svg><span class="me-glyph"></span>';
  mePin.addEventListener('click', e => { e.stopPropagation(); helpTap(); });
  overlay.append(mePin);
}
function personPin(id) {
  if (personPins[id]) return personPins[id];
  const b = document.createElement('button');
  b.className = 'person-pin';
  b.addEventListener('click', e => { e.stopPropagation(); bridge()?.visit(id); });
  overlay.append(b);
  personPins[id] = b;
  return b;
}
const v3 = new THREE.Vector3();
function toScreen(p) {
  v3.copy(p).project(camera);
  return { x: (v3.x * 0.5 + 0.5) * host.clientWidth, y: (-v3.y * 0.5 + 0.5) * host.clientHeight, behind: v3.z > 1 };
}
const RING = 2 * Math.PI * 19;
function updateOverlay(state) {
  const I = window.Idle, viewed = bridge()?.selection?.() ?? state.focus;
  const town = view.mode === 'town';
  pins.forEach((b, i) => {
    const p = places[i];
    if (!p) return;
    const st = state.stations[i], a = I.ACTIVITIES[i];
    const readable = state.jp >= a.needs[0];
    const s = toScreen(p.group.userData.label);
    b.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -100%)`;
    b.hidden = !town && i !== viewed ? true : !town;
    b.classList.toggle('selected', i === viewed);
    b.classList.toggle('locked', !st.level);
    b.classList.toggle('auto', st.auto);
    b.querySelector('.pin-icon').textContent = a.icon;
    b.querySelector('.pin-name').textContent = readable ? a.name : SIGNS[i].jp;
    b.querySelector('.pin-sub').textContent = st.level ? (st.auto ? '∞ ' : '') + 'Lv ' + st.level : I.accessible(state, i) ? 'Ready to open' : '準備中';
    b.querySelector('.pin-bar i').style.width = st.running ? (st.progress / I.duration(state, i)) * 100 + '%' : '0%';
  });
  // The helping ring above your character.
  const head = player.root.position.clone().add(new THREE.Vector3(0, 1.45, 0));
  const s = toScreen(head);
  const working = state.started && !player.path.length;
  mePin.hidden = !working;
  if (working) {
    const st = state.stations[state.focus];
    mePin.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -100%)`;
    mePin.querySelector('.ring').style.strokeDashoffset = String(RING * (1 - st.progress / I.duration(state, state.focus)));
    mePin.querySelector('.me-glyph').textContent = I.ACTIVITIES[state.focus].icon;
  }
  // Bubbles over people with something to share.
  for (const p of Object.values(people)) {
    const ready = p.root.visible && bridge()?.personReady?.(p.id);
    const pin = personPin(p.id);
    pin.hidden = !ready;
    if (!ready) continue;
    const info = bridge()?.personInfo?.(p.id);
    if (pin.dataset.key !== info?.key) {
      pin.dataset.key = info?.key;
      pin.innerHTML = (info?.portrait ? `<span class="portrait portrait-${p.id}"></span>` : `<span class="seal" style="--accent:${info?.color}">${info?.seal || '人'}</span>`) + `<span class="pin-badge">${info?.badge || '✦'}</span>`;
      pin.setAttribute('aria-label', info?.label || 'Talk');
    }
    const q = toScreen(p.root.position.clone().add(new THREE.Vector3(0, 1.35, 0)));
    pin.style.transform = `translate(${q.x}px, ${q.y}px) translate(-50%, -100%)`;
  }
}

function floatText(worldPos, text, kind = '') {
  if (reduced || !overlay) return;
  const s = toScreen(worldPos);
  const n = document.createElement('div');
  n.className = 'float-text ' + kind;
  n.textContent = text;
  n.style.left = s.x + 'px';
  n.style.top = s.y + 'px';
  overlay.append(n);
  setTimeout(() => n.remove(), 1500);
}

// ——— Input ———
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
const touches = new Map();
let dragging = false, pinchStart = 0, zoomStart = 1, downAt = null;
canvas.addEventListener('pointerdown', e => {
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  canvas.setPointerCapture?.(e.pointerId);
  if (touches.size === 1) { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; dragging = false; }
  if (touches.size === 2) { const [a, b] = [...touches.values()]; pinchStart = Math.hypot(a.x - b.x, a.y - b.y); zoomStart = view.zoom; dragging = true; }
});
canvas.addEventListener('pointermove', e => {
  const prev = touches.get(e.pointerId);
  if (!prev) return;
  const cur = { x: e.clientX, y: e.clientY };
  touches.set(e.pointerId, cur);
  if (touches.size === 2) {
    const [a, b] = [...touches.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchStart > 0) view.zoom = clampZoom(zoomStart * d / pinchStart);
    return;
  }
  if (downAt && Math.hypot(cur.x - downAt.x, cur.y - downAt.y) > 8) dragging = true;
  if (!dragging) return;
  // Pan across the ground, matched to how far the finger moved.
  const px = (2 * currentSpan) / (host.clientHeight || 1);
  const dx = (cur.x - prev.x) * px, dy = (cur.y - prev.y) * px;
  const right = new THREE.Vector3(Math.cos(view.az), 0, -Math.sin(view.az));
  const up = new THREE.Vector3(Math.sin(view.az), 0, Math.cos(view.az));
  view.pan.addScaledVector(right, -dx).addScaledVector(up, -dy / Math.sin(view.el));
  const limit = view.mode === 'town' ? 6 : 9;
  view.pan.x = Math.max(-limit * 1.6, Math.min(limit * 1.6, view.pan.x));
  view.pan.z = Math.max(-limit, Math.min(limit, view.pan.z));
});
function endPointer(e) {
  const wasDragging = dragging;
  touches.delete(e.pointerId);
  if (touches.size) return;
  if (!wasDragging && downAt && performance.now() - downAt.t < 600) tap(e);
  downAt = null;
  dragging = false;
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', e => { touches.delete(e.pointerId); dragging = false; downAt = null; });
canvas.addEventListener('wheel', e => { e.preventDefault(); view.zoom = clampZoom(view.zoom * (e.deltaY > 0 ? 0.9 : 1.1)); }, { passive: false });
function clampZoom(z) { return Math.max(0.6, Math.min(2.6, z)); }

function tap(e) {
  const rect = canvas.getBoundingClientRect();
  pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const targets = [player.root, ...Object.values(people).filter(p => p.root.visible).map(p => p.root), ...places.map(p => p.group)];
  const hit = raycaster.intersectObjects(targets, true).find(h => h.object.visible && !(h.object.userData.shell && h.object.material.opacity < 0.5));
  if (!hit) return;
  const o = hit.object;
  if (o.userData.person === 'player') return helpTap();
  if (o.userData.person) return bridge()?.visit(o.userData.person);
  if (Number.isInteger(o.userData.place)) bridge()?.select(o.userData.place);
}

let hopUntil = 0;
function helpTap() {
  hopUntil = performance.now() + 260;
  bridge()?.assist();
}

// ——— Main loop ———
let reduced = false, motion = true, quality = 'auto', qualityKey = '', shadowDirty = true, last = performance.now();
let frameInterval = 1000 / 30;
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  if (!w || !h || !renderer) return;
  renderer.setSize(w, h, false);
}
new ResizeObserver(resize).observe(host);

function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden || now - last < frameInterval - 2) return;
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const state = bridge()?.state();
  if (!state || !renderer) return;
  reduced = !!state.reducedMotion;
  motion = !reduced;
  quality = state.quality === 'low' ? 'low' : 'auto';
  if (qualityKey !== quality) {
    qualityKey = quality;
    const dpr = window.devicePixelRatio || 1;
    renderer.setPixelRatio(quality === 'low' ? Math.min(dpr, 1.25) : Math.min(dpr, 2));
    renderer.shadowMap.enabled = quality !== 'low';
    sun.shadow.mapSize.set(host.clientWidth > 700 ? 2048 : 1024, host.clientWidth > 700 ? 2048 : 1024);
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
    shadowDirty = true;
    resize();
  }
  if (cityKey !== state.city) {
    rebuildCity(state);
    syncPlaces(state);
    setupPeople(state);
  } else syncPlaces(state);
  const t = now / 1000;
  const light = applyLight(state, now);
  updatePlayer(state, dt, t, now);
  updateNeighbors(state, dt, t);
  updateHelpers(state, t);
  updateTownsfolk(state, dt, t);
  if (motion) updateTrain(dt);
  updateCat(dt, t);
  updateWeather(dt, t, light.night);
  updateCamera(state, dt);
  updateOverlay(state);
  if (shadowDirty) { renderer.shadowMap.needsUpdate = true; shadowDirty = false; }
  renderer.render(scene, camera);
}

// ——— Public API for the game UI ———
window.WorldView = {
  mode: () => view.mode,
  setMode(mode) {
    view.mode = mode === 'town' ? 'town' : 'close';
    view.pan.set(0, 0, 0);
    view.zoom = 1;
    return view.mode;
  },
  toggle() { return this.setMode(view.mode === 'town' ? 'close' : 'town'); },
  recenter() { view.pan.set(0, 0, 0); view.zoom = 1; },
  // A burst of feedback at a place: the building bounces and text floats up.
  celebrate(i, text, kind) {
    if (places[i]) places[i].bounce = 1;
    if (text) floatText(places[i]?.group.userData.label.clone().add(new THREE.Vector3(0, 0.4, 0)) || new THREE.Vector3(), text, kind);
  },
  reward(text, kind) {
    if (player) floatText(player.root.position.clone().add(new THREE.Vector3(0, 1.6, 0)), text, kind);
  },
  assist() { hopUntil = performance.now() + 260; },
  snapshot() {
    return {
      webgl: !!renderer, mode: view.mode, places: places.filter(Boolean).length,
      people: Object.values(people).filter(p => p.root.visible).map(p => p.id),
      player: player?.root.position.toArray(), drawCalls: renderer?.info.render.calls, triangles: renderer?.info.render.triangles
    };
  }
};

function showFallback(show) {
  canvas.style.display = show ? 'none' : '';
  overlay.style.display = show ? 'none' : '';
  host.classList.toggle('fallback-world', show);
  const f = document.getElementById('fallback-town');
  if (f) f.hidden = !show;
}
if (!renderer) {
  showFallback(true);
  bridge()?.notice?.('Your device is showing the illustrated neighborhood. Everything still works.');
} else {
  makeOverlay();
  resize();
  // Signs use a rounded Japanese web font; redraw them once it has loaded.
  document.fonts?.load?.('700 40px "Zen Maru Gothic"', '喫茶みんなの家').then(() => { cityKey = -1; places.forEach(p => p && (p.key = '')); }).catch(() => {});
  requestAnimationFrame(frame);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); showFallback(true); bridge()?.notice?.('The illustrated view is keeping your game running.'); });
  canvas.addEventListener('webglcontextrestored', () => { showFallback(false); shadowDirty = true; });
}
