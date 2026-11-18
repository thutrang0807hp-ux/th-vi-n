import * as T from './vendor/three-r164/three.module.min.js';
import { mergeGeometries } from './vendor/three-r164/BufferGeometryUtils.js';

const fullTurn = 2 * Math.PI;
const color = value => new T.Color(value);
const matte = (hex, emission = 0.08) => new T.MeshStandardMaterial({
  color: hex, roughness: 0.85, emissive: hex, emissiveIntensity: emission,
});

class Facets {
  positions = [];
  colors = [];

  triangle(a, b, c, tint) {
    this.positions.push(...a, ...b, ...c);
    for (let vertex = 0; vertex < 3; vertex++) this.colors.push(tint.r, tint.g, tint.b);
  }

  quad(a, b, c, d, tint) {
    this.triangle(a, b, c, tint);
    this.triangle(a, c, d, tint);
  }

  geometry() {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(this.colors, 3));
    geometry.computeVertexNormals();
    return geometry;
  }
}

const painted = (extra = {}) => new T.MeshStandardMaterial({
  color: 0xffffff, vertexColors: true, roughness: 0.87, side: T.DoubleSide, ...extra,
});

function canalCenter(z, side) {
  const opening = Math.exp(-((z + 6) ** 2) / 109);
  return 14.9 + 3.8 * Math.sin(z * 0.061 + side * 0.48) + 0.9 * Math.sin(z * 0.144) - opening * 3.75;
}

function canalHalfWidth(z) {
  return 1.67 + 1.05 * Math.exp(-((z + 6) ** 2) / 92);
}

function groundAt(x, z) {
  const side = Math.sign(x);
  const distance = Math.abs(x);
  const terrain = -0.28 + Math.sin(z * 0.10 + distance * 0.33) * 0.053
    + T.MathUtils.smoothstep(distance, 35, 83) * (1.3 + Math.cos(z * 0.06) * 0.30);
  const bank = Math.abs(distance - canalCenter(z, side)) - (canalHalfWidth(z) - 1.67);
  return T.MathUtils.lerp(-0.99, terrain, T.MathUtils.smoothstep(bank, 1.36, 2.30));
}

function riceClump(variant, random, distant) {
  const mesh = new Facets();
  const dark = color('#9c8e36'), green = color('#8d9e3a');
  const leafSun = color('#bfc749'), stem = color('#c2bd48'), grain = color('#ffd253');
  for (let stalk = 0; stalk < (distant ? 3 : 4); stalk++) {
    const angle = stalk * 2.43 + variant * 0.76;
    const dx = Math.cos(angle), dz = Math.sin(angle);
    const base = 0.025 + random() * 0.065;
    const h = 0.50 + random() * 0.24 + variant * 0.021;
    const droop = 0.12 + random() * 0.15;
    const points = [[dx * base, 0, dz * base], [dx * (base + 0.022), h * 0.56, dz * (base + 0.022)],
      [dx * (base + droop * 0.43), h, dz * (base + droop * 0.43)],
      [dx * (base + droop), h - 0.13, dz * (base + droop)]];
    for (let k = 0; k < points.length - 1; k++) {
      const [a, b] = [points[k], points[k + 1]];
      const width = 0.010 - k * 0.002;
      mesh.quad([a[0] + dz * width, a[1], a[2] - dx * width], a, b,
        [b[0] + dz * width, b[1], b[2] - dx * width], stem);
      mesh.quad(a, [a[0] + dx * width, a[1], a[2] + dz * width],
        [b[0] + dx * width, b[1], b[2] + dz * width], b, dark);
    }
    for (let k = 0; k < 2; k++) {
      const lean = angle + (k === 0 ? -0.86 : 1.23);
      const lx = Math.cos(lean), lz = Math.sin(lean);
      const a = [dx * base, 0.08 + k * 0.13, dz * base];
      const middle = [a[0] + lx * 0.13, a[1] + 0.21, a[2] + lz * 0.13];
      const tip = [a[0] + lx * 0.26, a[1] + 0.35 - k * 0.025, a[2] + lz * 0.26];
      const left = [middle[0] + lz * 0.026, middle[1] - 0.015, middle[2] - lx * 0.026];
      const right = [middle[0] - lz * 0.026, middle[1] - 0.015, middle[2] + lx * 0.026];
      mesh.quad(a, left, tip, middle, leafSun);
      mesh.quad(a, middle, tip, right, green);
    }
    const grains = distant ? 4 : 8;
    for (let k = 0; k < grains; k++) {
      const t = k / grains, lift = h + 0.014 - 0.15 * t * t;
      const reach = base + droop * (0.36 + 0.64 * t);
      const side = k % 2 ? -1 : 1;
      const size = (distant ? 0.031 : 0.028) * (1 - t * 0.34);
      const x = dx * reach + dz * size * side, z = dz * reach - dx * size * side;
      const tip = [x + dx * size, lift + size * 0.76, z + dz * size];
      const end = [x - dx * size, lift - size, z - dz * size];
      const a = [x + dz * size * 0.65, lift - size * 0.08, z - dx * size * 0.65];
      const b = [x - dz * size * 0.65, lift - size * 0.08, z + dx * size * 0.65];
      mesh.triangle(tip, a, end, grain.clone().multiplyScalar(0.96 + random() * 0.22));
      mesh.triangle(tip, end, b, grain.clone().multiplyScalar(0.82 + random() * 0.16));
    }
  }
  return mesh.geometry();
}

