import * as T from './vendor/three-r164/three.module.min.js';
import { GLTFLoader } from './vendor/three-r164/GLTFLoader.js';
import { mergeGeometries } from './vendor/three-r164/BufferGeometryUtils.js';

const material = (color, options = {}) => new T.MeshStandardMaterial({ color, roughness: 0.88, ...options });
const boxGeo = new T.BoxGeometry();
const leafGeo = new T.IcosahedronGeometry(1, 0);
const bodyGeo = new T.IcosahedronGeometry(1, 1);
const cylinderGeo = new T.CylinderGeometry(1, 1, 1, 10);
const round = new T.Vector3(0, 1, 0);
const balusterGeo = new T.LatheGeometry([
  new T.Vector2(0.9, -0.5), new T.Vector2(0.7, -0.28), new T.Vector2(1, -0.12),
  new T.Vector2(0.47, 0.25), new T.Vector2(0.75, 0.5),
], 6);

function texture(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext('2d'));
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}

function buildKit(random) {
  const plaster = (base, chips, stain) => material('white', { map: texture(256, 256, ctx => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 850; i++) {
      ctx.fillStyle = i % 5 ? stain : chips;
      ctx.globalAlpha = 0.10 + random() * 0.31;
      const x = random() * 256, y = random() * 256, size = 1 + random() ** 3 * 15;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y - size * 0.28);
      ctx.lineTo(x + size * 0.67, y + size * 0.46);
      ctx.lineTo(x - size * 0.22, y + size * 0.61);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const damp = ctx.createLinearGradient(0, 4, 0, 252);
    damp.addColorStop(0, '#37372b32');
    damp.addColorStop(0.24, '#554e3505');
    damp.addColorStop(0.64, '#382a2110');
    damp.addColorStop(1, '#382a2160');
    ctx.fillStyle = damp;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 62; i++) {
      const x = random() * 256, top = random() * 256;
      const length = 6 + random() ** 1.5 * 61;
      const streak = ctx.createLinearGradient(x, top, x, top + length);
      streak.addColorStop(0, '#3c383338');
      streak.addColorStop(1, '#3c383300');
      ctx.fillStyle = streak;
      ctx.fillRect(x, top, 0.75 + random() * 2.25, length);
    }
  }) });
  const fabric = (base, petal, leaf, dots, dense = false) => material('white', {
    side: T.DoubleSide,
    map: texture(128, 192, ctx => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, 128, 192);
      const spacing = dense ? 11 : 22;
      const scale = dense ? 0.66 : 1;
      for (let row = 0; row * spacing < 196; row++) {
        for (let x = (row % 2) * spacing * 0.45; x < 133; x += spacing) {
          const px = x + (random() - 0.5) * spacing * 0.8;
          const py = row * spacing + (random() - 0.5) * spacing * 0.9;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(random() * Math.PI);
          ctx.scale(scale, scale);
          ctx.fillStyle = leaf;
          for (const offset of [-1, 1]) {
            ctx.beginPath();
            ctx.ellipse(offset * 4, offset * 3.5, 5.2, 1.65, offset * 0.61, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = petal;
          const radius = 2.15 + random() * 0.68;
          for (let i = 0; i < 5; i++) {
            const angle = i * Math.PI * 0.4;
            ctx.beginPath();
            ctx.ellipse(Math.cos(angle) * 2.8, Math.sin(angle) * 2.8, radius, radius * 0.72, angle, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = dots;
          ctx.fillRect(-1.1, -1.1, 2.2, 2.2);
          ctx.restore();
        }
      }
    }),
  });
  return {
    walls: [
      plaster('#d7a756', '#edd7aa', '#80664a'),
      plaster('#b98349', '#eed3a0', '#655443'),
      plaster('#d3b987', '#f6dbac', '#8d7657'),
      plaster('#98aaa4', '#d6d4bc', '#5e6961'),
    ],
    trim: material('#e5c793'), iron: material('#535346'), crevice: material('#473124'), timber: material('#734326'),
    darkWood: material('#563221'), sill: material('#b9a187'), glass: material('#243d3b'),
    teal: [material('#275a55'), material('#487269'), material('#35575b')],
    tiles: ['#a14d32', '#b4613b', '#934027', '#c17a50'].map(hex => material(hex)),
    canopyCloth: material('#ffffff', { side: T.DoubleSide, vertexColors: true }),
    wire: material('#372724'), silver: material('#aaa9a1', { roughness: 0.30, metalness: 0.43 }),
    enamel: material('#ddc7a2', { roughness: 0.41 }), basket: material('#b9834e'),
    red: material('#b73a34', { roughness: 0.55 }), blue: material('#254eaa', { roughness: 0.55 }),
    yellow: material('#d2a32d', { roughness: 0.55 }), plasticGreen: material('#429245', { roughness: 0.55 }),
    produce: ['#b94b32', '#e0a43d', '#91a14c', '#4e7348', '#b7ad5e'].map(hex => material(hex)),
    flowers: ['#f4d46d', '#f2d8c6', '#d77695', '#ae819f'].map(hex => material(hex)),
    bread: material('#bf7b3b'), coffee: material('#4c2c20'),
    glaze: material('#768477', { roughness: 0.40 }),
    green: ['#425326', '#698537', '#879a49'].map(hex => material(hex, { side: T.DoubleSide })),
    petals: ['#c32665', '#e75690', '#a92f64'].map(hex => material(hex, { side: T.DoubleSide })),
    bulb: material('#ffe2a4', { emissive: '#ffa74b', emissiveIntensity: 1.6 }),
    machine: material('#362a25'),
    goldFloral: fabric('#c59446', '#f5c66c', '#52674b', '#f9e7be', true),
    fabrics: [
      fabric('#8d254c', '#f5aab2', '#699273', '#ffe7ad', true),
      fabric('#294c80', '#ef9ba8', '#7fa181', '#ffe0aa', true),
      fabric('#d17c4f', '#f2d0a7', '#487d60', '#ee7873', true),
      fabric('#caa891', '#a65873', '#758249', '#ffdfa3', true),
      fabric('#55795d', '#efb46e', '#314e58', '#f2dbac', true),
      fabric('#593a6b', '#eb90b2', '#6f9a79', '#ffd297', true),
    ],
  };
}

function mesh(parent, geometry, surface, x, y, z, sx = 1, sy = 1, sz = 1) {
  const part = new T.Mesh(geometry, surface);
  part.position.set(x, y, z);
  part.scale.set(sx, sy, sz);
  parent.add(part);
  return part;
}
const box = (parent, surface, x, y, z, w, h, d) =>
  mesh(parent, boxGeo, surface, x, y, z, w, h, d);

function rod(parent, surface, a, b, radius) {
  const direction = new T.Vector3(...b).sub(new T.Vector3(...a));
  const part = mesh(parent, cylinderGeo, surface,
    (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, radius, direction.length(), radius);
  part.quaternion.setFromUnitVectors(round, direction.normalize());
  return part;
}

function groupAt(parent, name, x = 0, y = 0, z = 0) {
  const group = new T.Group();
  group.name = name;
  group.position.set(x, y, z);
  parent.add(group);
  return group;
}

function tube(parent, surface, points, radius) {
  const path = new T.CatmullRomCurve3(points.map(point => new T.Vector3(...point)));
  return mesh(parent, new T.TubeGeometry(path, 14, radius, 5, false), surface, 0, 0, 0);
}

function foldedBlade(width, height, fold) {
  const geometry = new T.BufferGeometry();
  const outline = [
    [0, -height * 0.5, 0], [width * 0.46, -height * 0.18, 0],
    [width * 0.42, height * 0.15, 0], [0, height * 0.5, -fold * 0.35],
    [-width * 0.42, height * 0.15, 0], [-width * 0.47, -height * 0.17, 0],
  ];
  geometry.setAttribute('position', new T.Float32BufferAttribute(outline.flatMap((point, i) =>
    [...point, ...outline[(i + 1) % outline.length], 0, height * 0.04, fold]), 3));
  geometry.computeVertexNormals();
  return geometry;
}

const vineLeafGeo = foldedBlade(0.11, 0.17, 0.018);
const bractGeo = foldedBlade(0.082, 0.108, 0.018);

function vine(parent, m, x, y, z, length, bloom, random, samples = 12) {
  const branches = Math.min(bloom ? 10 : 7, samples);
  for (let branch = 0; branch < branches; branch++) {
    const spread = (branch / (branches - 1) - 0.5) * (0.93 + length * 0.23);
    const trailing = length * (0.45 + random() * 0.65);
    const bend = (random() - 0.5) * 0.43;
    const path = (t) => [
      x + spread * (0.26 + 0.74 * t) + Math.sin(t * 3.4 + branch) * t * bend,
      y + Math.sin(t * Math.PI) * 0.20 - trailing * t,
      z + Math.sin(t * Math.PI * 0.77) * 0.34 + t * 0.12,
    ];
    tube(parent, m.darkWood, [path(0), path(0.34), path(0.71), path(1)], 0.0055);
    for (let i = 0; i < samples; i++) {
      const t = (i + random() * 0.6) / samples;
      const [px, py, pz] = path(t);
      const sign = i % 2 ? -1 : 1;
      const leaf = mesh(parent, vineLeafGeo, m.green[(branch + i) % 3],
        px + sign * (0.045 + random() * 0.075), py - random() * 0.055, pz + random() * 0.075);
      leaf.rotation.set((random() - 0.5) * 1.25, (random() - 0.5) * 1.5, sign * (0.49 + random() * 0.96));
      leaf.scale.setScalar(0.62 + random() * 0.64);
      if (!bloom || i < 2 || (branch * 3 + i) % 5 === 0) continue;
      const cx = px - sign * 0.08 + (random() - 0.5) * 0.11;
      const cy = py + (random() - 0.5) * 0.08;
      const cz = pz + 0.085 + random() * 0.075;
      const turn = random() * Math.PI * 2;
      for (let petal = 0; petal < 3; petal++) {
        const a = turn + petal * Math.PI * 2 / 3;
        const bract = mesh(parent, bractGeo, m.petals[(petal + branch) % 3],
          cx - Math.sin(a) * 0.032, cy + Math.cos(a) * 0.032, cz);
        bract.rotation.set((random() - 0.5) * 0.95, (random() - 0.5) * 1.3, a);
        bract.scale.setScalar(0.74 + random() * 0.57);
      }
    }
  }
}
function townhouse(parent, m, { x, width, height, variant }, random) {
  const home = groupAt(parent, 'Townhouse ' + (variant + 1), x);
  const crown = height;
  box(home, m.walls[variant], 0, crown * 0.5, -0.48, width, crown, 1.12);
  box(home, m.crevice, 0, 1.24, 0.10, width - 0.58, 2.45, 0.11);
  for (const side of [-1, 1]) {
    const recess = side * width * 0.37;
    box(home, m.teal[(variant + 1) % 3], recess, 1.13, 0.19, 0.49, 2.11, 0.06);
    for (let panel = 0; panel < 3; panel++) {
      const y = 0.51 + panel * 0.61;
      box(home, m.glass, recess, y, 0.228, 0.34, 0.49, 0.031);
      box(home, m.teal[0], recess, y, 0.25, 0.026, 0.49, 0.023);
    }
  }
  for (const sign of [-1, 1]) {
    box(home, m.trim, sign * (width / 2 - 0.11), crown / 2, 0.13, 0.18, crown, 0.26);
    box(home, m.sill, sign * (width / 2 - 0.15), 0.42, 0.17, 0.26, 0.84, 0.26);
  }
  const windowY = crown - 1.46;
  for (const x of [-width * 0.24, width * 0.24]) {
    box(home, m.trim, x, windowY, 0.144, 1.32, 1.64, 0.22);
    box(home, m.sill, x, windowY + 0.86, 0.24, 1.47, 0.11, 0.31);
    box(home, m.sill, x, windowY - 0.82, 0.23, 1.39, 0.10, 0.35);
    box(home, m.glass, x, windowY, 0.265, 1.14, 1.30, 0.058);
    box(home, m.timber, x, windowY, 0.31, 0.055, 1.32, 0.055);
    box(home, m.timber, x, windowY + 0.19, 0.31, 1.1, 0.055, 0.055);
    for (const side of [-1, 1]) {
      const shutter = groupAt(home, 'Louvered shutters', x + side * 0.49, windowY, 0.34);
      shutter.rotation.y = side * 0.25;
      box(shutter, m.teal[variant % m.teal.length], 0, 0, 0, 0.35, 1.31, 0.09);
      for (let blade = 0; blade < 12; blade++) {
        box(shutter, m.teal[(variant + 1) % 3], 0, -0.57 + blade * 0.098, 0.067, 0.28, 0.038, 0.060)
          .rotation.x = 0.21;
      }
    }
  }
  const deck = windowY - 0.81;
  box(home, m.sill, 0, deck, 0.43, width + 0.08, 0.19, 1.06);
  const railing = variant < 2 ? m.iron : m.sill;
  box(home, railing, 0, deck + 0.58, 0.89, width + 0.07, 0.062, 0.063);
  box(home, railing, 0, deck + 0.14, 0.89, width, 0.039, 0.057);
  const barCount = Math.round(width / 0.108);
  for (let n = 0; n <= barCount; n++) {
    const px = (n / barCount - 0.5) * width;
    if (variant === 1) {
      rod(home, railing, [px, deck + 0.13, 0.89], [px, deck + 0.33, 1.01], 0.012);
      rod(home, railing, [px, deck + 0.33, 1.01], [px, deck + 0.58, 0.89], 0.012);
    } else {
      const radius = variant < 2 ? 0.012 : 0.032;
      const shape = variant < 2 ? cylinderGeo : balusterGeo;
      mesh(home, shape, railing, px, deck + 0.35, 0.89, radius, 0.46, radius);
    }
  }
  for (const side of [-1, 1]) box(home, m.sill, side * width / 2, deck + 0.30, 0.89, 0.095, 0.58, 0.095);
  box(home, m.trim, 0, crown - 0.03, 0.25, width + 0.19, 0.17, 0.56);
  box(home, m.tiles[2], 0, crown + 0.24, 0.26, width + 0.22, 0.085, 1.25).rotation.x = 0.52;
  const tiles = Math.ceil(width / 0.18);
  for (let row = 0; row < 5; row++) for (let i = 0; i < tiles; i++) {
    const u = (i + 0.5) / tiles * width - width / 2;
    const tile = mesh(home, cylinderGeo, m.tiles[(i + row * 3 + variant) % 4], u,
      crown + 0.08 + row * 0.102, 0.67 - row * 0.173, 0.096, 0.225, 0.051);
    tile.rotation.x = 2.10;
  }
  if (variant === 3) {
    const upper = crown + 0.83;
    box(home, m.walls[variant], 0, upper, -0.38, width - 0.45, 1.44, 0.96);
    box(home, m.trim, 0, upper + 0.63, 0.05, width - 0.28, 0.12, 0.30);
    for (const side of [-1, 1]) {
      box(home, m.crevice, side * 0.85, upper, 0.13, 0.59, 1.01, 0.08);
      box(home, m.teal[1], side * 0.85, upper, 0.182, 0.45, 0.93, 0.048);
    }
    box(home, m.teal[0], 0, upper + 0.73, 0.16, width - 0.20, 0.12, 1.28).rotation.x = 0.12;
  }
  if (variant !== 0) {
    const unit = groupAt(home, 'Air conditioner', width * 0.40, windowY - 0.35, 0.41);
    box(unit, m.enamel, 0, 0, 0, 0.63, 0.43, 0.29);
    const fan = mesh(unit, cylinderGeo, m.silver, 0.05, 0, 0.16, 0.155, 0.028, 0.155);
    fan.rotation.x = Math.PI / 2;
    for (let i = 0; i < 8; i++) box(unit, m.crevice, 0.05, -0.12 + i * 0.034, 0.18, 0.27, 0.010, 0.018);
  }
  for (let i = 0; i < 3; i++) {
    const u = (i - 1) * width * 0.33;
    box(home, m.tiles[2], u, deck + 0.24, 0.72, 0.48, 0.23, 0.26);
    vine(home, m, u, deck + 0.50, 0.81, i === 1 && variant === 0 ? 1.85 : 0.62 + random() * 0.64,
      (i + variant) % 3 !== 1, random);
  }
}

function wallFinish(config, style) {
  const palette = [
    [[213, 181, 106], [168, 139, 82], [112, 104, 75]],
    [[194, 180, 138], [152, 148, 114], [98, 108, 89]],
    [[221, 196, 141], [176, 155, 111], [122, 112, 83]],
  ][style];
  const extent = config.height + 0.7;
  const smooth = T.MathUtils.smoothstep;
  const fract = value => value - Math.floor(value);
  function hash(x, y) {
    return fract(Math.sin(x * 127.1 + y * 311.7 + style * 71.4) * 43758.5453);
  }
  function grain(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const u = smooth(x - ix, 0, 1), v = smooth(y - iy, 0, 1);
    const top = T.MathUtils.lerp(hash(ix, iy), hash(ix + 1, iy), u);
    const bottom = T.MathUtils.lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), u);
    return T.MathUtils.lerp(top, bottom, v);
  }
  const map = texture(512, 768, ctx => {
    const image = ctx.createImageData(512, 768);
    for (let row = 0; row < image.height; row++) {
      const y = (1 - row / (image.height - 1)) * extent;
      for (let col = 0; col < image.width; col++) {
        const x = (col / (image.width - 1) - 0.5) * config.width;
        const broad = grain(x * 1.68, y * 1.92);
        const mottling = grain(x * 6.8 + 4, y * 5.2 + 7);
        const grit = grain(x * 49 + 19, y * 52);
        const vertical = grain(x * 12.4, y * 1.16);
        let damp = (1 - smooth(y, 0.10, 0.82)) * (0.27 + broad * 0.38);
        damp += (1 - smooth(config.height - y, 0, 0.61)) * (0.19 + vertical * 0.49);
        damp += smooth(Math.abs(x), config.width * 0.39, config.width * 0.50) * 0.13;
        for (const [, , sill, lintel, windows, span] of config.floors) {
          const ledge = sill - 0.12;
          const shadow = ledge - y + x * 0.07;
          if (shadow >= 0) damp += (1 - smooth(shadow, 0, 0.25)) * 0.32;
          for (const windowX of windows) {
            const fall = sill - y;
            const edge = Math.abs(Math.abs(x - windowX) - span * 0.42);
            if (fall > 0) damp += (1 - smooth(fall, 0.06, 0.80))
              * (1 - smooth(edge, 0.025, 0.15)) * (0.17 + vertical * 0.33);
            if (y < lintel && lintel - y < 0.14 && Math.abs(x - windowX) < span * 0.60) damp += 0.10;
          }
        }
        const chips = broad * 0.56 + mottling * 0.35 + grit * 0.09 + damp * 0.19;
        const peel = smooth(chips, 0.66, 0.80);
        const fine = 0.92 + mottling * 0.12 + grit * 0.075;
        const mortar = fract(y / 0.12) < 0.08
          || fract(x / 0.24 + (Math.floor(y / 0.12) % 2) * 0.5) < 0.055;
        const index = (row * image.width + col) * 4;
        for (let channel = 0; channel < 3; channel++) {
          let tone = T.MathUtils.lerp(palette[0][channel] * fine, palette[1][channel], damp * 0.79);
          tone = T.MathUtils.lerp(tone, palette[2][channel] + (mortar ? 22 : 0), peel * 0.83);
          image.data[index + channel] = tone;
        }
        image.data[index + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  });
  return material('white', { map, bumpMap: map, bumpScale: 0.017, roughness: 0.97 });
}

function plasterPanel(parent, surface, config, x, y, z, width, height, depth) {
  const geometry = boxGeo.clone().scale(width, height, depth).translate(x, y, z);
  const { position, normal, uv } = geometry.attributes;
  for (let i = 0; i < position.count; i++) {
    const wallX = Math.abs(normal.getX(i)) > 0.5
      ? position.getZ(i) + normal.getX(i) * config.width * 0.22
      : position.getX(i);
    uv.setXY(i, wallX / config.width + 0.5, position.getY(i) / (config.height + 0.7));
  }
  mesh(parent, geometry, surface, 0, 0, 0);
}

function facadeBand(panel, config, bottom, top, openings) {
  const { width } = config;
  const front = 0.11, depth = 0.31;
  const wall = (left, right, low, high) => {
    if (right <= left || high <= low) return;
    panel((left + right) / 2, (low + high) / 2, front - depth / 2,
      right - left, high - low, depth);
  };
  let edge = -width / 2;
  for (const { x, span, sill, lintel } of openings) {
    wall(edge, x - span / 2, bottom, top);
    wall(x - span / 2, x + span / 2, bottom, sill);
    wall(x - span / 2, x + span / 2, lintel, top);
    edge = x + span / 2;
  }
  wall(edge, width / 2, bottom, top);
}

function recessedOpening(home, m, opening, shop, photo, photoMaterial) {
  const { x, span, sill, lintel } = opening;
  const middle = (sill + lintel) / 2, height = lintel - sill;
  const reveal = shop ? 0.89 : 0.24;
  box(home, m.crevice, x, middle, 0.08 - reveal, span, height, 0.07);
  for (const side of [-1, 1]) {
    box(home, m.trim, x + side * (span / 2 + 0.018), middle, 0.09 - reveal / 2,
      0.085, height + 0.07, reveal);
  }
  box(home, m.sill, x, sill - 0.04, 0.09 - reveal / 2, span + 0.18, 0.10, reveal + 0.23);
  box(home, m.trim, x, lintel + 0.025, 0.17, span + 0.21, 0.10, 0.20);
  if (shop) {
    if (photo) mesh(home, photo, photoMaterial, x, middle, -0.766, span - 0.12, height - 0.13);
    for (const side of [-1, 1]) {
      const leaf = groupAt(home, 'Open paneled shop door', x + side * (span / 2 - 0.16), middle, -0.06);
      leaf.rotation.y = side * 1.08;
      box(leaf, m.teal[0], 0, 0, 0, 0.35, height - 0.10, 0.067);
      for (const y of [-0.59, 0.02, 0.64]) box(leaf, m.teal[1], 0, y, 0.042, 0.25, 0.41, 0.022);
    }
    return;
  }
  if (photo) mesh(home, photo, photoMaterial, x, middle, -0.085, span - 0.10, height - 0.11);
  else box(home, m.glass, x, middle, -0.10, span - 0.10, height - 0.11, 0.039);
  box(home, m.darkWood, x, middle, -0.069, 0.049, height, 0.035);
  for (const y of [middle - height * 0.20, middle + height * 0.20]) {
    box(home, m.darkWood, x, y, -0.070, span, 0.042, 0.035);
  }
  for (const side of [-1, 1]) {
    const shutter = groupAt(home, 'Open wood shutters', x + side * span * 0.52, middle, 0.11);
    shutter.rotation.y = side * 0.69;
    box(shutter, m.teal[0], side * 0.15, 0, 0, 0.31, height - 0.07, 0.063);
    for (let blade = 0; blade < 9; blade++) {
      box(shutter, m.teal[1], side * 0.15, ((blade + 0.5) / 9 - 0.5) * (height - 0.16),
        0.047, 0.26, 0.031, 0.028).rotation.x = 0.18;
    }
  }
}

function marketBalcony(home, m, width, y, depth, bowed) {
  box(home, m.sill, 0, y, depth / 2, width + 0.07, 0.19, depth);
  box(home, m.trim, 0, y - 0.11, depth + 0.011, width + 0.11, 0.09, 0.10);
  balconyShadow(home, m, width, y - 0.11, 0.116);
  for (const height of [0.18, 0.74]) box(home, m.iron, 0, y + height, depth, width, 0.046, 0.045);
  const bars = Math.ceil(width / 0.15);
  for (let i = 0; i <= bars; i++) {
    const x = (i / bars - 0.5) * width;
    if (bowed) {
      rod(home, m.iron, [x, y + 0.17, depth], [x, y + 0.43, depth + 0.085], 0.012);
      rod(home, m.iron, [x, y + 0.43, depth + 0.085], [x, y + 0.74, depth], 0.012);
    } else {
      box(home, m.iron, x, y + 0.45, depth, 0.024, 0.55, 0.024);
    }
  }
  for (const side of [-1, 1]) {
    box(home, m.iron, side * width / 2, y + 0.74, depth / 2, 0.041, 0.041, depth);
    box(home, m.iron, side * width / 2, y + 0.45, depth, 0.058, 0.60, 0.058);
  }
}

function bougainvilleaCrown(random) {
  const positions = [], colors = [];
  const pose = new T.Object3D(), vertex = new T.Vector3();
  const leaves = ['#394d25', '#61723a', '#829447'].map(color => new T.Color(color));
  const flowers = ['#84123d', '#a7134b', '#bf1a57', '#ce215f', '#de2c6a'].map(color => new T.Color(color));
  const petal = [
    -0.039, -0.032, 0, 0.019, -0.038, 0, 0.041, 0.028, 0,
    -0.039, -0.032, 0, 0.041, 0.028, 0, -0.030, 0.045, -0.009,
  ];
  const blade = vineLeafGeo.attributes.position.array;
  function append(shape, color, x, y, z, scale, angle) {
    pose.position.set(x, y, z);
    pose.rotation.set((random() - 0.5) * 1.55, (random() - 0.5) * 1.9, angle);
    pose.scale.setScalar(scale);
    pose.updateMatrix();
    for (let i = 0; i < shape.length; i += 3) {
      vertex.fromArray(shape, i).applyMatrix4(pose.matrix);
      positions.push(vertex.x, vertex.y, vertex.z);
      colors.push(color.r, color.g, color.b);
    }
  }
  const mounds = [
    [-0.64, 0.50, 0.10, 0.39, 0.34, 0.30],
    [-0.24, 0.66, 0.06, 0.43, 0.36, 0.30],
    [0.26, 0.58, 0.12, 0.43, 0.37, 0.31],
    [0.68, 0.47, 0.10, 0.34, 0.31, 0.27],
    [-0.42, 0.28, 0.30, 0.35, 0.36, 0.25],
    [0.47, 0.25, 0.30, 0.30, 0.47, 0.26],
  ];
  for (const [index, [x, y, z, width, height, depth]] of mounds.entries()) {
    const count = index < 4 ? 35 : 23;
    for (let i = 0; i < count; i++) {
      const vertical = 1 - 2 * (i + 0.5) / count;
      const radius = Math.sqrt(1 - vertical * vertical);
      const spin = i * 2.40 + index;
      const px = x + width * radius * Math.cos(spin) + (random() - 0.5) * 0.08;
      const py = y + height * vertical + (random() - 0.5) * 0.08;
      const pz = z + depth * radius * Math.sin(spin);
      append(blade, leaves[(i + index) % leaves.length], px, py, pz, 0.80 + random() * 0.53, spin);
      if ((i + index) % 6 === 1) continue;
      for (let bract = 0; bract < 3; bract++) {
        const angle = spin + bract * Math.PI * 2 / 3;
        append(petal, flowers[(i * 3 + bract + index) % flowers.length],
          px + 0.042 * Math.cos(angle), py + 0.042 * Math.sin(angle), pz + 0.045,
          0.73 + random() * 0.60, angle);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function balconyPlant(home, m, x, deck, front, bloom, random) {
  const plant = groupAt(home, bloom ? 'Balcony bougainvillea' : 'Balcony potted plant', x, deck, front);
  const clay = m.tiles[bloom ? 1 : 2];
  const potWidth = bloom ? 1.05 : 0.43;
  box(plant, clay, 0, 0.13, -0.11, potWidth, 0.26, 0.32);
  box(plant, clay, 0, 0.25, -0.11, potWidth + 0.04, 0.064, 0.36);
  box(plant, m.crevice, 0, 0.282, -0.11, potWidth - 0.05, 0.012, 0.27);
  if (bloom) {
    for (const side of [-1, 1]) {
      rod(plant, m.darkWood, [side * 0.25, 0.28, -0.11], [side * 0.54, 0.55, 0.08], 0.011);
    }
    mesh(plant, bougainvilleaCrown(random), m.bougainvillea, 0, 0, 0);
    return;
  }
  for (let i = 0; i < 8; i++) {
    const angle = i * 2.4;
    const dx = Math.cos(angle), dz = Math.sin(angle);
    const tip = [dx * 0.17, 0.53 + random() * 0.29, -0.11 + dz * 0.15];
    rod(plant, m.green[0], [0, 0.28, -0.11], tip, 0.006);
    const leaf = mesh(plant, vineLeafGeo, m.green[i % 3], ...tip, 1.45, 1.70, 1);
    leaf.rotation.set(0.73, angle, -0.58);
  }
}

function marketRoof(home, m, x, width, height, metal) {
  const color = metal ? m.teal[0] : m.tiles[2];
  const length = metal ? 1.06 : 1.60;
  const slope = metal ? 0.16 : 0.44;
  const centerZ = metal ? 0.23 : -0.04;
  const roofBand = groupAt(home, 'Pitched roof and eaves', x, height, centerZ);
  roofBand.rotation.x = slope;
  box(roofBand, color, 0, 0, 0, width, 0.085, length);
  const runs = Math.ceil(width / (metal ? 0.11 : 0.17));
  const tiers = metal ? 1 : 4;
  for (let row = 0; row < tiers; row++) for (let i = 0; i < runs; i++) {
    const xpos = (i + 0.5) * width / runs - width / 2;
    const zpos = ((row + 0.5) / tiers - 0.50) * length;
    mesh(roofBand, cylinderGeo, metal ? m.teal[1] : m.tiles[(row + i) % 4],
      xpos, 0.04, zpos, metal ? 0.026 : 0.076, length / tiers + 0.026, metal ? 0.027 : 0.035)
      .rotation.x = Math.PI / 2;
  }
  rod(roofBand, metal ? m.iron : m.darkWood, [-width / 2, -0.035, length / 2],
    [width / 2, -0.035, length / 2], 0.041);
}

function marketWallUnit(home, m, x, y) {
  const ac = groupAt(home, 'Outdoor air conditioning unit', x, y, 0.24);
  box(ac, m.enamel, 0, 0, 0, 0.48, 0.32, 0.26);
  mesh(ac, cylinderGeo, m.iron, -0.07, 0, 0.135, 0.104, 0.025, 0.104).rotation.x = Math.PI / 2;
  for (let i = 0; i < 5; i++) box(ac, m.enamel, -0.07, (i - 2) * 0.033, 0.155, 0.18, 0.010, 0.014);
  tube(home, m.wire, [[x + 0.22, y, 0.34], [x + 0.31, y - 0.25, 0.19],
    [x + 0.32, y - 0.54, 0.14]], 0.013);
}

function rooftopAntenna(home, m, x, roofHeight, z, angle) {
  const antenna = groupAt(home, 'Rooftop TV antenna', x, roofHeight, z);
  antenna.rotation.y = angle;
  rod(antenna, m.iron, [0, 0, 0], [0, 0.89, 0], 0.018);
  rod(antenna, m.iron, [-0.43, 0.78, 0], [0.61, 0.78, 0], 0.012);
  for (const [offset, span] of [[-0.35, 0.52], [-0.15, 0.41], [0.05, 0.36], [0.25, 0.29], [0.45, 0.24]]) {
    rod(antenna, m.iron, [offset, 0.78, -span / 2], [offset, 0.78, span / 2], 0.010);
  }
}

function architecturePrototype(parent, m, x, variant, random, photoStyle) {
  const config = [
    { name: 'Nhà phố hai tầng mái ngói', width: 4.48, height: 5.48, shop: 3.25,
      floors: [[2.93, 5.48, 3.46, 4.96, [-1.04, 0.98], 0.68]] },
    { name: 'Nhà ống ba tầng', width: 3.68, height: 7.33, shop: 2.62,
      floors: [[2.92, 5.12, 3.39, 4.81, [-0.82, 0.78], 0.55],
        [5.12, 7.33, 5.51, 6.83, [-0.74, 0.74], 0.50]] },
    { name: 'Nhà chợ mái tôn lệch', width: 4.55, height: 5.22, shop: 3.57,
      floors: [[2.93, 5.22, 3.46, 4.67, [-1.17, 0.96], 0.76]] },
  ][variant];
  const setback = photoStyle ? -0.85 : 0;
  const home = groupAt(parent, config.name, x, 0, setback - (variant === 1 ? 0.11 : 0));
  const { width, height, floors } = config;
  const surface = photoStyle?.material ?? wallFinish(config, variant);
  const panel = photoStyle
    ? (...dimensions) => plasterBox(home, surface, photoStyle.tint, width, height, ...dimensions)
    : (...dimensions) => plasterPanel(home, surface, config, ...dimensions);
  panel(0, height / 2, -1.03, width, height, 0.24);
  for (const side of [-1, 1]) {
    panel(side * (width / 2 - 0.07), height / 2, -0.52, 0.14, height, 1.02);
  }
  const threshold = { x: variant === 2 ? -0.13 : 0, span: config.shop, sill: 0.14, lintel: 2.32 };
  facadeBand(panel, config, 0, floors[0][0], [threshold]);
  recessedOpening(home, m, threshold, true, photoStyle?.front.shop, surface);
  if (photoStyle) {
    box(home, m.darkWood, threshold.x, 2.60, 0.15, config.shop, 0.41, 0.13);
    mesh(home, photoStyle.front.sign, surface, threshold.x, 2.60, 0.222, config.shop - 0.22, 0.29);
  }
  box(home, m.trim, 0, floors[0][0] - 0.02, 0.13, width + 0.07, 0.12, 0.26);
  for (const [floor, [bottom, top, sill, lintel, xs, span]] of floors.entries()) {
    const openings = xs.map(x => ({ x, span, sill, lintel }));
    facadeBand(panel, config, bottom, top, openings);
    const photoFloor = photoStyle?.front.floors[Math.min(floor, photoStyle.front.floors.length - 1)];
    openings.forEach((opening, i) => recessedOpening(home, m, opening, false, photoFloor?.windows[i], surface));
    const balconyY = sill - 0.12;
    marketBalcony(home, m, variant === 2 ? width * 0.68 : width * 0.84,
      balconyY, variant === 1 ? 0.77 : 0.63, variant === 1);
    const plantX = variant === 0 ? 0.68 : -0.64;
    if (photoStyle) {
      balconyPlant(home, m, plantX, balconyY + 0.095, variant === 1 ? 0.77 : 0.63,
        variant !== 1 || floor === 0, random);
    } else {
      box(home, m.tiles[2], plantX, balconyY + 0.27, 0.44, 0.39, 0.20, 0.24);
      vine(home, m, plantX, balconyY + 0.45, 0.59, floor ? 0.49 : 0.94, variant !== 1 || floor === 0, random);
    }
    if (variant === 1 || variant === 2) marketWallUnit(home, m, width / 2 - 0.39, lintel - 0.36);
  }
  if (variant === 2) {
    panel(-0.94, height + 0.18, -0.31, width * 0.55, 0.43, 0.72);
    marketRoof(home, m, -0.91, width * 0.57, height + 0.45, true);
    marketRoof(home, m, 1.29, width * 0.42, height + 0.03, true);
    marketRoof(home, m, 0, width * 0.98, 3.12, true);
  } else {
    marketRoof(home, m, 0, width + 0.22, height + 0.22, variant === 1);
  }
  if (variant === 1) {
    if (photoStyle) rooftopAntenna(home, m, 0.62, height + 0.30, -0.22, -0.48);
    const z = 0.63;
    tube(home, m.wire, [[-1.11, 6.41, z], [0, 6.31, z], [1.18, 6.42, z]], 0.009);
    for (const [i, surface] of [m.enamel, m.fabrics[1], m.fabrics[3]].entries()) {
      box(home, surface, (i - 1) * 0.56, 6.10 + i % 2 * 0.04, z, 0.30, 0.42, 0.014)
        .rotation.x = -0.09 + i * 0.07;
    }
  }
  const meterX = width / 2 - 0.23;
  box(home, m.iron, meterX, 2.14, 0.18, 0.16, 0.24, 0.10);
  box(home, m.sill, meterX, 2.18, 0.235, 0.11, 0.064, 0.018);
  for (const offset of [0, 0.042]) {
    tube(home, m.wire, [[meterX + offset, 2.23, 0.23], [meterX + offset, 2.68, 0.18],
      [meterX - 0.08 + offset, 2.98, 0.18], [meterX - 0.49, 3.17 + offset, 0.17]], 0.009);
  }
}

const awningStyles = {
  blue: { colors: ['#4b7994', '#587f96'], strips: 12, drop: t => t },
  stripe: { colors: ['#60899d', '#dfd5ba'], strips: 16, drop: t => t + 0.15 * Math.sin(Math.PI * t) },
  green: { colors: ['#56857b', '#d5ceb1'], strips: 14, drop: t => t },
  sand: { colors: ['#a48b61', '#d8c6a3'], strips: 12, drop: t => 1 - Math.cos(Math.PI * t / 2) },
};

function awning(parent, m, width, style) {
  const { colors, strips, drop } = awningStyles[style];
  const palette = colors.map(color => new T.Color(color));
  const positions = [], colorsByVertex = [], indices = [];
  const segments = 8;
  const rear = 0.35, front = 2.18, top = 3.03, edge = 2.39;
  for (let strip = 0; strip < strips; strip++) {
    const first = positions.length / 3;
    const { r, g, b } = palette[strip % palette.length];
    for (let row = 0; row <= segments + 1; row++) {
      const hem = row > segments;
      const t = Math.min(1, row / segments);
      for (let side = 0; side < 2; side++) {
        const x = ((strip + side) / strips - 0.5) * width;
        const y = T.MathUtils.lerp(top, edge, drop(t)) - (hem ? 0.12 : 0);
        const z = T.MathUtils.lerp(rear, front, t) + (hem ? 0.018 : 0);
        positions.push(x, y, z);
        const wear = (hem ? 0.81 : 0.95) + 0.035 * Math.sin(5.2 * x + 9.1 * z);
        colorsByVertex.push(r * wear, g * wear, b * wear);
      }
      if (row > 0) {
        const a = first + (row - 1) * 2;
        indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colorsByVertex, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  mesh(parent, geometry, m.canopyCloth, 0, 0, 0);

  rod(parent, m.iron, [-width / 2, top - 0.022, rear], [width / 2, top - 0.022, rear], 0.023);
  rod(parent, m.iron, [-width / 2, edge - 0.026, front], [width / 2, edge - 0.026, front], 0.026);
  for (const side of [-1, 1]) {
    const x = side * (width / 2 - 0.075);
    rod(parent, m.iron, [x, 0.03, front - 0.08], [x, edge - 0.026, front], 0.033);
    rod(parent, m.iron, [x, 2.03, front - 0.08], [x, edge - 0.026, front - 0.70], 0.021);
  }
}

const signStyles = [
  { background: '#244d77', lettering: '#f7e8bc', line: '#adbbbe' },
  { background: '#dcad54', lettering: '#552d20', line: '#9c542d' },
  { background: '#59382e', lettering: '#f3d895', line: '#b77c50' },
  { background: '#33594d', lettering: '#efe1b9', line: '#93a286' },
];

function fascia(parent, m, name, subtitle, emblem, ink = '#234558') {
  if (m.useFacadeSigns) return;
  const width = 3.64, height = 0.42, y = 2.65, z = 0.48;
  const styleIndex = name === 'Bếp Than' ? 1 : emblem.charCodeAt(0) % signStyles.length;
  const { background, lettering, line } = signStyles[styleIndex];
  const face = texture(768, 104, ctx => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 768, 104);
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    ctx.strokeRect(7, 7, 754, 90);
    ctx.textAlign = 'center';
    ctx.font = styleIndex === 2 ? 'bold 52px Georgia, serif' : '900 54px "Arial Narrow", sans-serif';
    ctx.fillStyle = ink;
    ctx.fillText(name.toLocaleUpperCase('vi-VN'), 386, 58, 698);
    ctx.fillStyle = lettering;
    ctx.fillText(name.toLocaleUpperCase('vi-VN'), 384, 56, 698);
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText(subtitle, 384, 87, 680);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#e7d7ac';
    for (let i = 0; i < 110; i++) {
      ctx.fillRect((i * 193 + 19) % 768, (i * 67 + 11) % 104, 1 + i % 4, 1);
    }
  });
  box(parent, m.darkWood, 0, y, z - 0.038, width + 0.06, height + 0.045, 0.075);
  mesh(parent, new T.PlaneGeometry(width, height), new T.MeshBasicMaterial({ map: face, toneMapped: false }),
    0, y, z + 0.013);
}

function vietnamFlag() {
  const map = texture(192, 128, ctx => {
    ctx.fillStyle = '#c32a23';
    ctx.fillRect(0, 0, 192, 128);
    ctx.fillStyle = '#f4cd4a';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = i * Math.PI / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? 32 : 12.2;
      const x = 96 + radius * Math.cos(angle), y = 64 + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  });
  const geometry = new T.PlaneGeometry(1, 1, 10, 4);
  const { position, uv } = geometry.attributes;
  for (let i = 0; i < uv.count; i++) {
    const along = uv.getX(i), hanging = 1 - uv.getY(i);
    position.setXYZ(i, 0.12 + along * 0.72, 0.08 + along * 0.31 - hanging * 0.48,
      Math.sin((along * 1.4 + hanging * 0.45) * Math.PI * 2) * 0.055 * Math.sin(Math.PI * along));
  }
  geometry.computeVertexNormals();
  return { geometry, surface: material('#ffffff', { map, side: T.DoubleSide }) };
}

function hangVietnamFlag(home, m, x, y, angle) {
  const mount = groupAt(home, 'Vietnam flag', x, y, 0.13);
  mount.rotation.y = angle;
  rod(mount, m.iron, [-0.12, -0.025, 0], [0.92, 0.425, 0], 0.015);
  mesh(mount, m.flag.geometry, m.flag.surface, 0, 0, 0.012);
}

function hangFlagBunting(home, m, width, railHeight, railFront) {
  const cord = groupAt(home, 'Vietnam flag bunting', 0, railHeight, railFront);
  const sag = t => -0.22 * 4 * t * (1 - t);
  tube(cord, m.iron, [0, 0.25, 0.5, 0.75, 1].map(t => [(t - 0.5) * width, sag(t), 0]), 0.008);
  const flag = new T.PlaneGeometry(0.21, 0.14);
  for (let i = 0; i < 11; i++) {
    const t = (i + 0.5) / 11;
    const pennant = mesh(cord, flag, m.flag.surface, (t - 0.5) * width, sag(t) - 0.07, 0.012);
    pennant.rotation.z = (t - 0.5) * 0.40;
    pennant.rotation.y = 0.18 * Math.sin(i * 2.3);
  }
}

function rollingShutter(parent, m, width) {
  const steel = material('#756f61');
  const ridge = material('#918673');
  const height = 2.22, depth = 0.37;
  box(parent, steel, 0, 0.12 + height / 2, depth, width, height, 0.075);
  for (let i = 0; i < 25; i++) {
    const y = 0.16 + i * 0.087;
    box(parent, ridge, 0, y, depth + 0.051, width - 0.10, 0.040, 0.027);
  }
  for (const side of [-1, 1]) {
    box(parent, m.iron, side * width / 2, 1.25, depth + 0.043, 0.095, 2.29, 0.13);
  }
  box(parent, m.iron, 0, 2.41, depth + 0.018, width + 0.12, 0.19, 0.23);
  box(parent, m.iron, 0, 0.18, depth + 0.081, 0.16, 0.045, 0.04);
}

function bulb(parent, m, x, previousY, z) {
  const y = previousY - 0.16;
  rod(parent, m.wire, [x, y + 0.09, z], [x, y + 0.46, z - 0.23], 0.012);
  box(parent, m.darkWood, x, y + 0.065, z, 0.085, 0.09, 0.082);
  mesh(parent, bodyGeo, m.bulb, x, y - 0.015, z, 0.057, 0.085, 0.057);
  const cap = new T.ConeGeometry(0.13, 0.065, 10, 1, true);
  mesh(parent, cap, m.basket, x, y + 0.10, z);
}

function plasticSeatGeometry() {
  const shape = new T.Shape();
  shape.moveTo(-0.17, -0.15);
  shape.quadraticCurveTo(-0.19, -0.15, -0.19, -0.12);
  shape.lineTo(-0.19, 0.12);
  shape.quadraticCurveTo(-0.19, 0.15, -0.16, 0.15);
  shape.lineTo(0.16, 0.15);
  shape.quadraticCurveTo(0.19, 0.15, 0.19, 0.12);
  shape.lineTo(0.19, -0.12);
  shape.quadraticCurveTo(0.19, -0.15, 0.17, -0.15);
  shape.closePath();
  const hole = new T.Path();
  hole.absellipse(0, 0, 0.027, 0.014, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return new T.ExtrudeGeometry(shape, {
    depth: 0.028, bevelThickness: 0.008, bevelSize: 0.009, bevelSegments: 1, curveSegments: 5,
  }).rotateX(-Math.PI / 2);
}
const plasticSeat = plasticSeatGeometry();
const chairBack = new T.TubeGeometry(new T.CatmullRomCurve3([
  new T.Vector3(-0.156, 0.36, -0.138), new T.Vector3(-0.156, 0.58, -0.163),
  new T.Vector3(-0.10, 0.73, -0.183), new T.Vector3(0, 0.78, -0.188),
  new T.Vector3(0.1, 0.73, -0.183), new T.Vector3(0.156, 0.58, -0.163),
  new T.Vector3(0.156, 0.36, -0.138),
]), 15, 0.025, 5, false);

function stool(parent, m, x, z, surface, { back = false, turn = 0 } = {}) {
  const seat = groupAt(parent, back ? 'Molded plastic chair' : 'Stackable plastic stool', x, 0, z);
  seat.rotation.y = turn;
  const top = back ? 0.41 : 0.31;
  mesh(seat, plasticSeat, surface, 0, top, 0);
  for (const u of [-1, 1]) for (const v of [-1, 1]) {
    const leg = box(seat, surface, u * 0.155, top * 0.52, v * 0.122, 0.042, top + 0.012, 0.047);
    leg.rotation.z = u * 0.12;
    leg.rotation.x = -v * 0.12;
  }
  for (const s of [-1, 1]) box(seat, surface, 0, top * 0.35, s * 0.133, 0.34, 0.032, 0.028);
  if (back) {
    mesh(seat, chairBack, surface, 0, 0, 0);
    for (const x of [-0.081, 0, 0.081]) {
      rod(seat, surface, [x, 0.40, -0.137], [x * 0.67, 0.72, -0.175], 0.012);
    }
  }
}

function table(parent, m, x, z, width) {
  box(parent, m.timber, x, 0.72, z, width, 0.085, 0.65);
  box(parent, m.darkWood, x, 0.63, z, width - 0.12, 0.10, 0.54);
  for (const u of [-1, 1]) for (const v of [-1, 1]) {
    box(parent, m.timber, x + u * (width / 2 - 0.12), 0.34, z + v * 0.24, 0.08, 0.68, 0.08);
  }
}

function container(parent, m, x, y, z, r, h, surface, kind) {
  const pottery = new T.LatheGeometry([
    new T.Vector2(0, 0), new T.Vector2(r * 0.76, 0), new T.Vector2(r, h * 0.28),
    new T.Vector2(r * 0.97, h), new T.Vector2(r * 0.85, h),
    new T.Vector2(r * 0.78, h * 0.16), new T.Vector2(0, h * 0.16),
  ], 12);
  mesh(parent, pottery, surface, x, y, z);
  if (kind === 'basket') {
    for (let i = 0; i < 4; i++) {
      const ring = new T.TorusGeometry(r * (0.88 + i * 0.035), 0.012, 4, 12);
      mesh(parent, ring, m.timber, x, y + h * (0.21 + i * 0.19), z).rotation.x = Math.PI / 2;
    }
    return;
  }
  if (kind === 'pot' || kind === 'pan') {
    const lidY = y + h + (kind === 'pan' ? 0.025 : 0.035);
    const lid = new T.LatheGeometry([
      [0, 0.062], [0.20, 0.060], [0.48, 0.047], [0.79, 0.029],
      [1.03, 0.006], [1.05, -0.009], [0.98, -0.015],
    ].reverse().map(([width, rise]) => new T.Vector2(width * r, rise)), 12);
    mesh(parent, lid, surface, x, lidY, z);
    if (kind === 'pot' && h / r > 1.05) {
      tube(parent, surface, [[x - r * 0.43, lidY + 0.048, z], [x - r * 0.27, lidY + 0.106, z],
        [x + r * 0.27, lidY + 0.106, z], [x + r * 0.43, lidY + 0.048, z]], 0.019);
      for (const side of [-1, 1]) {
        tube(parent, surface, [[x + side * r * 0.99, y + h * 0.78, z - r * 0.36],
          [x + side * r * 1.28, y + h * 0.77, z - r * 0.26],
          [x + side * r * 1.28, y + h * 0.77, z + r * 0.26],
          [x + side * r * 0.99, y + h * 0.78, z + r * 0.36]], 0.018);
      }
    } else {
      mesh(parent, bodyGeo, m.darkWood, x, lidY + 0.071, z, 0.041, 0.021, 0.041);
      if (kind === 'pan') {
        rod(parent, surface, [x + r * 0.86, y + h * 0.67, z], [x + r * 1.38, y + h * 0.74, z], 0.018);
        rod(parent, m.darkWood, [x + r * 1.31, y + h * 0.73, z], [x + r * 2.13, y + h * 0.86, z], 0.027);
      }
    }
  } else if (kind === 'kettle') {
    tube(parent, m.darkWood, [[x - r * .65, y + h, z], [x, y + h + r, z], [x + r * .65, y + h, z]], 0.022);
    rod(parent, surface, [x + r * 0.82, y + 0.08, z], [x + r * 1.51, y + h * 0.89, z], r * 0.19);
  }
}

function crate(parent, x, z, surface) {
  box(parent, surface, x, 0.10, z, 0.49, 0.12, 0.36);
  for (const u of [-1, 1]) for (const v of [-1, 1]) {
    box(parent, surface, x + u * 0.234, 0.22, z + v * 0.166, 0.045, 0.26, 0.045);
  }
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    box(parent, surface, x, 0.17 + i * 0.068, z + side * 0.165, 0.48, 0.031, 0.032);
    box(parent, surface, x + side * 0.23, 0.17 + i * 0.068, z, 0.032, 0.031, 0.35);
  }
}

function dressGeometry() {
  const rings = [
    [0, 0.105, 0.078], [-0.058, 0.205, 0.092], [-0.16, 0.21, 0.13],
    [-0.30, 0.174, 0.108], [-0.43, 0.141, 0.089], [-0.57, 0.191, 0.118],
    [-0.79, 0.226, 0.143], [-1.04, 0.27, 0.154], [-1.29, 0.298, 0.174],
  ];
  const segments = 20, coordinates = [], uvs = [], indices = [];
  rings.forEach(([y, width, depth], row) => {
    for (let i = 0; i <= segments; i++) {
      const u = i / segments, angle = u * Math.PI * 2;
      const swing = Math.max(0, (row - 4) / 4);
      const pleat = 1 + Math.cos(angle * 7 + 0.17 * row) * 0.102 * swing;
      const hem = row === rings.length - 1 ? Math.sin(angle * 5) * 0.031 : 0;
      coordinates.push(Math.sin(angle) * width * pleat, y + hem, Math.cos(angle) * depth * pleat);
      uvs.push(u, 1 + y / 1.33);
      if (row && i) {
        const current = row * (segments + 1) + i;
        const upper = current - segments - 1;
        indices.push(upper - 1, current - 1, current, upper - 1, current, upper);
      }
    }
  });
  const geometry = new T.BufferGeometry().setIndex(indices);
  geometry.setAttribute('position', new T.Float32BufferAttribute(coordinates, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

const dressGeo = dressGeometry();
const sleeveGeo = new T.CylinderGeometry(0.113, 0.078, 0.22, 9, 2, true);

function garment(parent, surface, x, y, z, scale, turn) {
  const dress = groupAt(parent, 'Short-sleeve floral midi dress', x, y, z);
  dress.rotation.y = turn;
  dress.scale.setScalar(scale);
  mesh(dress, dressGeo, surface, 0, 0, 0);
  for (const side of [-1, 1]) {
    mesh(dress, sleeveGeo, surface, side * 0.228, -0.175, 0.007, 0.93, 1, 0.85)
      .rotation.z = side * 0.67;
  }
}

function foldingGate(parent, m, x, width) {
  const gate = groupAt(parent, 'Folding metal shop gate', x, 0, 0.46);
  const bars = Math.round(width / 0.19);
  for (let i = 0; i <= bars; i++) {
    const u = (i / bars - 0.5) * width;
    box(gate, m.iron, u, 1.16, 0, 0.024, 2.25, 0.026);
    if (i === bars) continue;
    for (const y of [0.54, 1.04, 1.57, 2.05]) {
      const next = u + width / bars;
      rod(gate, m.sill, [u, y - 0.15, 0.024], [next, y + 0.15, 0.024], 0.012);
      rod(gate, m.sill, [u, y + 0.15, 0.024], [next, y - 0.15, 0.024], 0.012);
    }
  }
  box(gate, m.iron, 0, 2.27, 0, width + 0.08, 0.075, 0.075);
}

function fabricStall(parent, m, x) {
  const stall = groupAt(parent, 'Fabric and tailoring stall', x);
  awning(stall, m, 4.6, 'stripe');
  fascia(stall, m, 'Tơ Mộc', 'VẢI HOA · MAY THEO SỐ ĐO', 'T');
  rod(stall, m.timber, [-2.12, 2.27, 0.71], [2.10, 2.27, 0.71], 0.035);
  for (let i = 0; i < 8; i++) garment(stall, m.fabrics[i % 6], -1.95 + i * 0.55,
    2.23 - (i % 3) * 0.032, 0.78 + (i % 2) * 0.10, 0.89 + i % 3 * 0.035, 0.10 - (i % 4) * 0.08);
  table(stall, m, 0.69, 1.54, 1.88);
  box(stall, m.machine, 0.82, 0.78, 1.49, 0.46, 0.052, 0.28);
  box(stall, m.machine, 0.99, 0.89, 1.49, 0.12, 0.24, 0.16);
  box(stall, m.machine, 0.82, 1.00, 1.49, 0.44, 0.10, 0.15);
  rod(stall, m.silver, [0.65, 0.98, 1.49], [0.65, 0.83, 1.49], 0.013);
  for (let stack = 0; stack < 4; stack++) for (let i = 0; i < 4; i++) {
    const cloth = box(stall, m.fabrics[(stack + i) % 6], 0.02 + stack * 0.36,
      0.28 + i * 0.056, 2.04, 0.34, 0.055, 0.28);
    cloth.rotation.y = 0.08 * (i - 1);
  }
  box(stall, m.timber, -1.40, 0.22, 1.91, 1.41, 0.10, 0.53);
  for (let i = 0; i < 9; i++) {
    const roll = mesh(stall, cylinderGeo, m.fabrics[i % 6], -2 + i * 0.155, 0.71 + (i % 3) * 0.048,
      1.90 + (i % 2) * 0.12, 0.077, 0.90, 0.077);
    roll.rotation.z = 0.025 * (i - 4);
    mesh(stall, cylinderGeo, m.basket, roll.position.x - (i - 4) * 0.011, roll.position.y + 0.452,
      roll.position.z, 0.032, 0.012, 0.032);
  }
  garment(stall, m.goldFloral, 1.90, 2.04, 1.86, 1.22, -0.21);
  rod(stall, m.timber, [1.90, 0.07, 1.86], [1.90, 2.07, 1.79], 0.034);
  container(stall, m, 1.72, 0.04, 2.19, 0.23, 0.28, m.basket, 'basket');
  bulb(stall, m, -1.77, 2.35, 1.83);
  bulb(stall, m, 1.46, 2.37, 1.80);
}

function householdStall(parent, m, x) {
  const stall = groupAt(parent, 'Housewares stall', x);
  awning(stall, m, 4.3, 'blue');
  fascia(stall, m, 'Nhà Bếp', 'NỒI, CHẢO VÀ ĐỒ GIA DỤNG', 'B', '#603e31');
  for (const x of [-1.85, 0, 1.85]) box(stall, m.darkWood, x, 1.17, 0.67, 0.10, 2.33, 0.65);
  for (let row = 0; row < 4; row++) {
    const y = 0.32 + row * 0.49;
    box(stall, m.timber, 0, y - 0.052, 0.72, 3.82, 0.085, 0.67);
    for (let i = 0; i < 8; i++) {
      const x = (i - 3.5) * 0.46, radius = 0.12 + ((i + row * 2) % 4) * 0.018;
      const kind = (i + row) % 3;
      container(stall, m, x, y, 0.79 + (i % 2) * 0.12, radius,
        kind === 0 ? 0.09 : 0.18 + ((i + row) % 2) * 0.045,
        kind === 0 ? m.enamel : m.silver, kind === 1 ? 'kettle' : kind === 2 ? 'pot' : 'bowl');
    }
  }
  table(stall, m, -0.39, 1.69, 1.94);
  container(stall, m, -0.92, 0.77, 1.73, 0.25, 0.30, m.silver, 'pot');
  container(stall, m, -0.35, 0.77, 1.73, 0.16, 0.24, m.silver, 'kettle');
  container(stall, m, 0.12, 0.77, 1.62, 0.16, 0.105, m.silver, 'pan');
  for (let i = 0; i < 4; i++) rod(stall, m.timber, [0.17 + 0.025 * i, 0.82, 1.63],
    [0.26 + 0.025 * i, 0.88, 1.75], 0.009);
  stool(stall, m, 0.83, 2.11, m.red);
  stool(stall, m, 1.32, 2.20, m.blue);
  crate(stall, -1.56, 2.12, m.red);
  crate(stall, -2.05, 2.15, m.yellow);
  crate(stall, -1.77, 2.60, m.blue);
  container(stall, m, 1.76, 0.04, 1.78, 0.23, 0.35, m.basket, 'basket');
  bulb(stall, m, -1.43, 2.33, 1.84);
  bulb(stall, m, 0.54, 2.34, 1.81);
  const fan = groupAt(stall, 'Counter fan', 1.62, 0.72, 1.39);
  box(fan, m.teal[1], 0, -0.37, 0, 0.32, 0.08, 0.27);
  rod(fan, m.teal[1], [0, -0.37, 0], [0, 0, 0], 0.038);
  for (let i = 1; i < 4; i++) mesh(fan, new T.TorusGeometry(i * 0.079, 0.009, 4, 20),
    m.teal[1], 0, 0, 0.072);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    rod(fan, m.teal[1], [0, 0, 0.074], [Math.cos(a) * 0.237, Math.sin(a) * 0.237, 0.074], 0.007);
  }
}

function stallFrame(parent, m, x, name, subtitle, emblem, canopy, ink) {
  const stall = groupAt(parent, name, x);
  awning(stall, m, 4.30, canopy);
  fascia(stall, m, name, subtitle, emblem, ink);
  bulb(stall, m, -1.42, 2.31, 1.85);
  bulb(stall, m, 1.36, 2.33, 1.82);
  return stall;
}

function produceStall(parent, m, x, fruit, random, second = false) {
  const stall = fruit
    ? stallFrame(parent, m, x, second ? 'Vị Vườn' : 'Quả Quê', 'TRÁI CÂY THEO MÙA', second ? 'V' : 'Q', second ? 'blue' : 'sand', '#843d2b')
    : stallFrame(parent, m, x, second ? 'Rau Sớm' : 'Vườn Nhà', 'RAU XANH · CỦ QUẢ', second ? 'R' : 'V', second ? 'sand' : 'stripe', '#36563b');
  for (const side of [-1, 1]) table(stall, m, side * 0.99, 1.53, 1.83);
  for (let basket = 0; basket < 8; basket++) {
    const u = (basket % 4 - 1.5) * 0.88, z = 1.29 + Math.floor(basket / 4) * 0.47;
    const r = 0.29 + random() * 0.055;
    container(stall, m, u, 0.76, z, r, 0.15, m.basket, 'basket');
    for (let item = 0; item < 16; item++) {
      const radius = Math.sqrt(random()) * r * 0.80, angle = random() * Math.PI * 2;
      const y = 0.91 + (1 - radius / r) * 0.11;
      const style = fruit ? (basket + Number(second) + (item % 7 === 0 ? 1 : 0)) % 3 : 2 + (basket + Number(second)) % 3;
      const size = 0.053 + random() * 0.045;
      mesh(stall, leafGeo, m.produce[style], u + Math.cos(angle) * radius,
        y, z + Math.sin(angle) * radius, size, fruit ? size * 0.94 : size * 1.38, size);
    }
  }
  for (let i = 0; i < 4; i++) {
    crate(stall, (i - 1.5) * 0.58, 2.32, [m.red, m.blue, m.yellow, m.plasticGreen][i]);
  }
  if (fruit) {
    for (let bunch = 0; bunch < 7; bunch++) {
      const u = (bunch - 3) * 0.46;
      rod(stall, m.wire, [u, 2.28, 1.06], [u, 1.86, 1.12], 0.009);
      for (let finger = 0; finger < 6; finger++) {
        const part = mesh(stall, bodyGeo, m.produce[1], u + (finger % 3 - 1) * 0.07,
          1.76 - Math.floor(finger / 3) * 0.085, 1.10 + (finger % 2) * 0.052, 0.039, 0.113, 0.05);
        part.rotation.z = (finger % 3 - 1) * 0.32;
      }
    }
  } else {
    for (let i = 0; i < 5; i++) container(stall, m, (i - 2) * 0.66,
      0.08, 0.56, 0.25, 0.29, m.basket, 'basket');
  }
}

function bouquet(stall, m, x, y, z, size, kind, random) {
  container(stall, m, x, y, z, 0.13 * size, 0.30 * size, kind % 2 ? m.glaze : m.silver, 'bowl');
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, spread = (i ? 0.10 + random() * 0.09 : 0) * size;
    const end = [x + Math.cos(a) * spread, y + (0.52 + random() * 0.24) * size, z + Math.sin(a) * spread];
    rod(stall, m.green[1], [x, y + 0.20 * size, z], end, 0.011 * size);
    const head = groupAt(stall, 'Flower head', ...end);
    head.rotation.set((random() - 0.5) * 0.7, (random() - 0.5) * 0.8, random() * 3);
    const petals = kind === 0 ? 9 : 5;
    for (let j = 0; j < petals; j++) {
      const angle = j / petals * Math.PI * 2;
      const petal = mesh(head, leafGeo, m.flowers[kind], Math.cos(angle) * 0.049 * size,
        Math.sin(angle) * 0.049 * size, 0, 0.048 * size, 0.024 * size, 0.023 * size);
      petal.rotation.z = angle;
    }
    mesh(head, leafGeo, kind === 0 ? m.coffee : m.produce[1], 0, 0, 0.027 * size,
      0.036 * size, 0.036 * size, 0.023 * size);
  }
}

function flowerStall(parent, m, x, random, second = false) {
  const stall = second
    ? stallFrame(parent, m, x, 'Hương Mùa', 'HOA CẮM BÌNH', 'M', 'green', '#4b6044')
    : stallFrame(parent, m, x, 'Nhành Hoa', 'HOA TƯƠI · BÓ THEO MÙA', 'H', 'stripe', '#635061');
  table(stall, m, 0, 1.02, 3.53);
  for (const x of [-1.27, 1.34]) {
    box(stall, m.timber, x, 1.43, 0.50, 0.99, 0.055, 0.46);
    bouquet(stall, m, x, 1.46, 0.55, 0.81, second ? 1 : 3, random);
  }
  for (let i = 0; i < 9; i++) {
    bouquet(stall, m, (i - 4) * 0.43, 0.77, 1.04, 0.83 + random() * 0.22, (i + Number(second)) % 4, random);
  }
  for (let i = 0; i < 8; i++) {
    const u = (i - 3.5) * 0.48;
    if (i % 3 === 0) stool(stall, m, u, 2.04, m.blue);
    bouquet(stall, m, u, i % 3 === 0 ? 0.32 : 0.07, 2.06 - (i % 2) * 0.21,
      0.90 + random() * 0.24, (i * 3 + 2) % 4, random);
  }
}

function cups(parent, m, x, y, z) {
  container(parent, m, x, y, z, 0.071, 0.105, m.enamel, 'bowl');
  mesh(parent, cylinderGeo, m.coffee, x, y + 0.085, z, 0.053, 0.009, 0.053);
  const handle = new T.TorusGeometry(0.033, 0.009, 4, 9);
  mesh(parent, handle, m.enamel, x + 0.074, y + 0.056, z);
}

function cafeStall(parent, m, x, tea = false) {
  const stall = tea
    ? stallFrame(parent, m, x, 'Tiệm Trà', 'TRÀ SEN · TRÀ ĐÁ', 'T', 'blue', '#325448')
    : stallFrame(parent, m, x, 'Ga Nhỏ', 'CÀ PHÊ · BẠC XỈU', 'G', 'sand', '#463930');
  for (const y of [1.51, 1.88]) {
    box(stall, m.darkWood, 0.63, y, 0.39, 1.8, 0.062, 0.38);
    for (let i = 0; i < 6; i++) {
      const u = (i - 2.5) * 0.26 + 0.63;
      if (i % 2) cups(stall, m, u, y + 0.031, 0.43);
      else container(stall, m, u, y + 0.031, 0.39, 0.075, 0.13, tea ? m.glaze : m.basket, 'pot');
    }
  }
  box(stall, m.timber, 0, 0.61, 0.86, 3.7, 1.16, 0.73);
  box(stall, m.sill, 0, 1.20, 0.91, 3.8, 0.10, 0.88);
  for (let i = 0; i < 19; i++) box(stall, m.darkWood, (i - 9) * 0.19, 0.62, 1.23, 0.027, 1.10, 0.029);
  if (tea) {
    for (const u of [-1.40, -0.89, -0.39]) container(stall, m, u, 1.25, 0.91, 0.16, 0.25, m.glaze, 'kettle');
  } else {
    box(stall, m.silver, -1.01, 1.47, 0.88, 0.77, 0.47, 0.44);
    box(stall, m.darkWood, -1.01, 1.48, 1.12, 0.59, 0.27, 0.07);
    for (const u of [-1.16, -0.91]) rod(stall, m.silver, [u, 1.52, 1.17], [u, 1.36, 1.20], 0.022);
  }
  for (let i = 0; i < 6; i++) cups(stall, m, 0.21 + i * 0.21, 1.25, i % 2 ? 1.12 : 0.84);
  for (const side of [-1, 1]) {
    const u = side * 0.91;
    table(stall, m, u, 2.08, 0.83);
    cups(stall, m, u - 0.15, 0.77, 2.10);
    cups(stall, m, u + 0.16, 0.77, 2.00);
    stool(stall, m, u + side * 0.70, 2.14, side < 0 ? m.blue : m.red, { back: true, turn: -side * 0.88 });
    stool(stall, m, u - side * 0.49, 2.47, side < 0 ? m.plasticGreen : m.yellow);
  }
}

function banhMiCart(street, m, x) {
  const stall = groupAt(street, 'Xe đẩy bánh mì', x);
  const cart = groupAt(stall, 'Xe bánh mì inox', -0.12, 0.085, 1.26);
  cart.scale.x = 0.78;
  cart.rotation.y = -0.08;
  const metal = material('#a9aba7', { roughness: 0.34, metalness: 0.42 });
  const tin = material('#b0aca0', { roughness: 0.58, metalness: 0.32 });
  const rubber = material('#33312b');
  const glass = new T.MeshBasicMaterial({ color: '#b6d6cd', transparent: true, opacity: 0.11,
    depthWrite: false, side: T.DoubleSide });
  box(cart, metal, 0, 0.21, 0, 2.04, 0.10, 0.83);
  box(cart, tin, 0, 0.56, 0, 1.98, 0.66, 0.78);
  box(cart, metal, 0, 0.91, 0, 2.10, 0.062, 0.86);
  box(cart, metal, 0, 2.03, 0, 2.13, 0.055, 0.91);
  box(cart, tin, 0, 1.87, 0.399, 2.01, 0.25, 0.065);
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      box(cart, metal, side * 0.985, 1.44, end * 0.395, 0.049, 1.03, 0.049);
      box(cart, metal, side * 0.79, 0.126, end * 0.31, 0.07, 0.12, 0.062);
      mesh(cart, cylinderGeo, rubber, side * 0.79, 0.093, end * 0.31, 0.093, 0.058, 0.093)
        .rotation.x = Math.PI / 2;
      mesh(cart, cylinderGeo, metal, side * 0.79, 0.093, end * 0.31 + 0.033, 0.042, 0.012, 0.042)
        .rotation.x = Math.PI / 2;
      const axleX = side * 0.79, axleZ = end * 0.31 + 0.042;
      const rim = new T.TorusGeometry(0.070, 0.008, 4, 14);
      mesh(cart, rim, metal, axleX, 0.093, axleZ);
      for (let spoke = 0; spoke < 6; spoke++) {
        const angle = spoke * Math.PI / 3;
        rod(cart, metal, [axleX, 0.093, axleZ],
          [axleX + 0.067 * Math.cos(angle), 0.093 + 0.067 * Math.sin(angle), axleZ], 0.005);
      }
    }
    const pane = mesh(cart, new T.PlaneGeometry(0.76, 0.90), glass, side * 0.978, 1.38, 0);
    pane.rotation.y = side * Math.PI / 2;
  }
  mesh(cart, new T.PlaneGeometry(1.91, 0.90), glass, 0, 1.37, 0.40);
  box(cart, metal, 0, 1.27, 0.397, 1.92, 0.026, 0.02);
  box(cart, metal, 1.22, 0.88, 0.065, 0.42, 0.046, 0.52);
  rod(cart, metal, [1.12, 0.77, 0.29], [1.36, 0.86, 0.29], 0.014);
  rod(cart, metal, [1.12, 0.77, -0.16], [1.36, 0.86, -0.16], 0.014);
  rod(cart, metal, [-1.02, 0.83, 0.20], [-1.23, 0.87, 0.20], 0.022);
  rod(cart, metal, [-1.23, 0.87, 0.20], [-1.23, 0.87, -0.24], 0.022);
  rod(cart, metal, [-1.23, 0.87, -0.24], [-1.02, 0.83, -0.24], 0.022);

  for (const [shelf, y] of [0.95, 1.28].entries()) {
    box(cart, m.silver, -0.10, y, 0.04, 1.66, 0.034, 0.58);
    for (let i = 0; i < (shelf ? 5 : 7); i++) {
      const u = (i - (shelf ? 2 : 3)) * 0.226;
      const loaf = mesh(cart, bodyGeo, m.bread, u - 0.12, y + 0.073, 0.13,
        0.097, 0.059, 0.164 + (i % 3) * 0.012);
      loaf.rotation.y = 0.15 - (i % 3) * 0.17;
    }
  }
  container(cart, m, 0.78, 0.96, 0.02, 0.10, 0.23, m.enamel, 'pot');

  const fascia = texture(512, 90, ctx => {
    ctx.fillStyle = '#c7c0ad';
    ctx.fillRect(0, 0, 512, 90);
    ctx.font = 'italic bold 47px Georgia, serif';
    ctx.fillStyle = '#a63723';
    ctx.fillText('Bánh Mì', 23, 61);
    ctx.fillStyle = '#215077';
    ctx.fillText('Việt Nam', 230, 61);
  });
  const sign = texture(512, 180, ctx => {
    ctx.fillStyle = '#c5bca6';
    ctx.fillRect(0, 0, 512, 180);
    for (const [color, offset] of [['#235b88', 0], ['#edb922', 15]]) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, 122 + offset);
      ctx.lineTo(512, 55 + offset);
      ctx.lineTo(512, 180);
      ctx.lineTo(0, 180);
      ctx.fill();
    }
    ctx.font = 'italic bold 36px Georgia, serif';
    ctx.fillStyle = '#ad4028';
    ctx.fillText('Bánh Mì Pa Tê', 23, 52);
    ctx.font = '900 74px sans-serif';
    ctx.strokeStyle = '#ffe7a2';
    ctx.lineWidth = 5;
    ctx.textAlign = 'center';
    ctx.strokeText('CÔ BÉO', 261, 125);
    ctx.fillText('CÔ BÉO', 261, 125);
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText('THỊT NGUỘI · PA TÊ · CÁ HỘP', 296, 158);
  });
  mesh(cart, new T.PlaneGeometry(1.95, 0.23),
    new T.MeshBasicMaterial({ map: fascia, toneMapped: false }), 0, 1.88, 0.434);
  mesh(cart, new T.PlaneGeometry(1.93, 0.60),
    new T.MeshBasicMaterial({ map: sign, toneMapped: false }), 0, 0.56, 0.396);
  box(cart, metal, 0, 0.88, 0.414, 2.0, 0.025, 0.025);
  for (let i = 0; i < 4; i++) {
    const tinX = 0.52 + (i % 2) * 0.13;
    mesh(cart, cylinderGeo, i % 2 ? m.red : m.enamel, tinX, 1.35, -0.058 + Math.floor(i / 2) * 0.12,
      0.046, 0.12, 0.046);
  }
  for (let i = 0; i < 5; i++) {
    mesh(cart, bodyGeo, m.produce[0], 0.27 + i * 0.11, 0.99, 0.25, 0.067, 0.022, 0.057)
      .rotation.y = i * 0.22;
  }
  stool(stall, m, -1.58, 1.92, m.red, { turn: -0.13 });
  stool(stall, m, 1.41, 1.98, m.blue, { turn: 0.22 });
  stool(stall, m, 1.83, 1.37, m.plasticGreen, { turn: -0.24 });
}

function phoShop(parent, m, x) {
  const shop = groupAt(parent, 'Phở Nhỏ', x);
  const entrance = -0.80;
  const jade = material('#46734d', { roughness: 0.6 });
  const shutter = material('#777964', { metalness: 0.38, roughness: 0.62 });
  const fascia = material('#bd906c');
  const inside = material('#23302b');
  const tile = material('#c1bda3');
  const glass = new T.MeshBasicMaterial({ color: '#a9d3be', transparent: true, opacity: 0.12, depthWrite: false, side: T.DoubleSide });
  const publicName = texture(768, 192, ctx => {
    ctx.fillStyle = '#c89b75';
    ctx.fillRect(0, 0, 768, 192);
    ctx.fillStyle = '#b58966';
    for (const x of [146, 302, 458, 614]) ctx.fillRect(x, 0, 2, 192);
    ctx.font = 'bold 95px Georgia, serif';
    ctx.fillStyle = '#916a51';
    ctx.fillText('PHỞ NHỎ', 44, 120);
    ctx.fillStyle = '#fff2d9';
    ctx.fillText('PHỞ NHỎ', 40, 114);
    ctx.font = 'bold 23px sans-serif';
    ctx.fillText('PHỞ BÒ · PHỞ GÀ', 47, 158);
    ctx.beginPath();
    ctx.ellipse(667, 97, 52, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(623, 92);
    ctx.quadraticCurveTo(628, 144, 667, 143);
    ctx.quadraticCurveTo(706, 144, 711, 92);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fff2d9';
    for (const steam of [650, 669, 687]) {
      ctx.beginPath();
      ctx.moveTo(steam, 72);
      ctx.bezierCurveTo(steam - 15, 58, steam + 14, 51, steam, 32);
      ctx.stroke();
    }
  });
  box(shop, fascia, 0, 2.66, entrance + 0.48, 3.73, 0.68, 0.13);
  for (const side of [-1, 1]) {
    box(shop, m.iron, side * 1.75, 2.51, entrance + 0.20, 0.045, 0.05, 0.49);
  }
  mesh(shop, new T.PlaneGeometry(3.69, 0.65),
    new T.MeshBasicMaterial({ map: publicName, toneMapped: false }), 0, 2.66, entrance + 0.549);
  box(shop, jade, 0, 2.31, entrance + 0.12, 3.86, 0.10, 0.32);
  box(shop, inside, 0, 1.25, entrance - 0.63, 3.29, 2.14, 0.08);
  for (const side of [-1, 1]) {
    box(shop, fascia, side * 1.71, 1.28, entrance - 0.14, 0.21, 2.12, 0.35);
    box(shop, jade, side * 1.57, 1.26, entrance + 0.037, 0.047, 2.08, 0.047);
    mesh(shop, new T.PlaneGeometry(0.58, 1.74), glass, side * 1.27, 1.18, entrance + 0.02);
    box(shop, jade, side * 0.98, 1.17, entrance + 0.031, 0.044, 1.77, 0.045);
  }
  box(shop, shutter, 0, 1.98, entrance + 0.005, 3.15, 0.51, 0.08);
  for (let i = 0; i < 10; i++) {
    box(shop, m.iron, 0, 1.75 + i * 0.049, entrance + 0.05, 3.16, 0.013, 0.021);
  }
  for (const [index, z] of [entrance + 0.47, entrance + 0.22, entrance - 0.05].entries()) {
    box(shop, tile, 0, 0.058 + index * 0.055, z, 3.12, 0.060 + index * 0.11, 0.32);
  }
  for (let shelf = 0; shelf < 2; shelf++) {
    const y = 0.91 + shelf * 0.37;
    box(shop, m.silver, -0.92, y, entrance - 0.48, 1.29, 0.042, 0.26);
    for (let i = 0; i < 5; i++) container(shop, m, -1.44 + i * 0.24, y + 0.023, entrance - 0.43,
      0.092, 0.048, m.enamel, 'bowl');
  }
  box(shop, m.silver, -0.91, 0.62, entrance + 0.27, 1.54, 0.76, 0.57);
  box(shop, jade, -0.91, 0.62, entrance + 0.563, 1.39, 0.57, 0.023);
  box(shop, m.silver, -0.91, 1.02, entrance + 0.28, 1.60, 0.065, 0.62);
  container(shop, m, -1.29, 1.055, entrance + 0.28, 0.246, 0.30, m.silver, 'pot');
  container(shop, m, -0.73, 1.055, entrance + 0.25, 0.181, 0.24, m.silver, 'pot');
  rod(shop, m.silver, [-0.73, 1.26, entrance + 0.22], [-0.57, 1.48, entrance + 0.29], 0.014);
  for (let i = 0; i < 4; i++) {
    container(shop, m, -0.35, 1.052 + i * 0.032, entrance + 0.35, 0.091, 0.052, m.enamel, 'bowl');
  }
  bulb(shop, m, -1.25, 1.91, entrance + 0.15);
  bulb(shop, m, 1.26, 1.93, entrance + 0.15);

  for (const [u, z, color] of [[-1.10, 1.83, m.red], [1.03, 2.31, m.blue]]) {
    const table = groupAt(shop, 'Bàn nhựa vỉa hè', u, 0.075, z);
    box(table, color, 0, 0.485, 0, 0.84, 0.058, 0.60);
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      const leg = box(table, color, side * 0.35, 0.24, end * 0.24, 0.055, 0.47, 0.047);
      leg.rotation.z = side * 0.10;
    }
    container(table, m, -0.16, 0.52, 0, 0.093, 0.052, m.enamel, 'bowl');
    container(table, m, 0.17, 0.52, -0.05, 0.078, 0.122, m.silver, 'bowl');
    for (let i = 0; i < 3; i++) rod(table, m.timber, [0.145 + i * 0.024, 0.54, -0.04],
      [0.133 + i * 0.030, 0.69, -0.05], 0.006);
    stool(shop, m, u, z + 0.49, color, { turn: 0.11 });
    stool(shop, m, u + Math.sign(u) * 0.61, z - 0.03, color === m.red ? m.blue : m.red, { turn: -0.18 });
  }
}

function foodStall(parent, m, x, type) {
  if (type === 0) {
    phoShop(parent, m, x);
    return;
  }
  if (type === 2) {
    banhMiCart(parent, m, x);
    return;
  }
  const names = {
    1: ['Bếp Than', 'THỊT XIÊN · ĐỒ NƯỚNG', 'B', 'sand'],
    3: ['Chè Nhà', 'CHÈ · SỮA ĐẬU NÀNH', 'C', 'stripe'],
  };
  const [name, subtitle, logo, style] = names[type];
  const stall = stallFrame(parent, m, x, name, subtitle, logo, style, '#723c30');
  table(stall, m, 0, 1.34, 3.44);
  if (type === 1) {
    box(stall, m.silver, 0, 0.89, 1.33, 2.02, 0.22, 0.54);
    box(stall, m.coffee, 0, 1.011, 1.33, 1.93, 0.027, 0.49);
    for (let i = 0; i < 16; i++) {
      const u = (i - 7.5) * 0.113;
      box(stall, m.silver, u, 1.043, 1.33, 0.019, 0.020, 0.51);
      rod(stall, m.basket, [u, 1.066, 1.11], [u, 1.066, 1.72], 0.010);
      for (let j = 0; j < 4; j++) mesh(stall, leafGeo, m.produce[(i + j) % 3], u, 1.091,
        1.19 + j * 0.084, 0.048, 0.038, 0.051);
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const u = (i - 3) * 0.42;
      container(stall, m, u, 0.77, 1.35, 0.12, 0.25 + (i % 3) * 0.05,
        i % 2 ? m.glaze : m.enamel, 'pot');
      cups(stall, m, u, 0.77, 1.62);
    }
  }
  stool(stall, m, -0.87, 2.04, m.red);
  stool(stall, m, 0.85, 2.17, m.blue);
}

function textilesAnnex(parent, m, x) {
  const stall = stallFrame(parent, m, x, 'Chỉ Nâu', 'VẢI CUỘN · KIM CHỈ', 'C', 'sand', '#784336');
  for (const side of [-1, 1]) table(stall, m, side * 0.97, 1.64, 1.73);
  for (let i = 0; i < 22; i++) {
    const u = (i % 11 - 5) * 0.29;
    const y = i < 11 ? 0.89 : 1.12;
    mesh(stall, cylinderGeo, m.fabrics[i % 6], u, y, 1.60, 0.096, 0.40 + (i % 4) * 0.045, 0.096).rotation.x = Math.PI / 2;
  }
  for (let shelf = 0; shelf < 2; shelf++) {
    box(stall, m.darkWood, 0, 1.06 + shelf * 0.54, 0.64, 3.56, 0.071, 0.42);
    for (let i = 0; i < 9; i++) for (let layer = 0; layer < 3; layer++) {
      box(stall, m.fabrics[(i + layer + shelf) % 6], (i - 4) * 0.37, 1.11 + shelf * 0.54 + layer * 0.043,
        0.68, 0.33, 0.036, 0.29);
    }
  }
}

function overheadLines(parent, m, poleLocations) {
  const height = 5.62, setback = 2.51;
  const connectors = [-0.67, -0.27, 0.27, 0.67];
  const concrete = material('#7b786c');
  const footing = material('#55554a');
  const insulator = material('#d9ca9e');
  for (const x of poleLocations.slice(1)) {
    const pole = groupAt(parent, 'Wooden power pole with porcelain insulators', x, 0, setback);
    box(pole, m.darkWood, 0, (height + 0.31) / 2, 0, 0.15, height + 0.31, 0.16);
    box(pole, concrete, 0.04, 0.80, 0, 0.24, 1.60, 0.27);
    box(pole, footing, 0.04, 0.19, 0, 0.244, 0.38, 0.274);
    for (const y of [0.89, 1.35, 1.44]) box(pole, m.iron, 0.035, y, 0, 0.27, 0.045, 0.30);
    box(pole, m.darkWood, 0.073, height, 0, 0.145, 0.125, 1.64);
    for (const side of [-1, 1]) {
      const brace = box(pole, m.timber, 0.073, height - 0.42, side * 0.31, 0.075, 0.94, 0.065);
      brace.rotation.x = side * 0.72;
    }
    for (const z of connectors) {
      mesh(pole, cylinderGeo, insulator, 0.071, height + 0.11, z, 0.037, 0.11, 0.037);
      mesh(pole, cylinderGeo, insulator, 0.071, height + 0.14, z, 0.067, 0.034, 0.067);
      mesh(pole, cylinderGeo, m.iron, 0.071, height + 0.183, z, 0.015, 0.056, 0.015);
    }
  }
  for (let i = 1; i < poleLocations.length; i++) {
    const start = poleLocations[i - 1] + 0.066, end = poleLocations[i] + 0.066;
    for (const [wire, offset] of connectors.entries()) {
      const z = setback + offset;
      const path = [0, 0.25, 0.5, 0.75, 1].map(t => [
        T.MathUtils.lerp(start, end, t),
        height + 0.18 - (0.32 + (end - start) * 0.032 + wire * 0.022) * 4 * t * (1 - t),
        z + Math.sin(t * Math.PI) * (wire - 1.5) * 0.025,
      ]);
      tube(parent, m.wire, path, 0.009);
    }
  }
}

function batchStatic(root, paintedSurfaces) {
  root.updateMatrixWorld(true);
  const groups = new Map();
  root.traverse(mesh => {
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    if (!geometry.hasAttribute('uv')) {
      geometry.setAttribute('uv', new T.BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
    }
    geometry.applyMatrix4(mesh.matrixWorld);
    let surface = mesh.material;
    if (surface.isMeshStandardMaterial && !surface.map && !surface.bumpMap
      && !surface.transparent && !surface.vertexColors && surface.emissive.getHex() === 0) {
      tintVertices(geometry, surface.color);
      surface = paintedSurfaces[surface.side];
    }
    if (!groups.has(surface)) groups.set(surface, []);
    groups.get(surface).push(geometry);
  });
  const result = new T.Group();
  for (const [surface, geometries] of groups) {
    const merged = mergeGeometries(geometries);
    result.add(new T.Mesh(merged, surface));
    geometries.forEach(geometry => geometry.dispose());
  }
  return result;
}

// Crop coordinates refer to the 472 px photos embedded in the shared atlas.
const photoFrontages = [
  {
    origin: [0, 0], height: 6.55, shopWidth: 0.74, roof: 'terrace',
    floors: [
      { bottom: 3.05, top: 4.19, windows: [[65, 213, 166, 247], [253, 191, 293, 237]], balcony: true },
      { bottom: 4.88, top: 6.04, windows: [[24, 75, 67, 113], [149, 65, 196, 117], [254, 80, 299, 126]], balcony: true },
    ],
    sign: [54, 330, 170, 351], shop: [53, 365, 122, 395],
  },
  {
    origin: [0, 512], height: 6.20, shopWidth: 0.84, roof: 'metal',
    floors: [
      { bottom: 2.87, top: 4.10, windows: [[130, 193, 225, 247], [244, 195, 332, 248], [341, 194, 440, 246]] },
      { bottom: 4.62, top: 5.79, windows: [[119, 83, 217, 115], [241, 88, 326, 116]], balcony: true, setback: 0.29 },
    ],
    sign: [154, 323, 385, 341], shop: [152, 354, 354, 397],
  },
  {
    origin: [512, 512], height: 5.65, shopWidth: 0.80, roof: 'pediment',
    floors: [
      { bottom: 3.05, top: 4.83, windows: [[44, 142, 96, 202], [166, 137, 244, 200], [328, 131, 405, 202]],
        balcony: true, arched: true },
    ],
    sign: [122, 221, 220, 239], shop: [108, 298, 309, 372],
  },
  {
    origin: [0, 0], height: 6.55, shopWidth: 0.79, roof: 'greenShop',
    floors: [
      { bottom: 2.94, top: 4.18, windows: [[65, 213, 166, 247], [253, 191, 293, 237]] },
      { bottom: 4.65, top: 6.13, windows: [[24, 75, 67, 113], [149, 65, 196, 117]], balcony: true },
    ],
    sign: [54, 330, 170, 351], shop: [53, 365, 122, 395],
  },
  {
    origin: [0, 512], height: 6.23, shopWidth: 0.74, roof: 'veranda',
    floors: [
      { bottom: 2.94, top: 4.22, windows: [[130, 193, 225, 247], [244, 195, 332, 248]], balcony: true },
      { bottom: 4.70, top: 5.82, windows: [[119, 83, 217, 115], [241, 88, 326, 116]], balcony: true, setback: 0.25 },
    ],
    sign: [154, 323, 385, 341], shop: [152, 354, 354, 397],
  },
];
const limewash = {
  ochre: new T.Color('#e7aa45'),
  paleYellow: new T.Color('#f2ce83'),
  mustard: new T.Color('#cd923a'),
  amber: new T.Color('#db9d47'),
  cream: new T.Color('#f5e9ce'),
  sage: new T.Color('#a7a98c'),
  smoke: new T.Color('#bcb39d'),
};
const streetColors = [
  [limewash.ochre, limewash.amber, limewash.cream, limewash.sage],
  [limewash.cream, limewash.smoke, limewash.amber, limewash.mustard],
  [limewash.paleYellow, limewash.cream, limewash.mustard, limewash.cream],
  [limewash.amber, limewash.smoke, limewash.paleYellow, limewash.cream],
];
const photographedLimewash = new Map([
  [limewash.ochre, new T.Color('#fff1bc')],
  [limewash.paleYellow, new T.Color('#fff9df')],
  [limewash.mustard, new T.Color('#ffe3a2')],
  [limewash.amber, new T.Color('#ffd18a')],
]);
const streetFronts = [[0, 3, 4, 2], [4, 0, 1, 3], [2, 4, 0, 1], [3, 1, 2, 4]];
const streetRoofHeights = [
  [5.48, 6.98, 5.60, 4.75],
  [5.35, 7.33, 6.15, 7.02],
  [4.90, 6.82, 5.22, 6.59],
  [7.24, 5.55, 4.82, 6.81],
];

function tintVertices(geometry, { r, g, b }) {
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) {
    colors[i] = r;
    colors[i + 1] = g;
    colors[i + 2] = b;
  }
  geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
}

function photoPanel([ox, oy], [left, top, right, bottom], arched = false) {
  let geometry = new T.PlaneGeometry(1, 1);
  if (arched) {
    const arch = new T.Shape();
    arch.moveTo(-0.5, -0.5);
    arch.lineTo(0.5, -0.5);
    arch.lineTo(0.5, 0.15);
    arch.quadraticCurveTo(0.5, 0.5, 0, 0.5);
    arch.quadraticCurveTo(-0.5, 0.5, -0.5, 0.15);
    arch.closePath();
    geometry.dispose();
    geometry = new T.ShapeGeometry(arch, 5);
  }
  const { position, uv } = geometry.attributes;
  for (let i = 0; i < uv.count; i++) {
    const u = T.MathUtils.lerp(left, right, position.getX(i) + 0.5);
    const v = T.MathUtils.lerp(top, bottom, 0.5 - position.getY(i));
    uv.setXY(i, (ox + 20 + u) / 1024, (oy + 20 + v) / 1024);
  }
  tintVertices(geometry, { r: 1, g: 1, b: 1 });
  return geometry;
}

export async function loadMarketHouses(url) {
  const { scene } = await new GLTFLoader().loadAsync(url);
  const source = scene.getObjectByName('Architecture');
  if (!source?.isMesh || !source.material.map) throw new Error('Missing market photo atlas');
  const fronts = photoFrontages.map(({ origin, floors, sign, shop, ...layout }) => ({
    ...layout,
    floors: floors.map(({ windows, arched, ...floor }) => ({
      ...floor, windows: windows.map(crop => photoPanel(origin, crop, arched)),
    })),
    sign: photoPanel(origin, sign),
    shop: photoPanel(origin, shop),
  }));
  const material = source.material.clone();
  material.vertexColors = true;
  return { fronts, material };
}

function plasterBox(home, material, tint, frontageWidth, frontageHeight, x, y, z, width, height, depth) {
  const geometry = boxGeo.clone().scale(width, height, depth).translate(x, y, z);
  const { position, normal, uv } = geometry.attributes;
  const useYellowPhoto = photographedLimewash.has(tint);
  const tileLeft = useYellowPhoto ? 776 : 532;
  for (let i = 0; i < uv.count; i++) {
    const side = Math.abs(normal.getX(i)) > 0.5;
    const top = Math.abs(normal.getY(i)) > 0.5;
    const u = side ? (position.getZ(i) + 3.2) / 3.5 : 0.5 + position.getX(i) / frontageWidth;
    const v = top ? -position.getZ(i) / 3.5 : 1 - position.getY(i) / frontageHeight;
    // Top-right atlas tile. Building-local coordinates keep the bricks aligned across piers and bands.
    uv.setXY(i, (tileLeft + T.MathUtils.clamp(u, 0, 1) * 228) / 1024,
      (20 + T.MathUtils.clamp(v, 0, 1) * 472) / 1024);
  }
  tintVertices(geometry, photographedLimewash.get(tint) ?? tint);
  return mesh(home, geometry, material, 0, 0, 0);
}

function louverShutters(home, m, x, y, face, opening, height, open) {
  const leafWidth = opening * 0.48;
  for (const side of [-1, 1]) {
    const leaf = groupAt(home, 'Dark green louver shutter', x + side * opening / 2, y, face + 0.085);
    leaf.rotation.y = open ? side * Math.PI * 0.60 : 0;
    const center = -side * leafWidth / 2;
    const stile = 0.055;
    for (const edge of [-1, 1]) {
      box(leaf, m.teal[0], center + edge * (leafWidth - stile) / 2, 0, 0, stile, height, 0.073);
      box(leaf, m.teal[0], center, edge * (height - stile) / 2, 0, leafWidth, stile, 0.073);
    }
    const slats = Math.round(height / 0.08);
    for (let j = 0; j < slats; j++) {
      const slat = box(leaf, j % 4 === 1 ? m.teal[1] : m.teal[2], center,
        ((j + 0.5) / slats - 0.5) * (height - 0.13), 0, leafWidth - 2 * stile, 0.062, 0.041);
      slat.rotation.x = 0.25;
    }
  }
}

function placeMarketHouses(parent, { fronts, material }, m, pitches, variants, sectionIndex, random) {
  const widths = [4.48, 4.40, 4.54, 4.46];
  pitches.forEach((x, i) => {
    const design = streetFronts[sectionIndex][i];
    const tint = streetColors[sectionIndex][i];
    if (sectionIndex < 3 && i === sectionIndex) {
      const front = fronts[(sectionIndex + 2) % 3];
      architecturePrototype(parent, m, x, sectionIndex, random, { front, material, tint });
      return;
    }
    const variant = variants[i];
    const { floors, sign, shop, roof, height: designHeight, shopWidth: shopRatio } = fronts[design];
    const height = streetRoofHeights[sectionIndex][i];
    const shopTop = 2.45;
    const upperScale = (height - shopTop) / (designHeight - shopTop);
    const upperY = y => shopTop + (y - shopTop) * upperScale;
    const home = groupAt(parent, 'Photo-textured shophouse', x, 0.075, -0.85);
    const width = roof === 'veranda' ? 3.58 : roof === 'greenShop' ? 3.91 : widths[variant];
    if ((i + sectionIndex) % 2 === 0) {
      hangVietnamFlag(home, m, -width * 0.32, Math.max(3.82, upperY(3.93)), -0.49 - i * 0.09);
    }
    const wall = (...dimensions) => plasterBox(home, material, tint, width, height, ...dimensions);
    // This rear volume leaves room for the window reveals in the street-facing wall.
    wall(0, height / 2, -1.91, width, height, 2.46);
    const band = (lower, upper, setback) =>
      wall(0, (lower + upper) / 2, (-0.66 - setback + 0.04) / 2,
        width, upper - lower, 0.70 - setback);
    let previousTop = shopTop;
    for (const { bottom: designBottom, top: designTop, windows, balcony, setback = 0 } of floors) {
      const bottom = upperY(designBottom), top = upperY(designTop);
      band(previousTop, bottom, setback);
      const opening = windows.length === 2 ? 1.31 : 0.95;
      const spacing = (width - 0.48) / windows.length;
      const windowY = (bottom + top) / 2;
      const windowHeight = top - bottom;
      const face = 0.04 - setback;
      const pierDepth = face + 0.66;
      let previous = -width / 2;
      windows.forEach((photo, index) => {
        const u = (index - (windows.length - 1) / 2) * spacing;
        const left = u - opening / 2, right = u + opening / 2;
        wall((previous + left) / 2, windowY, face - pierDepth / 2, left - previous, windowHeight, pierDepth);
        previous = right;
        box(home, m.darkWood, u, windowY, face - 0.26, opening, windowHeight, 0.04);
        mesh(home, photo, material, u, windowY, face - 0.233, opening - 0.10, windowHeight - 0.10);
        for (const side of [-1, 1]) {
          box(home, m.trim, u + side * opening / 2, windowY, face, 0.10, windowHeight, 0.13);
        }
        if (roof === 'greenShop') {
          box(home, m.teal[0], u, windowY, face - 0.20, 0.06, windowHeight, 0.048);
          louverShutters(home, m, u, windowY, face, opening, windowHeight - 0.045,
            (index + sectionIndex + Number(bottom > 4)) % 3 !== 0);
        }
        box(home, m.sill, u, bottom + 0.015, face + 0.05, opening + 0.22, 0.12, 0.22);
      });
      wall((previous + width / 2) / 2, windowY, face - pierDepth / 2,
        width / 2 - previous, windowHeight, pierDepth);
      if (balcony) {
        const span = roof === 'pediment' ? width * 0.57 : width - 0.52;
        const rail = roof === 'greenShop' ? m.teal[0] : roof === 'veranda' ? m.trim : m.iron;
        box(home, roof === 'greenShop' ? rail : m.sill, 0, bottom - 0.04, face + 0.24, span, 0.15, 0.65);
        balconyShadow(home, m, span, bottom - 0.105, face + 0.008);
        box(home, rail, 0, bottom + 0.45, face + 0.52, span - 0.05, 0.06, 0.06);
        for (let j = 0; j < 10; j++) {
          const railX = (j / 9 - 0.5) * (span - 0.12);
          if (roof === 'veranda') mesh(home, balusterGeo, rail, railX, bottom + 0.20, face + 0.52, 0.047, 0.45, 0.047);
          else box(home, rail, railX, bottom + 0.20, face + 0.52, 0.045, 0.51, 0.045);
        }
        const showBunting = (sectionIndex === 0 && i === 1 && roof === 'greenShop')
          || (sectionIndex === 3 && i === 3 && bottom < 4);
        if (showBunting) hangFlagBunting(home, m, span - 0.11, bottom + 0.45, face + 0.575);
        const planterSide = (sectionIndex + i + Number(bottom > 4)) % 2 ? 1 : -1;
        const bloom = (sectionIndex + i + Number(bottom > 4)) % 3 !== 1;
        balconyPlant(home, m, planterSide * span * (bloom ? 0.21 : 0.33), bottom + 0.035, face + 0.48, bloom, random);
        if (span > 3.5 && !bloom) {
          balconyPlant(home, m, -planterSide * span * 0.33, bottom + 0.035, face + 0.44, false, random);
        }
      }
      previousTop = top;
    }
    const roofSetback = floors.at(-1).setback ?? 0;
    band(previousTop, height, roofSetback);
    box(home, m.sill, 0, height - 0.20, 0.04 - roofSetback, width + 0.12, 0.14, 0.30);
    const roofSurface = roof === 'metal' ? m.iron : m.tiles[variant];
    const cap = box(home, roofSurface, 0, height, -1.48, width + 0.12, 0.11, 3.28);
    if (roof === 'metal') cap.rotation.x = -0.09;
    if (roof === 'greenShop' || roof === 'veranda') {
      const shade = box(home, m.teal[2], 0, height + 0.16, -0.10, width + 0.25, 0.10, 1.14);
      shade.rotation.x = 0.10;
      for (const side of [-1, 1]) {
        box(home, m.teal[0], side * (width / 2 - 0.18), height - 0.23, 0.36, 0.056, 0.76, 0.056);
      }
    }
    if (roof === 'terrace') {
      wall(0, height + 0.12, 0.01, width, 0.24, 0.22);
      box(home, m.sill, 0, height + 0.25, 0.01, width + 0.08, 0.07, 0.26);
    }
    if (roof === 'terrace' || roof === 'veranda' || (roof === 'metal' && i % 2 === 0)) {
      rooftopAntenna(home, m, width * 0.29, height + 0.06, -0.98, 0.38);
    }
    if (roof === 'pediment') {
      wall(0, height + 0.13, -0.10, width * 0.76, 0.28, 0.34);
      wall(0, height + 0.32, -0.10, width * 0.48, 0.22, 0.34);
      box(home, m.trim, 0, height + 0.44, -0.10, width * 0.49, 0.055, 0.38);
    }

    if (sectionIndex === 1 && i === 0) return;
    box(home, m.sill, 0, 0.13, 0.01, width, 0.25, 0.27);
    const shopWidth = width * shopRatio;
    const jambWidth = (width - shopWidth) / 2;
    for (const side of [-1, 1]) {
      wall(side * (width - jambWidth) / 2, 1.34, -0.27, jambWidth, 2.36, 0.66);
      box(home, m.darkWood, side * shopWidth / 2, 1.33, 0.045, 0.10, 2.15, 0.13);
    }
    box(home, m.crevice, 0, 1.35, -0.24, shopWidth, 2.18, 0.06);
    mesh(home, shop, material, 0, 1.50, -0.203, shopWidth - 0.17, 1.32);
    box(home, m.darkWood, 0, 2.40, 0.09, shopWidth, 0.43, 0.17);
    mesh(home, sign, material, 0, 2.40, 0.180, shopWidth - 0.31, 0.31);
  });
}

function balconyShadow(home, m, width, top, front) {
  const height = 0.48;
  mesh(home, new T.PlaneGeometry(width, height), m.balconyShade, 0, top - height / 2, front);
}

function streetShadowMaterial(pitches, { withTree = false, withCart = false } = {}) {
  const map = texture(768, 192, ctx => {
    const width = 18.4, depth = 4.2;
    ctx.scale(ctx.canvas.width / width, ctx.canvas.height / depth);
    ctx.translate(width / 2, 0);
    function softShadow(x, z, width, depth, opacity, angle = 0) {
      ctx.save();
      ctx.translate(x, z);
      ctx.rotate(angle);
      ctx.scale(width, depth);
      const falloff = ctx.createRadialGradient(0, 0, 0.18, 0, 0, 1);
      falloff.addColorStop(0, `rgba(29, 34, 36, ${opacity})`);
      falloff.addColorStop(0.58, `rgba(29, 34, 36, ${opacity * 0.72})`);
      falloff.addColorStop(1, 'rgba(29, 34, 36, 0)');
      ctx.fillStyle = falloff;
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    }
    pitches.forEach((x, index) => {
      if (withCart && index === 2) {
        softShadow(x - 0.32, 1.10, 1.34, 0.57, 0.49);
        softShadow(x + 1.1, 1.83, 0.78, 0.32, 0.26);
        return;
      }
      softShadow(x - 0.32, 0.84, 2.38, 1.04, 0.41, -0.11);
      if (!withTree || index !== pitches.length - 1) {
        softShadow(x, 1.58, 1.72, 0.65, 0.43, -0.055);
      }
      for (const side of [-1, 1]) softShadow(x + side * 2.04, 2.09, 0.20, 0.22, 0.34);
    });
    if (withTree) {
      softShadow(5.53, 2.83, 0.58, 0.54, 0.54);
      softShadow(4.76, 2.44, 1.31, 0.25, 0.30, 0.39);
      [[2.14, 2.43, 1.75, 0.76], [3.5, 2.11, 1.3, 0.70], [4.53, 1.86, 1.25, 0.78],
        [1.65, 2.95, 1.2, 0.62], [0.93, 2.42, 0.95, 0.58]].forEach(([x, z, w, d]) =>
        softShadow(x, z, w, d, 0.38, -0.12));
    }
  });
  return new T.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false });
}

function layStreetShadows(street, surface, width) {
  // Share the mask across two elevations, so the shadow follows the curb onto the road.
  for (const [start, end, height] of [[0, 3.30, 0.091], [3.30, 4.20, 0.035]]) {
    const geometry = new T.PlaneGeometry(width, end - start);
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setY(i, 1 - T.MathUtils.lerp(end, start, uv.getY(i)) / 4.2);
    }
    const shadow = mesh(street, geometry, surface, 0, height, (start + end) / 2);
    shadow.rotation.x = -Math.PI / 2;
  }
}

function closePartyWalls(parent, m, pitches, sectionIndex) {
  const heights = streetRoofHeights[sectionIndex];
  const next = streetRoofHeights[(sectionIndex + 1) % streetRoofHeights.length];
  const neighbors = [[pitches[0] - 2.3, Math.min(heights[0], next.at(-1))]];
  for (let i = 1; i < pitches.length; i++) {
    neighbors.push([(pitches[i - 1] + pitches[i]) / 2, Math.min(heights[i - 1], heights[i])]);
  }
  for (const [x, roof] of neighbors) {
    const height = roof - 0.23;
    box(parent, m.walls[2], x, height / 2, -2.09, 1.39, height, 1.51);
  }
}

function oldStreetTree(street, x, z) {
  const tree = groupAt(street, 'Old low-poly street tree', x, 0.04, z);
  const taper = new T.CylinderGeometry(0.66, 1, 1, 7);
  const bark = ['#60432e', '#795238', '#4a3729'].map(color => material(color));
  const canopyGeometry = new T.IcosahedronGeometry(1, 1);
  canopyGeometry.computeVertexNormals();
  const olive = ['#768550', '#8b904b', '#626f3e', '#989849', '#74884e'].map(color => {
    const geometry = canopyGeometry.clone();
    tintVertices(geometry, new T.Color(color));
    return geometry;
  });
  const canopySurface = new T.MeshLambertMaterial({
    vertexColors: true, emissive: '#4f5a32', emissiveIntensity: 0.65,
  });
  const up = new T.Vector3(0, 1, 0);
  function limb(a, b, radius, surface) {
    const direction = new T.Vector3(...b).sub(new T.Vector3(...a));
    const branch = mesh(tree, taper, surface, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2,
      (a[2] + b[2]) / 2, radius, direction.length(), radius);
    branch.quaternion.setFromUnitVectors(up, direction.normalize());
  }
  limb([0, 0, 0], [-0.16, 1.53, 0.05], 0.39, bark[0]);
  limb([-0.16, 1.38, 0.05], [-0.10, 3.09, -0.04], 0.31, bark[0]);
  limb([-0.10, 2.93, -0.04], [0.33, 4.51, -0.16], 0.26, bark[0]);
  limb([0.28, 4.30, -0.14], [0.19, 5.66, -0.39], 0.18, bark[0]);
  const roots = [[0.65, 0.27], [-0.62, 0.30], [-0.46, -0.40], [0.33, -0.52], [0.02, 0.55]];
  for (const [i, [dx, dz]] of roots.entries()) {
    const knee = [dx * 0.58, 0.16, dz * 0.58];
    limb([dx * 0.13, 0.61 - (i % 2) * 0.11, dz * 0.14], knee, 0.13, bark[i % bark.length]);
    limb(knee, [dx, 0.018, dz], 0.075, bark[i % bark.length]);
  }
  const branches = [
    [[-0.12, 2.68, 0.01], [-0.93, 3.38, 0.18], [-1.90, 5.03, 0.37]],
    [[0.10, 3.65, -0.11], [1.07, 4.53, 0.26], [2.06, 5.57, 0.43]],
    [[0.27, 4.24, -0.16], [-0.59, 5.12, -0.47], [-1.15, 6.11, -0.78]],
    [[0.29, 4.54, -0.20], [0.73, 5.14, -0.78], [1.02, 6.34, -1.14]],
  ];
  for (const [i, [start, elbow, tip]] of branches.entries()) {
    limb(start, elbow, 0.16, bark[i % bark.length]);
    limb(elbow, tip, 0.105, bark[0]);
  }

  // Uneven, interlocking lobes form one broad silhouette with a few larger polygon facets.
  const crowns = [
    [-1.68, 5.51, 0.30, 1.12, 0.76, 0.90],
    [-0.97, 5.93, 0.58, 1.26, 0.88, 0.92],
    [0.20, 5.91, 0.70, 1.44, 0.83, 1.00],
    [1.20, 5.96, 0.38, 1.33, 0.86, 1.05],
    [2.04, 5.81, 0.19, 0.87, 0.66, 0.78],
    [-0.81, 6.28, -0.80, 1.34, 0.97, 1.03],
    [0.11, 6.76, -0.57, 1.33, 1.13, 1.05],
    [1.18, 6.55, -0.71, 1.10, 0.91, 0.99],
    [0.44, 4.24, 0.37, 0.60, 0.43, 0.47],
  ];
  for (const [i, [x, y, z, width, height, depth]] of crowns.entries()) {
    const crown = mesh(tree, olive[i % olive.length], canopySurface, x, y, z, width, height, depth);
    crown.rotation.set(i * 0.17, i * 0.49, -0.20 + (i % 3) * 0.15);
  }
  const stone = material('#746b64');
  mesh(tree, leafGeo, stone, 0.38, 0.10, 0.32, 0.23, 0.14, 0.20);
  mesh(tree, leafGeo, stone, -0.34, 0.09, 0.36, 0.27, 0.13, 0.18);
}

function rearRoofline(street, m, section) {
  const heights = [[8.8, 7.4, 9.7, 7.8], [10.3, 8.5, 8.0, 9.3], [8.7, 9.8, 7.8, 8.9], [8.8, 9.7, 9.1, 8.0]][section];
  heights.forEach((height, i) => {
    const x = (i - 1.5) * 4.6 + (i % 2 ? 0.14 : -0.22);
    const z = -6.9 - (i % 2) * 0.55;
    const width = i % 2 ? 3.7 : 4.45;
    // Lower façades sit behind the front row. Build only the exposed upper storeys.
    const wall = m.walls[(i + section) % m.walls.length];
    box(street, wall, x, height / 2 + 1.45, z, width, height - 2.9, 3.4);
    box(street, m.sill, x, height - 0.27, z + 1.65, width + 0.09, 0.17, 0.28);
    const roof = box(street, m.tiles[(section + i) % 4], x, height, z, width + 0.18, 0.14, 3.66);
    roof.rotation.x = i % 2 ? 0.07 : -0.10;
    if ((section + i) % 3 !== 1) {
      rooftopAntenna(street, m, x - 0.46 + 0.55 * (i % 2), height + 0.07, z,
        (i % 2 ? -0.56 : 0.42) + section * 0.08);
    }
    for (const side of [-1, 1]) {
      box(street, m.trim, x + side * width * 0.24, height - 1.24, z + 1.72, 0.97, 1.3, 0.095);
      box(street, m.teal[(i + section) % m.teal.length], x + side * width * 0.24,
        height - 1.24, z + 1.78, 0.81, 1.13, 0.055);
    }
  });
}

function airbornePetals(strip, surface) {
  const count = 6;
  const placement = new T.Object3D();
  const copies = strip.children.map(segment => {
    const petals = new T.InstancedMesh(bractGeo, surface, count);
    petals.instanceMatrix.setUsage(T.DynamicDrawUsage);
    petals.boundingSphere = new T.Sphere(new T.Vector3(6.15, 2.24, 9.1), 3.8);
    segment.add(petals);
    return petals;
  });
  const animate = time => {
    for (let i = 0; i < count; i++) {
      const phase = (time * (0.12 + i * 0.009) + i * 0.173) % 1;
      const drift = Math.sin(time * 1.22 + i * 1.89);
      placement.position.set(6.3 - phase * 0.9 + drift * 0.10, 3.33 - phase * (1.62 + i * 0.17),
        8.1 + i * 0.38 + phase * 1.35 + drift * 0.17);
      placement.rotation.set(time * 0.85 + i, i * 0.62 + drift, time * 1.26 + i);
      placement.scale.setScalar(Math.sin(Math.PI * phase) * (0.64 + (i % 3) * 0.13));
      placement.updateMatrix();
      for (const petals of copies) petals.setMatrixAt(i, placement.matrix);
    }
    for (const petals of copies) petals.instanceMatrix.needsUpdate = true;
  };
  animate(0);
  return animate;
}

export function buildMarketPreview(scene, marketHouses) {
  let seed = 98133;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const m = buildKit(random);
  m.useFacadeSigns = Boolean(marketHouses);
  m.flag = vietnamFlag();
  const shade = texture(16, 64, ctx => {
    const fade = ctx.createLinearGradient(0, 0, 0, 64);
    fade.addColorStop(0, 'rgba(35, 30, 26, 0.55)');
    fade.addColorStop(0.48, 'rgba(35, 30, 26, 0.24)');
    fade.addColorStop(1, 'rgba(35, 30, 26, 0)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, 16, 64);
  });
  m.balconyShade = new T.MeshBasicMaterial({ map: shade, transparent: true, depthWrite: false, toneMapped: false });
  const paintedSurfaces = [T.FrontSide, T.BackSide, T.DoubleSide].map(side =>
    new T.MeshLambertMaterial({ side, vertexColors: true }));
  m.bougainvillea = paintedSurfaces[T.DoubleSide];
  scene.background = new T.Color('#bdcfe0');
  scene.fog = new T.FogExp2('#c8d1db', 0.008);
  const road = material('#565654');
  const stone = ['#494a47', '#575653', '#5e5b55', '#4e504b'].map(hex => material(hex));
  const curb = material('#4b4b47');
  const width = 18.4;
  const pitches = [-6.9, -2.3, 2.3, 6.9];
  const pavementShade = streetShadowMaterial(pitches);
  const treePavementShade = streetShadowMaterial(pitches, { withTree: true });
  const cartPavementShade = streetShadowMaterial(pitches, { withCart: true });
  const sections = [
    { name: 'Vải và đồ gia dụng', facades: [2, 0, 1, 3], stalls(street) {
      textilesAnnex(street, m, pitches[0]);
      fabricStall(street, m, pitches[1]);
      householdStall(street, m, pitches[2]);
      const shutter = groupAt(street, 'Closed side entry', pitches[3]);
      awning(shutter, m, 4.3, 'blue');
      rollingShutter(shutter, m, 3.69);
    } },
    { name: 'Ẩm thực', facades: [1, 3, 0, 2], stalls(street) {
      pitches.forEach((x, index) => foodStall(street, m, x, index));
    } },
    { name: 'Rau quả', facades: [0, 2, 1, 0], stalls(street) {
      produceStall(street, m, pitches[0], true, random);
      produceStall(street, m, pitches[1], false, random);
      produceStall(street, m, pitches[2], true, random, true);
      produceStall(street, m, pitches[3], false, random, true);
    } },
    { name: 'Hoa và cà phê', facades: [3, 1, 2, 0], stalls(street) {
      flowerStall(street, m, pitches[0], random);
      flowerStall(street, m, pitches[1], random, true);
      cafeStall(street, m, pitches[2]);
      cafeStall(street, m, pitches[3], true);
    } },
  ];
  const tile = new T.Group();
  // Train travel is along Z. Local frontage +Z rotates to world −X, toward the windows.
  sections.forEach(({ name, facades, stalls }, i) => {
    const street = new T.Group();
    street.position.set(9.5, -0.17, 4.70 - i * width);
    street.rotation.y = -Math.PI / 2;
    box(street, road, 0, -0.16, 0, width, 0.27, 26);
    box(street, curb, 0, -0.04, 1.38, width, 0.19, 3.55);
    for (let col = 0; col < 32; col++) for (let row = 0; row < 6; row++) {
      const x = (col - 15.5) * 0.57 + (row % 2 ? 0.095 : -0.095);
      const thickness = 0.044 + random() * 0.012;
      if (i === 0 && row >= 4 && Math.abs(x - 5.55) < 0.67) continue;
      box(street, stone[(col * 7 + row) % 4], x, 0.058, 0.36 + row * 0.48,
        0.55, thickness, 0.462);
    }
    box(street, curb, 0, -0.006, 3.15, width, 0.16, 0.29);
    box(street, stone[0], 0, -0.020, 3.37, width, 0.016, 0.39);
    for (let slot = 0; slot < 25; slot++) {
      box(street, stone[slot % stone.length], (slot - 12) * 0.73, 0.066, 3.13, 0.705, 0.041, 0.22);
    }
    const drainX = i % 2 ? -3.72 : 4.53;
    box(street, m.crevice, drainX, -0.003, 3.43, 0.85, 0.032, 0.29);
    for (let bar = 0; bar < 9; bar++) {
      box(street, m.iron, drainX + (bar - 4) * 0.087, 0.015, 3.43, 0.032, 0.027, 0.27).rotation.y = 0.20;
    }
    if (i === 0) {
      box(street, m.coffee, 5.55, 0.065, 2.82, 1.17, 0.033, 0.90);
      oldStreetTree(street, 5.55, 2.83);
    }
    if (marketHouses) rearRoofline(street, m, i);
    const buildings = groupAt(street, 'Market facades');
    if (marketHouses) {
      const seedBeforeHouses = seed;
      placeMarketHouses(buildings, marketHouses, m, pitches, facades, i, random);
      closePartyWalls(buildings, m, pitches, i);
      seed = seedBeforeHouses;
    } else {
      facades.forEach((variant, j) => townhouse(buildings, m, {
        x: pitches[j], width: 4.57, height: [5.34, 5.50, 5.15, 5.91][variant], variant,
      }, random));
      if (i === 0) {
        buildings.remove(...buildings.children.slice(0, 3));
        const seedAfterFacades = seed;
        for (let j = 0; j < 3; j++) architecturePrototype(buildings, m, pitches[j], j, random);
        seed = seedAfterFacades;
      }
    }
    stalls(street);
    layStreetShadows(street, i === 0 ? treePavementShade : i === 1 ? cartPavementShade : pavementShade, width);
    const section = batchStatic(street, paintedSurfaces);
    section.name = 'Market · ' + name;
    tile.add(section);
  });
  const overhead = new T.Group();
  overhead.position.set(9.5, -0.17, 4.70);
  overhead.rotation.y = -Math.PI / 2;
  overheadLines(overhead, m, [-64.4, -59.8, -50.6, -41.4, -32.2, -23, -13.8, -4.6, 4.6, 9.2]);
  const poles = batchStatic(overhead, paintedSurfaces);
  poles.name = 'Market power poles';
  tile.add(poles);

  const strip = new T.Group();
  strip.name = 'Moving Vietnamese market';
  const length = width * sections.length;
  for (let copy = -2; copy <= 1; copy++) {
    const sectionSequence = tile.clone();
    sectionSequence.position.z = copy * length;
    strip.add(sectionSequence);
  }
  scene.add(strip);
  const animateAmbient = matchMedia('(prefers-reduced-motion: reduce)').matches ? undefined : airbornePetals(strip, m.petals[0]);
  // Merchants and facades move together as one street. Their different depths supply perspective parallax.
  return { layers: [{ strip, length, speed: 0.98 }], adaptResolution: true, animateAmbient };
}
