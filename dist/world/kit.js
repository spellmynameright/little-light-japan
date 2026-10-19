// A Little Light — 3D toolkit.
// Builds many simple shapes into one vertex-coloured mesh, so a whole building is a
// handful of draw calls. Everything here is plain geometry: no textures except signs.
import * as THREE from '../vendor/three.module.js';

const tmpColor = new THREE.Color();
const tmpMatrix = new THREE.Matrix4();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler(0, 0, 0, 'YXZ'); // tilt first, then turn

// Collects shapes, then merges them into a single BufferGeometry with vertex colours.
export class Kit {
  constructor() { this.parts = []; }

  add(geometry, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    tmpEuler.set(rx, ry, rz);
    tmpQuat.setFromEuler(tmpEuler);
    tmpMatrix.compose(new THREE.Vector3(x, y, z), tmpQuat, new THREE.Vector3(sx, sy, sz));
    g.applyMatrix4(tmpMatrix);
    tmpColor.set(color);
    const n = g.attributes.position.count, colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { colors[i * 3] = tmpColor.r; colors[i * 3 + 1] = tmpColor.g; colors[i * 3 + 2] = tmpColor.b; }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.parts.push(g);
    return this;
  }
  // Box sitting on y (its bottom at y).
  box(w, h, d, color, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) {
    return this.add(new THREE.BoxGeometry(w, h, d), color, x, y + h / 2, z, rx, ry, rz);
  }
  // Box centred on y.
  cbox(w, h, d, color, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) {
    return this.add(new THREE.BoxGeometry(w, h, d), color, x, y, z, rx, ry, rz);
  }
  cyl(rTop, rBottom, h, color, x = 0, y = 0, z = 0, seg = 12, rx = 0, rz = 0) {
    return this.add(new THREE.CylinderGeometry(rTop, rBottom, h, seg), color, x, y + h / 2, z, rx, 0, rz);
  }
  ball(r, color, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, seg = 10) {
    return this.add(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 2)), color, x, y, z, 0, 0, 0, sx, sy, sz);
  }
  cone(r, h, color, x = 0, y = 0, z = 0, seg = 10) {
    return this.add(new THREE.ConeGeometry(r, h, seg), color, x, y + h / 2, z);
  }
  // A gable roof: ridge along x. w = width (x), d = depth (z), h = rise.
  gable(w, d, h, color, x = 0, y = 0, z = 0, ry = 0, overhang = 0.18) {
    const W = w / 2 + overhang, D = d / 2 + overhang, t = 0.09;
    const slope = Math.atan2(h, D), len = Math.hypot(h, D);
    const c = Math.cos(ry), s = Math.sin(ry);
    for (const side of [-1, 1]) {
      const lz = side * D / 2, ly = h / 2;
      this.cbox(W * 2, t, len, color, x + lz * s, y + ly, z + lz * c, ry, side * slope);
    }
    // Ridge cap.
    this.cbox(W * 2 + 0.04, 0.08, 0.14, shade(color, -0.18), x, y + h + 0.03, z, ry);
    return this;
  }
  // A hip-ish roof made of a gable plus end slopes, good for Japanese houses.
  hip(w, d, h, color, x = 0, y = 0, z = 0, overhang = 0.22) {
    const W = w / 2 + overhang, D = d / 2 + overhang;
    const geo = new THREE.BufferGeometry();
    const ridge = Math.max(0.01, W - D * 0.9);
    const v = [
      // front and back slopes (trapezoids) and two end triangles
      -W, 0, D, W, 0, D, ridge, h, 0, -W, 0, D, ridge, h, 0, -ridge, h, 0,
      W, 0, -D, -W, 0, -D, -ridge, h, 0, W, 0, -D, -ridge, h, 0, ridge, h, 0,
      W, 0, D, W, 0, -D, ridge, h, 0,
      -W, 0, -D, -W, 0, D, -ridge, h, 0
    ];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    geo.computeVertexNormals();
    this.add(geo, color, x, y, z);
    // A slim edge so the roof reads as having thickness.
    this.cbox(W * 2, 0.07, D * 2, shade(color, -0.22), x, y - 0.02, z);
    return this;
  }
  flat(w, d, color, x = 0, y = 0, z = 0) { return this.box(w, 0.02, d, color, x, y, z); }

  build(material) {
    if (!this.parts.length) return null;
    const geometry = merge(this.parts);
    this.parts.forEach(p => p.dispose());
    this.parts = [];
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}

export function merge(geometries) {
  let count = 0;
  for (const g of geometries) count += g.attributes.position.count;
  const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3), col = new Float32Array(count * 3);
  let o = 0;
  for (const g of geometries) {
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}

// Lighten (amount > 0) or darken (amount < 0) a colour.
export function shade(color, amount) {
  const c = new THREE.Color(color);
  if (amount > 0) c.lerp(new THREE.Color('#ffffff'), amount);
  else c.lerp(new THREE.Color('#000000'), -amount);
  return '#' + c.getHexString();
}

// A deterministic random generator, so the town looks the same every visit.
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const SIGN_FONT = '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", "IPAGothic", sans-serif';
const signCache = new Map();
// A painted signboard texture. Vertical signs stack characters top to bottom.
export function signTexture(text, { bg = '#f4ead2', fg = '#3d3329', vertical = false, border = '#8a6a4a', w = 512, h = 160, size } = {}) {
  const key = [text, bg, fg, vertical, border, w, h, size].join('|');
  if (signCache.has(key)) return signCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = Math.min(w, h) * 0.06;
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
  }
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const chars = [...text];
  if (vertical) {
    const s = size || Math.min(w * 0.7, (h * 0.86) / chars.length);
    ctx.font = `700 ${s}px ${SIGN_FONT}`;
    chars.forEach((c, i) => ctx.fillText(c, w / 2, h * 0.07 + s * (i + 0.5) + (h * 0.86 - s * chars.length) / 2));
  } else {
    const s = size || Math.min(h * 0.62, (w * 0.86) / Math.max(1, chars.length));
    ctx.font = `700 ${s}px ${SIGN_FONT}`;
    ctx.fillText(text, w / 2, h / 2 + s * 0.04);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  signCache.set(key, texture);
  return texture;
}
export function clearSignCache() {
  for (const t of signCache.values()) t.dispose();
  signCache.clear();
}

// A flat sign mesh facing +z.
export function signMesh(text, width, height, options = {}) {
  const ratio = width / height;
  const vertical = options.vertical ?? false;
  const tex = signTexture(text, { ...options, vertical, w: vertical ? 160 : Math.round(160 * ratio), h: vertical ? Math.round(160 / ratio) : 160 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  mesh.userData.sign = text;
  return mesh;
}
