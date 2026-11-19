import * as T from './vendor/three-r164/three.module.min.js';
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
    canvas: ['#214984', '#315d9e', '#d6b78a', '#a64031'].map(hex => material(hex, { side: T.DoubleSide, vertexColors: true })),
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

function vine(parent, m, x, y, z, length, bloom, random) {
  const branches = bloom ? 10 : 7;
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
    for (let i = 0; i < 12; i++) {
      const t = (i + random() * 0.6) / 12;
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

function awning(parent, m, width, style) {
  const strips = 14, segments = 9;
  for (let strip = 0; strip < strips; strip++) {
    const positions = [];
    const profile = (u, t) => [
      (u - 0.5) * width,
      3.68 - 1.00 * t - 0.11 * Math.sin(Math.PI * t) + Math.cos(u * Math.PI * strips * 2) * 0.046,
      0.35 + 2.11 * t,
    ];
    for (let j = 0; j < segments; j++) {
      const a = profile(strip / strips, j / segments), b = profile((strip + 1) / strips, j / segments);
      const c = profile((strip + 1) / strips, (j + 1) / segments), d = profile(strip / strips, (j + 1) / segments);
      positions.push(...a, ...b, ...c, ...a, ...c, ...d);
    }
    for (let n = 0; n < 4; n++) {
      const point = (i, lower) => {
        const u = (strip + i / 4) / strips;
        const p = profile(u, 1);
        if (lower) p[1] -= 0.098 + Math.sin(i * Math.PI / 4) * 0.09;
        return p;
      };
      positions.push(...point(n, false), ...point(n + 1, false), ...point(n + 1, true),
        ...point(n, false), ...point(n + 1, true), ...point(n, true));
    }
    const geometry = new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    const tint = [];
    for (let vertex = 0; vertex < positions.length; vertex += 3) {
      const x = positions[vertex], z = positions[vertex + 2];
      const fold = 0.81 + 0.19 * Math.pow(Math.abs(Math.sin((x / width + 0.5) * Math.PI * strips)), 0.56);
      const wear = fold * (0.91 + 0.065 * Math.sin(z * 16 + x * 2.9) + 0.035 * Math.cos(z * 77));
      tint.push(wear, wear, wear);
    }
    geometry.setAttribute('color', new T.Float32BufferAttribute(tint, 3));
    const shade = style === 'stripe' && strip % 2 === 1 ? 2 : style === 'rust' ? 3 : strip % 3 === 0 ? 1 : 0;
    mesh(parent, geometry, m.canvas[shade], 0, 0, 0);
  }
  rod(parent, m.timber, [-width / 2, 2.67, 2.44], [width / 2, 2.67, 2.44], 0.041);
  for (const side of [-1, 1]) {
    rod(parent, m.darkWood, [side * (width / 2 - 0.075), 0.03, 2.35],
      [side * (width / 2 - 0.075), 2.82, 2.41], 0.049);
    rod(parent, m.timber, [side * (width / 2 - 0.075), 2.22, 2.35],
      [side * (width / 2 - 0.075), 2.67, 1.67], 0.032);
  }
}

function fascia(parent, m, name, subtitle, emblem, ink = '#234558') {
  const width = 3.64, height = 0.52, y = 2.65, z = 0.48;
  const face = texture(768, 128, ctx => {
    ctx.fillStyle = '#ded5b7';
    ctx.fillRect(0, 0, 768, 128);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(29, 97);
    ctx.lineTo(740, 97);
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.fillRect(26, 22, 64, 64);
    ctx.fillStyle = '#f2e2bb';
    ctx.font = 'bold 39px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(emblem, 58, 66, 55);
    ctx.fillStyle = ink;
    ctx.font = 'bold 62px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(name, 113, 77, 610);
    ctx.font = 'bold 19px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(subtitle, 739, 119, 650);
  });
  box(parent, m.timber, 0, y, z - 0.043, width + 0.06, height + 0.045, 0.085);
  mesh(parent, new T.PlaneGeometry(width, height), new T.MeshBasicMaterial({ map: face, toneMapped: false }),
    0, y, z + 0.013);
}

function bulb(parent, m, x, y, z) {
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
    ? stallFrame(parent, m, x, second ? 'Vị Vườn' : 'Quả Quê', 'TRÁI CÂY THEO MÙA', second ? 'V' : 'Q', second ? 'blue' : 'rust', '#843d2b')
    : stallFrame(parent, m, x, second ? 'Rau Sớm' : 'Vườn Nhà', 'RAU XANH · CỦ QUẢ', second ? 'R' : 'V', second ? 'rust' : 'stripe', '#36563b');
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
    ? stallFrame(parent, m, x, 'Hương Mùa', 'HOA CẮM BÌNH', 'M', 'blue', '#4b6044')
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
    : stallFrame(parent, m, x, 'Ga Nhỏ', 'CÀ PHÊ · BẠC XỈU', 'G', 'rust', '#463930');
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

function foodStall(parent, m, x, type) {
  const names = [
    ['Nồi Phố', 'PHỞ BÒ · BÚN NÓNG', 'P', 'stripe'],
    ['Bếp Than', 'THỊT XIÊN · ĐỒ NƯỚNG', 'B', 'rust'],
    ['Lò Bánh', 'BÁNH MÌ NÓNG', 'L', 'blue'],
    ['Chè Nhà', 'CHÈ · SỮA ĐẬU NÀNH', 'C', 'stripe'],
  ];
  const [name, subtitle, logo, style] = names[type];
  const stall = stallFrame(parent, m, x, name, subtitle, logo, style, '#723c30');
  table(stall, m, 0, 1.34, 3.44);
  if (type === 0) {
    container(stall, m, -0.75, 0.77, 1.28, 0.36, 0.42, m.silver, 'pot');
    container(stall, m, 0.12, 0.77, 1.31, 0.24, 0.32, m.silver, 'pot');
    for (let i = 0; i < 7; i++) container(stall, m, 0.91 + (i % 2) * 0.26,
      0.77 + Math.floor(i / 2) * 0.043, 1.38, 0.12, 0.070, m.enamel, 'bowl');
    rod(stall, m.silver, [0.20, 1.07, 1.24], [0.51, 1.43, 1.26], 0.017);
  } else if (type === 1) {
    box(stall, m.silver, 0, 0.89, 1.33, 2.02, 0.22, 0.54);
    box(stall, m.coffee, 0, 1.011, 1.33, 1.93, 0.027, 0.49);
    for (let i = 0; i < 16; i++) {
      const u = (i - 7.5) * 0.113;
      box(stall, m.silver, u, 1.043, 1.33, 0.019, 0.020, 0.51);
      rod(stall, m.basket, [u, 1.066, 1.11], [u, 1.066, 1.72], 0.010);
      for (let j = 0; j < 4; j++) mesh(stall, leafGeo, m.produce[(i + j) % 3], u, 1.091,
        1.19 + j * 0.084, 0.048, 0.038, 0.051);
    }
  } else if (type === 2) {
    for (const y of [0.86, 1.16, 1.46]) {
      box(stall, m.sill, 0.06, y, 1.32, 2.66, 0.044, 0.53);
      for (let i = 0; i < 9; i++) {
        const loaf = mesh(stall, bodyGeo, m.bread, (i - 4) * 0.29, y + 0.103, 1.34, 0.11, 0.071, 0.22);
        loaf.rotation.y = 0.19 - (i % 3) * 0.16;
        box(stall, m.enamel, loaf.position.x, y + 0.164, 1.34, 0.029, 0.008, 0.16).rotation.y = loaf.rotation.y;
      }
    }
    for (const side of [-1, 1]) for (const z of [1.08, 1.58]) {
      rod(stall, m.silver, [side * 1.26, 0.78, z], [side * 1.26, 1.71, z], 0.024);
    }
    box(stall, m.silver, 0.06, 1.70, 1.33, 2.69, 0.039, 0.53);
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
  const stall = stallFrame(parent, m, x, 'Chỉ Nâu', 'VẢI CUỘN · KIM CHỈ', 'C', 'rust', '#784336');
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
  const poleGeometry = new T.CylinderGeometry(0.067, 0.11, height + 0.34, 8);
  for (const x of poleLocations.slice(1)) {
    const pole = groupAt(parent, 'Wooden power pole with porcelain insulators', x, 0, setback);
    mesh(pole, poleGeometry, m.timber, 0, (height + 0.34) / 2, 0);
    box(pole, m.darkWood, 0.073, height, 0, 0.145, 0.11, 1.64);
    for (const side of [-1, 1]) {
      rod(pole, m.darkWood, [0.073, height - 0.45, 0], [0.073, height - 0.056, side * 0.61], 0.033);
      rod(pole, m.wire, [-0.041, 1.12, side * 0.074], [-0.029, height - 0.61, side * 0.061], 0.008);
    }
    for (const z of connectors) {
      const insulator = mesh(pole, cylinderGeo, m.enamel, 0.071, height + 0.10, z, 0.042, 0.088, 0.042);
      insulator.rotation.z = 0.12;
      mesh(pole, cylinderGeo, m.wire, 0.066, height + 0.148, z, 0.036, 0.027, 0.036);
    }
  }
  for (let i = 1; i < poleLocations.length; i++) {
    const start = poleLocations[i - 1] + 0.066, end = poleLocations[i] + 0.066;
    for (const [wire, offset] of connectors.entries()) {
      const z = setback + offset;
      const path = [0, 0.25, 0.5, 0.75, 1].map(t => [
        T.MathUtils.lerp(start, end, t),
        height + 0.157 - (0.33 + (end - start) * 0.024 + wire * 0.022) * 4 * t * (1 - t),
        z + Math.sin(t * Math.PI) * (wire - 1.5) * 0.025,
      ]);
      tube(parent, m.wire, path, 0.008);
    }
  }
}

function batchStatic(root) {
  root.updateMatrixWorld(true);
  const groups = new Map();
  root.traverse(mesh => {
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    if (!geometry.hasAttribute('uv')) {
      geometry.setAttribute('uv', new T.BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
    }
    geometry.applyMatrix4(mesh.matrixWorld);
    if (!groups.has(mesh.material)) groups.set(mesh.material, []);
    groups.get(mesh.material).push(geometry);
  });
  const result = new T.Group();
  for (const [surface, geometries] of groups) {
    const merged = mergeGeometries(geometries);
    result.add(new T.Mesh(merged, surface));
    geometries.forEach(geometry => geometry.dispose());
  }
  return result;
}

export function buildMarketPreview(scene) {
  let seed = 98133;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const m = buildKit(random);
  scene.background = new T.Color('#e8caa2');
  scene.fog = new T.FogExp2('#e7c39a', 0.008);
  const road = material('#655445');
  const stone = ['#8f7764', '#aa9178', '#9c836d', '#baa188'].map(hex => material(hex));
  const width = 18.4;
  const pitches = [-6.9, -2.3, 2.3, 6.9];
  const sections = [
    { name: 'Vải và đồ gia dụng', facades: [2, 0, 1, 3], stalls(street) {
      textilesAnnex(street, m, pitches[0]);
      fabricStall(street, m, pitches[1]);
      householdStall(street, m, pitches[2]);
      const shutter = groupAt(street, 'Closed side entry', pitches[3]);
      awning(shutter, m, 4.3, 'blue');
      box(shutter, m.teal[0], 0, 1.24, 0.34, 3.77, 2.44, 0.13);
      foldingGate(shutter, m, 0, 3.62);
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
    box(street, m.sill, 0, -0.04, 1.35, width, 0.19, 3.42);
    for (let col = 0; col < 40; col++) for (let row = 0; row < 6; row++) {
      const x = (col - 19.5) * 0.46 + (row % 2 ? 0.08 : -0.08);
      box(street, stone[(col * 7 + row) % 4], x, 0.056, 0.45 + row * 0.47,
        0.451, 0.05 + random() * 0.013, 0.455);
    }
    facades.forEach((variant, j) => townhouse(street, m, {
      x: pitches[j], width: 4.57, height: [5.34, 5.50, 5.15, 5.91][variant], variant,
    }, random));
    stalls(street);
    const section = batchStatic(street);
    section.name = 'Market · ' + name;
    tile.add(section);
  });
  const overhead = new T.Group();
  overhead.position.set(9.5, -0.17, 4.70);
  overhead.rotation.y = -Math.PI / 2;
  overheadLines(overhead, m, [-64.4,-59.8,-50.6,-41.4,-32.2,-23,-13.8,-4.6,4.6,9.2]);
  tile.add(batchStatic(overhead));

  const strip = new T.Group();
  strip.name = 'Moving Vietnamese market';
  const length = width * sections.length;
  for (let copy = -2; copy <= 1; copy++) {
    const sectionSequence = tile.clone();
    sectionSequence.position.z = copy * length;
    strip.add(sectionSequence);
  }
  scene.add(strip);
  // Merchants and facades move together as one street. Their different depths supply perspective parallax.
  return { layers: [{ strip, length, speed: 0.98 }] };
}