function palmModel(variant, random) {
  const mesh = new Facets();
  const bark = color('#8c7350');
  const grass = [color('#689339'), color('#8eab43'), color('#baca58'), color('#4b7535'), color('#a8b94d')];
  const height = 4.4 + variant * 0.55;
  const bend = 0.24 + 0.12 * variant;
  const trunkRings = 18;
  const trunkPoint = (ring, i) => {
    const t = ring / trunkRings, angle = i / 8 * fullTurn;
    const radius = 0.19 - 0.076 * t + (ring % 2 ? 0.013 : 0);
    return [bend * t * t + Math.cos(angle) * radius, height * t, Math.sin(angle) * radius];
  };
  for (let ring = 0; ring < trunkRings; ring++) {
    for (let i = 0; i < 8; i++) {
      const value = (ring % 2 ? 0.82 : 1.04) + random() * 0.24;
      mesh.quad(trunkPoint(ring, i), trunkPoint(ring + 1, i), trunkPoint(ring + 1, i + 1),
        trunkPoint(ring, i + 1), bark.clone().multiplyScalar(value));
    }
  }

  for (let frond = 0; frond < 23; frond++) {
    const angle = frond * 2.40 + variant * 0.45;
    const tier = frond % 4;
    const dx = Math.cos(angle), dz = Math.sin(angle);
    const reach = 0.36 + random() * 0.27 + tier * 0.045;
    const lift = [-0.43, -0.09, 0.32, 0.66][tier];
    const heart = [bend + dx * reach, height + lift, dz * reach];
    const start = [bend, height - 0.18, 0];
    mesh.quad(start, [start[0] + dz * 0.05, start[1], -dx * 0.05],
      [heart[0] + dz * 0.048, heart[1], heart[2] - dx * 0.048], heart, grass[3]);
    let previousEdge;
    for (let lobe = 0; lobe < 11; lobe++) {
      const spread = (lobe - 5) * 0.217;
      const axis = angle + spread;
      const outward = (0.93 + random() * 0.27) * (1 - Math.abs(lobe - 5) * 0.062);
      const rise = [-0.98, -0.37, 0.18, 0.65][tier];
      const tip = [heart[0] + Math.cos(axis) * outward, heart[1] + rise * outward,
        heart[2] + Math.sin(axis) * outward];
      const fold = [T.MathUtils.lerp(heart[0], tip[0], 0.63), heart[1] + rise * 0.40 + 0.11,
        T.MathUtils.lerp(heart[2], tip[2], 0.63)];
      const width = 0.103 - Math.abs(lobe - 5) * 0.007;
      const left = [fold[0] + Math.sin(axis) * width, fold[1] - 0.09, fold[2] - Math.cos(axis) * width];
      const right = [fold[0] - Math.sin(axis) * width, fold[1] - 0.09, fold[2] + Math.cos(axis) * width];
      const tint = grass[(lobe + frond) % grass.length];
      mesh.quad(heart, left, tip, fold, tint);
      mesh.quad(heart, fold, tip, right, grass[(tier + 1) % grass.length].clone().multiplyScalar(0.86));
      if (previousEdge) mesh.triangle(heart, previousEdge, left, grass[tier]);
      previousEdge = right;
    }
  }
  return mesh.geometry();
}

function sky(scene) {
  scene.background.set('#d4d7cd');
  scene.fog = new T.FogExp2('#e3ded0', 0.0064);
  const dome = new T.Mesh(new T.SphereGeometry(148, 36, 24), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false,
    uniforms: {
      blue: { value: color('#6ca5f7') },
      horizon: { value: color('#f6d9bf') },
      sunTint: { value: color('#ffe5aa') },
    },
    vertexShader: `
      varying vec3 ray;
      void main(){ ray=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
    `,
    fragmentShader: `
      uniform vec3 blue, horizon, sunTint;
      varying vec3 ray;
      void main(){
        vec3 d=normalize(ray);
        vec3 col=mix(horizon,blue,smoothstep(-0.04,0.34,d.y));
        vec3 sunDir=normalize(vec3(0.87,0.275,-0.51));
        float a=distance(d,sunDir);
        col=mix(col,sunTint,0.34*exp(-a*9.0)+0.76*(1.0-smoothstep(0.022,0.031,a)));
        gl_FragColor=vec4(col,1.0);
        #include <colorspace_fragment>
      }
    `,
  }));
  dome.renderOrder = -1;
  scene.add(dome);
}

function mountains(root, random) {
  const ridges = [
    { x: 70, span: 12, relief: 12, dark: '#46724e', light: '#80a167', shift: 2 },
    { x: 91, span: 14, relief: 18, dark: '#527986', light: '#83a2a2', shift: 6 },
    { x: 116, span: 11, relief: 23, dark: '#748fa7', light: '#a0afbe', shift: 0 },
  ];
  const crest = [0.13, 0.30, 0.73, 0.87, 0.72, 0.45, 0.34, 0.49, 0.74, 0.90, 0.87, 0.64, 0.51, 0.29, 0.15];
  const profiles = [0, 0.29, 0.58, 0.79, 1];
  const vegetation = [];
  for (const side of [-1, 1]) {
    for (const ridge of ridges) {
      const vertices = [];
      const columns = 41;
      for (let row = 0; row < profiles.length; row++) {
        for (let i = 0; i < columns; i++) {
          const pos = i / (columns - 1) * (crest.length - 2) + ridge.shift + (side < 0 ? 2.3 : 0);
          const k = Math.floor(pos);
          const mass = T.MathUtils.lerp(crest[k % crest.length], crest[(k + 1) % crest.length], pos - k);
          const z = -90 + i * 180 / (columns - 1) + (random() - 0.5) * 3.2;
          const foot = 0.14 + Math.sin(i * 0.53) * 0.035;
          const h = ridge.relief * (foot + mass * profiles[row]) + random() * 0.85;
          vertices.push([side * (ridge.x + row * ridge.span / 4 + Math.sin(i * 0.71) * 2.4), h, z]);
        }
      }
      const facets = new Facets();
      const shade = color(ridge.dark), light = color(ridge.light);
      for (let row = 0; row < profiles.length - 1; row++) {
        for (let i = 0; i < columns - 1; i++) {
          const a = row * columns + i, b = a + 1, c = a + columns, d = c + 1;
          const tint = shade.clone().lerp(light, 0.26 + random() * 0.52 + Math.sin(i * 0.53) * 0.16);
          facets.triangle(vertices[a], vertices[b], vertices[c], tint);
          facets.triangle(vertices[b], vertices[d], vertices[c], tint.clone().multiplyScalar(0.91));
          if (ridge === ridges[0]) {
            for (let tree = 0; tree < 5; tree++) {
              const u = random(), v = random();
              const triangle = u + v < 1 ? [a, b, c] : [d, c, b];
              const weights = u + v < 1 ? [1 - u - v, u, v] : [u + v - 1, 1 - u, 1 - v];
              const point = [0, 0, 0];
              triangle.forEach((index, corner) => {
                for (let axis = 0; axis < 3; axis++) point[axis] += vertices[index][axis] * weights[corner];
              });
              vegetation.push([point, 0.22 + random() * 0.47, tint.clone().lerp(color('#4d784e'), 0.44)]);
            }
          }
        }
      }
      root.add(new T.Mesh(facets.geometry(), new T.MeshBasicMaterial({
        vertexColors: true, side: T.DoubleSide, toneMapped: false,
      })));
    }
  }
  const canopy = new T.InstancedMesh(new T.IcosahedronGeometry(1, 0),
    new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), vegetation.length);
  const pose = new T.Object3D();
  vegetation.forEach(([[x, y, z], size, tint], i) => {
    pose.position.set(x, y + size * 0.30, z);
    pose.rotation.y = random() * fullTurn;
    pose.scale.set(size * 1.14, size * 0.70, size);
    pose.updateMatrix();
    canopy.setMatrixAt(i, pose.matrix);
    canopy.setColorAt(i, tint);
  });
  canopy.computeBoundingSphere();
  root.add(canopy);
}

function farmhouse(root, x, z, side, scale, random) {
  const plaster = matte('#e3be87', 0.17), wood = matte('#71543e'), window = matte('#514637');
  const terra = ['#a45234', '#b8613b', '#be7047', '#924731'].map(hex => matte(hex, 0.19));
  plaster.side = T.DoubleSide;
  const y = groundAt(x, z);
  const home = new T.Group();
  home.position.set(x, y, z);
  home.rotation.y = side === 1 ? 0 : Math.PI;
  home.scale.setScalar(scale);
  const batches = new Map();
  function piece(geometry, material, px, py, pz, angle = 0) {
    geometry.rotateZ(angle).translate(px, py, pz);
    if (!batches.has(material)) batches.set(material, []);
    batches.get(material).push(geometry);
  }
  function box(w, h, d, material, px, py, pz, angle = 0) {
    piece(new T.BoxGeometry(w, h, d), material, px, py, pz, angle);
  }
  box(4.0, 0.19, 6.35, wood, -0.20, 0.09, 0);
  box(3.25, 1.69, 5.78, plaster, 0.18, 1.02, 0);
  box(1.27, 0.15, 6.27, plaster, -2.14, 0.19, 0);
  for (const pz of [-2.64, 0, 2.64]) box(0.12, 1.72, 0.14, wood, -2.64, 1.03, pz);
  box(0.11, 1.29, 0.83, window, -1.46, 0.87, 0);
  for (const pz of [-1.75, 1.75]) {
    box(0.09, 0.63, 0.86, wood, -1.48, 1.13, pz);
    for (let louver = 0; louver < 5; louver++) box(0.12, 0.052, 0.72, window, -1.49, 0.91 + louver * 0.1, pz);
  }
  const roofPitch = 0.44;
  for (const end of [-1, 1]) {
    const gable = new Facets();
    gable.triangle([-1.47, 1.84, 2.88 * end], [1.83, 1.84, 2.88 * end], [0.18, 2.69, 2.88 * end], color('#fff0cc'));
    const cap = gable.geometry();
    cap.deleteAttribute('color');
    home.add(new T.Mesh(cap, plaster));
    const slope = new T.PlaneGeometry(2.06, 6.5);
    slope.rotateX(-Math.PI / 2);
    piece(slope, terra[0], 0.18 + end * 0.93, 2.31, 0, -end * roofPitch);
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 21; col++) {
        const distance = 0.14 + row * 0.26;
        const z = -3.13 + col * 0.31 + (row % 2 ? 0.08 : 0);
        box(0.30, 0.057, 0.28, terra[Math.floor(random() * terra.length)],
          0.18 + end * distance, 2.76 - distance * 0.49, z, -end * roofPitch);
      }
    }
  }
  box(1.35, 0.125, 6.38, terra[1], -2.09, 1.9, 0, 0.20);
  box(0.15, 0.14, 6.58, terra[2], 0.18, 2.74, 0);
  for (const [material, parts] of batches) {
    const geometries = parts.map(part => part.index ? part.toNonIndexed() : part);
    home.add(new T.Mesh(mergeGeometries(geometries), material));
    for (const geometry of new Set([...parts, ...geometries])) geometry.dispose();
  }
  root.add(home);
}

function strawStack(root, x, z, scale, random) {
  const straw = new Facets();
  const rings = [[0.91, 0], [1, 0.25], [0.86, 0.63], [0.61, 1.0], [0.26, 1.39], [0.02, 1.52]];
  const hay = color('#d6a345');
  const sides = 23;
  const jitter = Array.from({ length: sides }, () => 0.88 + random() * 0.23);
  const point = (row, sector) => {
    const angle = sector * fullTurn / sides;
    const [radius, height] = rings[row];
    const r = radius * jitter[sector % sides];
    return [Math.cos(angle) * r, height + Math.sin(sector * 2.74) * 0.045, Math.sin(angle) * r];
  };
  for (let row = 0; row < rings.length - 1; row++) {
    for (let i = 0; i < sides; i++) {
      const tint = hay.clone().multiplyScalar(0.79 + random() * 0.30 + row * 0.038);
      straw.quad(point(row, i), point(row + 1, i), point(row + 1, i + 1), point(row, i + 1), tint);
    }
  }
  const stack = new T.Mesh(straw.geometry(), painted());
  stack.position.set(x, groundAt(x, z), z);
  stack.scale.setScalar(scale);
  root.add(stack);
}

function outdoorShadows(root, placements) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(48, 48, 3, 48, 48, 47);
  gradient.addColorStop(0, 'rgba(43, 51, 38, 0.70)');
  gradient.addColorStop(0.48, 'rgba(43, 51, 38, 0.45)');
  gradient.addColorStop(1, 'rgba(43, 51, 38, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 96, 96);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  const surface = new T.MeshBasicMaterial({ map, transparent: true, depthWrite: false, side: T.DoubleSide });
  const footprints = [];
  for (const [x, z, length, width] of placements) {
    const geometry = new T.PlaneGeometry(length, width, 7, 4).rotateX(-Math.PI / 2).rotateY(0.44);
    const points = geometry.attributes.position;
    for (let i = 0; i < points.count; i++) {
      const px = x - length * 0.29 + points.getX(i);
      const pz = z + length * 0.15 + points.getZ(i);
      points.setXYZ(i, px, groundAt(px, pz) + 0.045, pz);
    }
    footprints.push(geometry);
  }
  const soft = new T.Mesh(mergeGeometries(footprints), surface);
  soft.renderOrder = 1;
  root.add(soft);
  for (const geometry of footprints) geometry.dispose();
}

export function buildTriTon(scene) {
  let seed = 22871;
  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  sky(scene);
  const root = new T.Group();
  root.name = 'Mùa vàng Tri Tôn';
  scene.add(root);
  const land = color('#a5a348'), fallow = color('#dbb348'), path = color('#c3a067'), wet = color('#65845b');
  const soil = painted({ emissive: '#494725', emissiveIntensity: 0.25 });
  const water = new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide, toneMapped: false });
  const earth = new Facets(), irrigated = new Facets();
  const blue = color('#76adc2'), deep = color('#4c8d9a'), shore = color('#8d9880');
  for (const side of [-1, 1]) {
    const groundPoint = (x, z) => [x * side, groundAt(x * side, z), z];
    for (let x = 4.2; x < 94; x += 0.78) {
      for (let z = -66; z < 68; z += 1.26) {
        const gap = Math.abs(x - canalCenter(z, side)) - (canalHalfWidth(z) - 1.67);
        const headland = (Math.floor((z + 61) / 9.5) !== Math.floor((z + 62.26) / 9.5) || (x > 30.1 && x < 31.5));
        const tone = gap < 2.16 ? wet : headland ? path : x > 26 ? fallow : land;
        const tint = tone.clone().multiplyScalar(0.85 + random() * 0.25 + Math.sin(x * 6.6) * 0.063);
        const a = groundPoint(x, z), b = groundPoint(x + 0.78, z);
        const c = groundPoint(x + 0.78, z + 1.26), d = groundPoint(x, z + 1.26);
        earth.triangle(a, b, c, tint);
        earth.triangle(a, c, d, tint.clone().multiplyScalar(0.94 + random() * 0.10));
      }
    }
    for (let z = -66; z < 68; z += 0.83) {
      for (let row = 0; row < 7; row++) {
        const a = -1.67 + row * (3.34 / 7), b = a + 3.34 / 7;
        const p = (offset, along) => [side * (canalCenter(along, side) + offset * canalHalfWidth(along) / 1.67), -0.63, along];
        const tint = deep.clone().lerp(blue, 0.22 + random() * 0.77);
        if (row === 0 || row === 6) tint.lerp(shore, 0.33);
        irrigated.triangle(p(a, z), p(b, z), p(a, z + 0.83), tint);
        irrigated.triangle(p(b, z), p(b, z + 0.83), p(a, z + 0.83), tint.clone().multiplyScalar(0.91));
      }
    }
  }
  root.add(new T.Mesh(earth.geometry(), soil), new T.Mesh(irrigated.geometry(), water));

  const bladeMaterial = painted({ emissive: '#b58c27', emissiveIntensity: 0.18 });
  bladeMaterial.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      outgoingLight = mix(outgoingLight, diffuseColor.rgb * 1.30, 0.42);
      #include <opaque_fragment>
    `);
  };
  const pose = new T.Object3D();
  const riceColors = ['#fff5ca', '#ffea9b', '#ffe895', '#f7df9e', '#fff8d6'].map(color);
  for (const side of [-1, 1]) {
    for (const [min, max, spacing, far] of [[4.7, 23.8, 0.43, false], [23.8, 58, 0.72, true]]) {
      const zLimit = far ? 54 : 34;
      const sectionLength = 12;
      const sectionCount = Math.ceil(zLimit * 2 / sectionLength);
      const fields = Array.from({ length: sectionCount }, () => [[], [], [], []]);
      const shapes = Array.from({ length: 4 }, (_, i) => riceClump(i, random, far));
      for (let row = min; row < max; row += spacing) {
        for (let column = -zLimit; column < zLimit; column += spacing * 1.04) {
          const z = column + (random() - 0.5) * spacing * 0.65;
          const x = row + Math.sin(column * 0.13) * 0.22 + random() * spacing * 0.44;
          const y = groundAt(side * x, z);
          const boundary = (z + 66) % 9.5;
          if (y < -0.42 || Math.abs(x - canalCenter(z, side)) < canalHalfWidth(z) + 0.74 ||
            boundary < 0.50 || (x > 30.0 && x < 31.75)) continue;
          const house = side === 1 ? Math.abs(x - 33) < 3.0 && Math.abs(z - 14) < 4.5
            || Math.abs(x - 39) < 2.7 && Math.abs(z + 14) < 4.0 : Math.abs(x - 33) < 2.8 && Math.abs(z - 1) < 4.2;
          const section = T.MathUtils.clamp(Math.floor((z + zLimit) / sectionLength), 0, sectionCount - 1);
          if (!house) fields[section][Math.floor(random() * shapes.length)].push([side * x, y, z, 0.79 + random() * 0.43]);
        }
      }
      for (const section of fields) section.forEach((placements, variant) => {
        if (!placements.length) return;
        const rice = new T.InstancedMesh(shapes[variant], bladeMaterial, placements.length);
        rice.name = far ? 'Middle rice parcels' : 'Foreground rice';
        placements.forEach(([x, y, z, scale], i) => {
          pose.position.set(x, y - 0.04, z);
          pose.rotation.set(0, random() * fullTurn, 0);
          pose.scale.setScalar(scale);
          pose.updateMatrix();
          rice.setMatrixAt(i, pose.matrix);
          rice.setColorAt(i, riceColors[Math.floor(random() * riceColors.length)]);
        });
        rice.computeBoundingSphere();
        root.add(rice);
      });
    }
  }

  const shadowSites = [];
  const palms = [
    [9.1, 10.4, 0.91], [13.1, 17.0, 1.02], [16.7, -9.5, 0.95], [22.2, -20.4, 0.86],
    [29.4, 8.2, 0.66], [31.8, 21.6, 0.85], [37.5, -2.0, 0.73], [40.4, -13, 0.79],
    [46.0, 23.3, 0.82], [49.3, -24, 0.72], [51, 3.4, 0.74], [57, 11, 0.63],
    [60, -8, 0.64], [64, 30, 0.69], [65, -27, 0.73], [67, 16, 0.70],
  ];
  const palmMaterial = painted({ emissive: '#657746', emissiveIntensity: 0.19 });
  const palmGeometries = Array.from({ length: 3 }, (_, i) => palmModel(i, random));
  for (const side of [-1, 1]) {
    palms.forEach(([x, z, size], i) => {
      const px = x * side, pz = side > 0 ? z : z * 0.91 + 9;
      const y = groundAt(px, pz);
      if (y < -0.48) return;
      const palm = new T.Mesh(palmGeometries[i % 3], palmMaterial);
      palm.name = 'Thốt nốt';
      palm.position.set(px, y, pz);
      palm.scale.setScalar(size);
      palm.rotation.y = i * 1.81 + side * 0.78;
      root.add(palm);
      shadowSites.push([px, pz, 6.1 * size, 2.1 * size]);
    });
  }
  for (const [x, z, side, size] of [[33, 14, 1, 0.94], [39, -14, 1, 0.85], [-33, 1, -1, 0.96]]) {
    farmhouse(root, x, z, side, size, random);
    shadowSites.push([x, z, 7.2 * size, 5.75 * size]);
  }
  for (const [x, z, s] of [[22.4, -5.5, 0.92], [30.8, 21.5, 1.13], [36, 16.5, 0.94],
    [44.5, -18.1, 0.95], [43.1, -16.0, 0.57], [-24.8, 3, 0.95], [-37, 15, 1.02]]) {
    if (groundAt(x, z) < -0.45) continue;
    strawStack(root, x, z, s, random);
    shadowSites.push([x, z, 3.4 * s, 2.0 * s]);
  }
  outdoorShadows(root, shadowSites);

  const glints = new Facets(), reflected = color('#c2d9c9'), light = color('#e9dcc0');
  for (const side of [-1, 1]) {
    for (let i = 0; i < 126; i++) {
      const z = -50 + random() * 98;
      const x = side * (canalCenter(z, side) + (random() - 0.5) * canalHalfWidth(z) * 1.5);
      const w = 0.07 + random() * 0.20, h = random() * 0.05 + 0.021;
      glints.quad([x - w, -0.616, z], [x, -0.616, z + h], [x + w, -0.616, z],
        [x, -0.616, z - h], reflected.clone().lerp(light, random()));
    }
  }
  root.add(new T.Mesh(glints.geometry(), water));
  mountains(root, random);

  const foliage = new T.IcosahedronGeometry(1, 1);
  const forest = new T.InstancedMesh(foliage, matte('#91a473', 0.13), 142);
  const forestPalette = ['#96a665', '#718e56', '#a6ac76', '#6e8f64'].map(color);
  for (let i = 0; i < forest.count; i++) {
    const side = i % 2 ? -1 : 1;
    const z = -66 + Math.floor(i / 2) * 1.9 + random() * 2;
    const x = side * (59 + random() * 12);
    pose.position.set(x, groundAt(x, z) + 0.53, z);
    pose.rotation.set(0, random() * fullTurn, 0);
    pose.scale.set(1.2 + random() * 1.7, 0.63 + random() * 0.85, 1.1 + random() * 1.6);
    pose.updateMatrix();
    forest.setMatrixAt(i, pose.matrix);
    forest.setColorAt(i, forestPalette[i % forestPalette.length]);
  }
  root.add(forest);

  const cloudPositions = [[87, 19.5, -29, 3.4], [90, 25.1, -14, 4.1], [97, 19.9, 7, 2.1],
    [110, 24.4, 29, 3.6], [108, 20.1, 46, 3.24], [93, 22.6, -56, 2.8]];
  const clouds = new T.InstancedMesh(new T.IcosahedronGeometry(1, 2),
    matte('#fff5e8', 0.45), cloudPositions.length * 12);
  const cloudTints = ['#fffaf2', '#f2dce0', '#ffeddd', '#fbe5df'].map(color);
  let ci = 0;
  for (const side of [-1, 1]) {
    cloudPositions.forEach(([x, y, z, r], i) => {
      for (let blob = 0; blob < 6; blob++) {
        const u = (blob - 2.5) / 2.5;
        const size = r * (0.46 + (1 - Math.abs(u)) * 0.46);
        pose.position.set(x * side + random() * 2, y + (1 - u * u) * r * 0.69, z + u * r * 2.5);
        pose.rotation.set(blob * 0.06, i * 0.42, 0);
        pose.scale.set(size * 0.88, size * (i % 2 ? 0.88 : 0.62), size * 1.19);
        pose.updateMatrix();
        clouds.setMatrixAt(ci, pose.matrix);
        clouds.setColorAt(ci, cloudTints[(blob + i) % cloudTints.length]);
        ci++;
      }
    });
  }
  root.add(clouds);

  const wings = new Facets(), white = color('#fff1da');
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const x = side * (62 + i * 1.2), y = 13.4 + Math.cos(i * 0.71) * 1.27, z = -31 + i * 2.03;
      const p = (u, v, w) => [x + u, y + v, z + w];
      wings.triangle(p(0, 0, 0), p(0.09, 0.28, -0.52), p(-0.12, 0.06, -0.24), white);
      wings.triangle(p(0, 0, 0), p(-0.21, 0.06, 0.26), p(0.12, 0.31, 0.51), white);
    }
  }
  root.add(new T.Mesh(wings.geometry(), new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide })));
  return { layers: [] };
}
