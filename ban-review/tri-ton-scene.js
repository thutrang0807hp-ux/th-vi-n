import * as T from './vendor/three-r164/three.module.min.js';
import { mergeGeometries } from './vendor/three-r164/BufferGeometryUtils.js';

const fullTurn = 2 * Math.PI;
const fieldLength = 132;
const fieldHalf = fieldLength / 2;
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

function approach(z) {
  return Math.sin((z + 6) * Math.PI / fieldLength) * fieldLength / Math.PI;
}

function canalCenter(z, side) {
  const phase = z * fullTurn / fieldLength;
  const opening = Math.exp(-(approach(z) ** 2) / 109);
  return 14.9 + 3.8 * Math.sin(phase + side * 0.48) + 0.9 * Math.sin(phase * 3) - opening * 3.75;
}

function canalHalfWidth(z) {
  return 1.67 + 1.05 * Math.exp(-(approach(z) ** 2) / 92);
}

function groundAt(x, z) {
  const side = Math.sign(x);
  const distance = Math.abs(x);
  const phase = z * fullTurn / fieldLength;
  const terrace = T.MathUtils.smoothstep(distance, 35, 83);
  const terrain = -0.28 + Math.sin(phase * 2 + distance * 0.33) * 0.053
    + terrace * (1.3 + Math.cos(phase) * 0.30);
  const bank = Math.abs(distance - canalCenter(z, side)) - (canalHalfWidth(z) - 1.67);
  return T.MathUtils.lerp(-0.99, terrain, T.MathUtils.smoothstep(bank, 1.36, 2.30));
}

function riceClump(variant, random, distant) {
  const mesh = new Facets();
  const dark = color('#bda033'), green = color('#9da331');
  const leafSun = color('#d9c83b'), stem = color('#d8bb38'), grain = color('#ffd01e');
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

function bambooMaterials(random) {
  function grain(base, strands, thatch) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < (thatch ? 940 : 260); i++) {
      ctx.strokeStyle = strands[Math.floor(random() * strands.length)];
      ctx.lineWidth = 0.5 + random() * 1.5;
      const x = random() * 256, y = random() * 256;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (random() - 0.5) * (thatch ? 14 : 3), y + 7 + random() * (thatch ? 48 : 90));
      ctx.stroke();
    }
    if (!thatch) {
      for (let y = 9; y < 256; y += 17) {
        ctx.fillStyle = y % 2 ? '#96744855' : '#dec19666';
        ctx.fillRect(0, y, 256, 2);
      }
    }
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    return map;
  }

  const bamboo = matte('#e8c998', 0.16);
  bamboo.map = grain('#c6a06b', ['#8a663c', '#d9b77e', '#a57b4b', '#f1d6a0', '#956f4580'], false);
  const roof = matte('#ddc59e', 0.12);
  roof.map = grain('#b49b6b', ['#dbc695', '#967d55', '#c8ab78', '#8e7350', '#e7d3a7'], true);
  return { bamboo, roof, frame: matte('#765439', 0.10), shade: matte('#47372a') };
}

function farmhouse(root, x, z, side, scale, materials) {
  const { bamboo, roof, frame, shade } = materials;
  const home = new T.Group();
  home.position.set(x, groundAt(x, z), z);
  home.rotation.y = side === 1 ? -0.13 : Math.PI + 0.17;
  home.scale.setScalar(scale);
  const batches = new Map();
  function box(w, h, d, material, px, py, pz, angle = 0) {
    const geometry = new T.BoxGeometry(w, h, d);
    geometry.rotateZ(angle).translate(px, py, pz);
    if (!batches.has(material)) batches.set(material, []);
    batches.get(material).push(geometry);
  }
  const floor = 0.57;
  for (const px of [-1.51, 1.45]) {
    for (const pz of [-2.52, 0, 2.52]) box(0.15, 1.05, 0.16, frame, px, 0.37, pz);
  }
  box(3.48, 0.14, 5.64, frame, 0, floor, 0);
  box(3.0, 1.65, 5.48, bamboo, 0, 1.47, 0);
  for (let i = 0; i < 14; i++) box(0.71, 0.047, 0.37, bamboo, -1.81, floor - 0.006, -2.58 + i * 0.39);
  for (const pz of [-2.68, -1.43, 0, 1.43, 2.68]) box(0.09, 1.77, 0.086, frame, -1.53, 1.40, pz);
  for (const py of [0.69, 1.18, 1.72, 2.20]) box(0.09, 0.065, 5.50, frame, -1.54, py, 0);
  box(0.10, 1.30, 0.83, shade, -1.60, 1.24, 0);
  for (const pz of [-1.86, 1.86]) {
    box(0.11, 0.65, 0.79, shade, -1.60, 1.47, pz);
    box(0.19, 0.067, 0.92, frame, -1.63, 1.11, pz);
    box(0.55, 0.07, 1.03, bamboo, -1.81, 1.83, pz, 0.23);
  }
  for (let step = 0; step < 5; step++) {
    box(0.195, 0.073, 0.77, bamboo, -2.93 + step * 0.18, 0.10 + step * 0.103, 0);
  }
  for (const pz of [-0.40, 0.40]) box(1.14, 0.09, 0.09, frame, -2.53, 0.28, pz, 0.51);
  for (const slope of [-1, 1]) {
    box(2.25, 0.115, 6.24, roof, slope * 0.99, 2.56, 0, -slope * 0.39);
    for (let row = 0; row < 7; row++) {
      const across = 0.18 + row * 0.307;
      box(0.38, 0.048, 6.32 + (row % 2) * 0.10, roof, slope * across, 3.02 - across * 0.43,
        (row % 3 - 1) * 0.032, -slope * 0.40);
    }
    for (const end of [-1, 1]) box(2.21, 0.065, 0.064, frame, slope * 1.04, 2.49, end * 2.90, -slope * 0.39);
  }
  box(0.22, 0.14, 6.40, roof, 0, 3.03, 0);
  for (const [material, parts] of batches) {
    home.add(new T.Mesh(mergeGeometries(parts), material));
    for (const geometry of parts) geometry.dispose();
  }
  root.add(home);
}

function strawStack(root, x, z, scale, random) {
  const mound = new Facets();
  const straw = new Facets();
  const sides = 30;
  const courses = 9;
  const hay = color('#ae803c');
  const tones = ['#664a2d', '#8d602f', '#b08346', '#ca9c58', '#e2b96f'].map(color);
  const oval = 0.82 + random() * 0.16;
  const crownLean = (random() - 0.5) * 0.25;

  function surfacePoint(t, angle, lift = 0) {
    const spread = 1.23 * Math.pow(Math.cos(t * Math.PI / 2), 0.92);
    const skirt = (1 - t) ** 2 * 0.14;
    const lumps = 1 + Math.sin(angle * 3.0 + 0.34) * 0.065
      + Math.cos(angle * 7.0 - t * 7.4) * 0.044;
    const radius = (spread + skirt) * lumps + lift;
    const height = 1.08 * t + (1 - t) * Math.sin(angle * 9.0 + t * 5.0) * 0.037;
    return [Math.cos(angle) * radius + crownLean * t, height, Math.sin(angle) * radius * oval];
  }

  for (let row = 0; row < courses; row++) {
    for (let i = 0; i < sides; i++) {
      const start = i * fullTurn / sides;
      const end = (i + 1) * fullTurn / sides;
      const bottom = row / courses, top = (row + 1) / courses;
      const tint = hay.clone().multiplyScalar(0.62 + bottom * 0.39 + random() * 0.28);
      mound.quad(surfacePoint(bottom, start), surfacePoint(top, start),
        surfacePoint(top, end), surfacePoint(bottom, end), tint);
    }
  }

  // Coarse, crossed ribbons survive the distance from the carriage better than single-pixel lines.
  for (let i = 0; i < 470; i++) {
    const base = random() * 0.985;
    const angle = random() * fullTurn;
    const fall = 0.06 + random() * 0.20;
    const end = Math.max(0.003, base - fall);
    const bend = (random() - 0.5) * 0.36;
    const width = (0.011 + random() * 0.016) / Math.max(0.37, Math.cos(base * Math.PI / 2));
    const tint = tones[Math.floor(random() * tones.length)];
    const lift = 0.018 + random() * 0.019;
    const start = surfacePoint(base, angle, lift);
    const middle = surfacePoint((base + end) / 2, angle + bend * 0.42, lift);
    const tip = surfacePoint(end, angle + bend, lift);
    const lip = surfacePoint((base + end) / 2, angle + bend * 0.42 + width, lift);
    straw.triangle(start, middle, lip, tint);
    straw.triangle(middle, tip, lip, tint);
  }

  for (let i = 0; i < 75; i++) {
    const angle = random() * fullTurn;
    const rootPoint = surfacePoint(0.08 + random() * 0.09, angle, 0.034);
    const elbow = surfacePoint(0.019, angle + 0.025, 0.093 + random() * 0.11);
    const tip = surfacePoint(0.0, angle + (random() - 0.5) * 0.12, 0.17 + random() * 0.23);
    tip[1] = 0.014;
    const edge = [elbow[0] + Math.sin(angle) * 0.034, elbow[1] + 0.015, elbow[2] - Math.cos(angle) * 0.034];
    const tint = tones[Math.floor(random() * tones.length)];
    straw.triangle(rootPoint, elbow, edge, tint);
    straw.triangle(elbow, tip, edge, tint);
  }

  const geometry = mergeGeometries([mound.geometry(), straw.geometry()]);
  const stack = new T.Mesh(geometry, painted({ emissive: '#73502a', emissiveIntensity: 0.12 }));
  stack.name = 'Đống rơm khô';
  stack.position.set(x, groundAt(x, z) + 0.023, z);
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

function buildFieldKite(root) {
  const group = new T.Group();
  group.name = 'Tri Ton kite';
  group.visible = false;
  root.add(group);

  const sail = new Facets();
  const top = [0, 1.1, -0.31], left = [0, 0.16, -1.04];
  const right = [0, 0.41, 1.02], tip = [0, -0.91, 0.20];
  const join = [0.14, 0.23, 0.02];
  const edge = (a, b, t) => a.map((value, i) => T.MathUtils.lerp(value, b[i], t));
  const palette = ['#c94542', '#dd9348', '#ebca65', '#62a769', '#5488b7', '#86599c'].map(color);
  for (const [shoulder, shade] of [[left, 1], [right, 0.88]]) {
    const fold = edge(top, join, 0.64);
    const panelPoint = (t, inner) => t < 0.35
      ? edge(top, inner ? fold : shoulder, t / 0.35)
      : edge(inner ? fold : shoulder, tip, (t - 0.35) / 0.65);
    const cuts = [0, 0.22, 0.35, 0.49, 0.64, 0.81, 1];
    palette.forEach((tint, i) => {
      sail.quad(panelPoint(cuts[i], false), panelPoint(cuts[i + 1], false),
        panelPoint(cuts[i + 1], true), panelPoint(cuts[i], true), tint.clone().multiplyScalar(shade));
    });
  }
  const kite = new T.Mesh(sail.geometry(), new T.MeshBasicMaterial({
    vertexColors: true, side: T.DoubleSide, transparent: true, depthWrite: false,
  }));
  kite.scale.setScalar(0.72);
  group.add(kite);
  const fadeMaterials = [kite.material];

  function dynamicLine(count, hex, parent) {
    const points = new T.BufferAttribute(new Float32Array(count * 3), 3).setUsage(T.DynamicDrawUsage);
    const geometry = new T.BufferGeometry().setAttribute('position', points);
    const line = new T.Line(geometry, new T.LineBasicMaterial({ color: hex, transparent: true, depthWrite: false }));
    line.frustumCulled = false;
    parent.add(line);
    fadeMaterials.push(line.material);
    return points;
  }
  const string = dynamicLine(20, '#594936', group);
  const tails = ['#b9423d', '#8462a6', '#ca9d4a'].map(hex => dynamicLine(22, hex, kite));
  const hitch = new T.Vector3();
  const bridle = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: '#66513b', transparent: true, depthWrite: false }));
  kite.add(bridle);
  fadeMaterials.push(bridle.material);

  return (time, fieldOffset) => {
    const clock = time + 13;
    const cycle = Math.floor(clock / 66);
    const elapsed = clock % 66;
    group.visible = elapsed < 32;
    if (!group.visible) return;
    const side = cycle % 2 === 0 ? 1 : -1;
    const z = side * 8;
    const x = side * 64;
    const landZ = T.MathUtils.euclideanModulo(z - fieldOffset + fieldHalf, fieldLength) - fieldHalf;
    const ground = groundAt(x, landZ) + 0.55;
    const fade = T.MathUtils.smoothstep(elapsed, 0, 4) * (1 - T.MathUtils.smoothstep(elapsed, 27, 32));
    fadeMaterials.forEach((material, i) => { material.opacity = fade * (i === 1 ? 0.43 : 1); });
    kite.position.set(side * (84 + Math.sin(time * 0.48) * 1.2),
      28 + Math.sin(time * 0.81) * 0.55, side * (elapsed - 13) * 1.5 + Math.sin(time * 0.63) * 1.1);
    kite.rotation.set(0.24 + Math.sin(time * 1.4) * 0.12, Math.sin(time * 0.9) * 0.18, -side * 0.21);
    kite.updateMatrix();
    hitch.set(-side * 0.20, 0.13, 0.04);
    if (!bridle.geometry.attributes.position || bridle.userData.side !== side) {
      bridle.geometry.setFromPoints([new T.Vector3(...left), hitch, new T.Vector3(...right)]);
      bridle.userData.side = side;
    }
    hitch.applyMatrix4(kite.matrix);
    for (let i = 0; i < string.count; i++) {
      const t = i / (string.count - 1);
      string.setXYZ(i, T.MathUtils.lerp(x, hitch.x, t) - side * Math.sin(Math.PI * t) * 0.65,
        T.MathUtils.lerp(ground, hitch.y, t), T.MathUtils.lerp(z, hitch.z, t) + Math.sin(Math.PI * t) * 0.70);
    }
    string.needsUpdate = true;
    tails.forEach((tail, index) => {
      for (let i = 0; i < tail.count; i++) {
        const t = i / (tail.count - 1);
        tail.setXYZ(i, t * Math.sin(time * 2.4 - 7 * t + index) * 0.35,
          tip[1] + t * (-1.3 + index * 0.2 + Math.sin(time * 3.1 - 8 * t + index) * 0.23),
          tip[2] + t * (2.4 + index * 0.27));
      }
      tail.needsUpdate = true;
    });
  };
}

export function buildTriTon(scene) {
  let seed = 22871;
  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  sky(scene);
  const near = new T.Group();
  near.name = 'Tri Tôn rice and irrigation';
  const middle = new T.Group();
  middle.name = 'Tri Tôn hamlets';
  const backdrop = new T.Group();
  backdrop.name = 'Bảy Núi';
  scene.add(backdrop);
  const daylight = { value: 0 };
  const land = color('#c8ad37'), fallow = color('#dfb32a'), path = color('#c3a067'), wet = color('#65845b');
  const soil = painted({ emissive: '#494725', emissiveIntensity: 0.25 });
  const water = new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide, toneMapped: false });
  const earth = new Facets(), irrigated = new Facets();
  const blue = color('#76adc2'), deep = color('#4c8d9a'), shore = color('#8d9880');
  for (const side of [-1, 1]) {
    const groundPoint = (x, z) => [x * side, groundAt(x * side, z), z];
    for (let x = 4.2; x < 94; x += 0.78) {
      const step = fieldLength / 105;
      for (let row = 0; row < 105; row++) {
        const z = -fieldHalf + row * step;
        const gap = Math.abs(x - canalCenter(z, side)) - (canalHalfWidth(z) - 1.67);
        const headland = (Math.floor((z + 61) / 9.5) !== Math.floor((z + 62.26) / 9.5) || (x > 30.1 && x < 31.5));
        const tone = gap < 2.16 ? wet : headland ? path : x > 26 ? fallow : land;
        const tint = tone.clone().multiplyScalar(0.85 + random() * 0.25 + Math.sin(x * 6.6) * 0.063);
        const a = groundPoint(x, z), b = groundPoint(x + 0.78, z);
        const c = groundPoint(x + 0.78, z + step), d = groundPoint(x, z + step);
        earth.triangle(a, b, c, tint);
        earth.triangle(a, c, d, tint.clone().multiplyScalar(0.94 + random() * 0.10));
      }
    }
    const step = fieldLength / 160;
    for (let index = 0; index < 160; index++) {
      const z = -fieldHalf + index * step;
      for (let row = 0; row < 7; row++) {
        const a = -1.67 + row * (3.34 / 7), b = a + 3.34 / 7;
        const p = (offset, along) => [side * (canalCenter(along, side) + offset * canalHalfWidth(along) / 1.67), -0.63, along];
        const tint = deep.clone().lerp(blue, 0.22 + random() * 0.77);
        if (row === 0 || row === 6) tint.lerp(shore, 0.33);
        irrigated.triangle(p(a, z), p(b, z), p(a, z + step), tint);
        irrigated.triangle(p(b, z), p(b, z + step), p(a, z + step), tint.clone().multiplyScalar(0.91));
      }
    }
  }
  near.add(new T.Mesh(earth.geometry(), soil), new T.Mesh(irrigated.geometry(), water));

  const bladeMaterial = painted({ emissive: '#b58c27', emissiveIntensity: 0.18 });
  bladeMaterial.onBeforeCompile = shader => {
    shader.uniforms.riceTime = daylight;
    shader.vertexShader = 'uniform float riceTime;\n' + shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      #ifdef USE_INSTANCING
        vec2 seed = instanceMatrix[3].xz;
        float gust = sin(riceTime * 1.64 + seed.x * 0.44 + seed.y * 0.39);
        transformed.x += transformed.y * transformed.y * gust * 0.085;
        transformed.z += transformed.y * transformed.y * sin(riceTime * 1.14 + seed.y * 0.7) * 0.041;
      #endif
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      outgoingLight = mix(outgoingLight, diffuseColor.rgb * 1.59, 0.62);
      #include <opaque_fragment>
    `);
  };
  const pose = new T.Object3D();
  const riceColors = ['#fffadd', '#ffe986', '#ffefaa', '#ffe972', '#fff5b2'].map(color);
  for (const side of [-1, 1]) {
    for (const [min, max, spacing, far] of [[4.7, 17.3, 0.45, false], [17.3, 58, 0.73, true]]) {
      const zLimit = fieldHalf;
      const sectionLength = 12;
      const sectionCount = Math.ceil(zLimit * 2 / sectionLength);
      const fields = Array.from({ length: sectionCount }, () => [[], [], [], []]);
      const shapes = Array.from({ length: 4 }, (_, i) => riceClump(i, random, far));
      for (let row = min; row < max; row += spacing) {
        const columns = Math.ceil(fieldLength / (spacing * 1.04));
        const pitch = fieldLength / columns;
        for (let column = 0; column < columns; column++) {
          const z = -zLimit + (column + 0.18 + random() * 0.65) * pitch;
          const x = row + Math.sin(z * fullTurn / fieldLength * 3) * 0.22 + random() * spacing * 0.44;
          const y = groundAt(side * x, z);
          const boundary = (z + fieldHalf) % (fieldLength / 14);
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
          const height = 1 + (1 - T.MathUtils.smoothstep(Math.abs(x), 5.0, 10.0)) * 0.22;
          pose.scale.set(scale, scale * height, scale);
          pose.updateMatrix();
          rice.setMatrixAt(i, pose.matrix);
          rice.setColorAt(i, riceColors[Math.floor(random() * riceColors.length)]);
        });
        rice.computeBoundingSphere();
        near.add(rice);
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
      const objects = x < 25 ? near : middle;
      objects.add(palm);
      shadowSites.push([objects, px, pz, 6.1 * size, 2.1 * size]);
    });
  }
  const houseMaterials = bambooMaterials(random);
  for (const [x, z, side, size] of [[33, 14, 1, 0.94], [39, -14, 1, 0.85], [-33, 1, -1, 0.96]]) {
    farmhouse(middle, x, z, side, size, houseMaterials);
    shadowSites.push([middle, x, z, 7.2 * size, 5.75 * size]);
  }
  for (const [x, z, s] of [[22.4, -5.5, 0.92], [30.8, 21.5, 1.13], [36, 16.5, 0.94],
    [44.5, -18.1, 0.95], [43.1, -16.0, 0.57], [-24.8, 3, 0.95], [-37, 15, 1.02]]) {
    if (groundAt(x, z) < -0.45) continue;
    strawStack(middle, x, z, s, random);
    shadowSites.push([middle, x, z, 3.4 * s, 2.0 * s]);
  }
  for (const layer of [near, middle]) {
    outdoorShadows(layer, shadowSites.filter(([group]) => group === layer).map(([, ...site]) => site));
  }

  const glints = new Facets(), reflected = color('#c2d9c9'), light = color('#e9dcc0');
  for (const side of [-1, 1]) {
    for (let i = 0; i < 126; i++) {
      const z = -fieldHalf + 0.30 + random() * (fieldLength - 0.60);
      const x = side * (canalCenter(z, side) + (random() - 0.5) * canalHalfWidth(z) * 1.5);
      const w = 0.07 + random() * 0.20, h = random() * 0.05 + 0.021;
      glints.quad([x - w, -0.616, z], [x, -0.616, z + h], [x + w, -0.616, z],
        [x, -0.616, z - h], reflected.clone().lerp(light, random()));
    }
  }
  near.add(new T.Mesh(glints.geometry(), water));
  const ranges = new T.Group();
  mountains(ranges, random);
  backdrop.add(ranges);

  const foliage = new T.IcosahedronGeometry(1, 0);
  const forest = new T.InstancedMesh(foliage, matte('#9caf84', 0.13), 408);
  const forestPalette = ['#96a665', '#718e56', '#a6ac76', '#6e8f64'].map(color);
  for (let i = 0; i < forest.count; i++) {
    const cluster = Math.floor(i / 3);
    const side = cluster % 2 ? -1 : 1;
    const z = -fieldHalf + (Math.floor(cluster / 2) + 0.5) * fieldLength / 68;
    const x = side * (66 + Math.sin(cluster * 0.43) * 3 + random() * 4);
    const size = 0.40 + random() * 0.75;
    pose.position.set(x, groundAt(x, z) + 0.25 + size * 0.30, z + (random() - 0.5) * 1.8);
    pose.rotation.set(random() * 0.31, random() * fullTurn, random() * 0.32);
    pose.scale.set(size * (0.93 + random() * 0.4), size * 0.63, size);
    pose.updateMatrix();
    forest.setMatrixAt(i, pose.matrix);
    forest.setColorAt(i, forestPalette[i % forestPalette.length]);
  }
  forest.computeBoundingSphere();
  middle.add(forest);

  const distantTrees = [];
  for (const side of [-1, 1]) {
    for (let group = 0; group < 18; group++) {
      const z = -fieldHalf + (group + 0.57) * fieldLength / 18;
      const x = side * (53 + random() * 7);
      for (let i = 0; i < 3; i++) {
        distantTrees.push([x + (random() - 0.5) * 4, z + (i - 1) * 1.11, 0.68 + random() * 0.63]);
      }
      if (group % 4 === 1) {
        const palm = new T.Mesh(palmGeometries[group % 3], palmMaterial);
        palm.position.set(x + side * 4.4, groundAt(x + side * 4.4, z), z + 2.0);
        palm.rotation.y = group * 1.67;
        palm.scale.setScalar(0.51 + random() * 0.19);
        middle.add(palm);
      }
    }
  }
  const smallTrunks = new T.InstancedMesh(new T.CylinderGeometry(0.042, 0.078, 0.97, 5).translate(0, 0.48, 0),
    matte('#817351', 0.12), distantTrees.length);
  const distantLeaves = new T.InstancedMesh(new T.IcosahedronGeometry(1, 0), matte('#b0b67c', 0.20),
    distantTrees.length * 3);
  distantTrees.forEach(([x, z, size], i) => {
    const y = groundAt(x, z);
    pose.position.set(x, y, z);
    pose.rotation.set(0, 0, (random() - 0.5) * 0.16);
    pose.scale.setScalar(size);
    pose.updateMatrix();
    smallTrunks.setMatrixAt(i, pose.matrix);
    for (let lobe = 0; lobe < 3; lobe++) {
      pose.position.set(x + Math.cos(lobe * 2.4 + i) * 0.34 * size,
        y + (0.92 + random() * 0.39) * size, z + (lobe - 1) * 0.32 * size);
      pose.scale.set(size * (0.37 + random() * 0.23), size * 0.48, size * 0.47);
      pose.updateMatrix();
      distantLeaves.setMatrixAt(i * 3 + lobe, pose.matrix);
      distantLeaves.setColorAt(i * 3 + lobe, forestPalette[(i + lobe) % forestPalette.length]);
    }
  });
  smallTrunks.computeBoundingSphere();
  distantLeaves.computeBoundingSphere();
  middle.add(smallTrunks, distantLeaves);

  // Blend the radial silhouettes of overlapping lobes into one faceted mesh per shape.
  function cloudGeometry(lobes) {
    const geometry = new T.IcosahedronGeometry(1, 5);
    const vertices = geometry.attributes.position;
    const tint = [];
    const base = color('#bcc6d8');
    const highlight = color('#fff4e2');
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
      let radius = 0;
      for (const [cy, cz, sx, sy, sz] of lobes) {
        const a = (x / sx) ** 2 + (y / sy) ** 2 + (z / sz) ** 2;
        const b = y * cy / sy ** 2 + z * cz / sz ** 2;
        const c = (cy / sy) ** 2 + (cz / sz) ** 2 - 1;
        const root = b * b - a * c;
        if (root < 0) continue;
        const edge = (b + Math.sqrt(root)) / a;
        const blend = Math.max(0, 0.21 - Math.abs(edge - radius));
        radius = Math.max(radius, edge) + blend * blend / 0.84;
      }
      const height = y * radius;
      vertices.setXYZ(i, x * radius, Math.max(height, -0.52 + z * 0.05), z * radius);
      const light = T.MathUtils.smoothstep(height + x * 0.20, -0.58, 0.85);
      const shade = base.clone().lerp(highlight, 0.16 + light * 0.84);
      tint.push(shade.r, shade.g, shade.b);
    }
    geometry.setAttribute('color', new T.Float32BufferAttribute(tint, 3));
    geometry.computeVertexNormals();
    return geometry;
  }
  const cloudShapes = [
    [[0, 0, 0.84, 0.76, 1.73], [0.38, -0.64, 0.77, 0.92, 1.0],
      [0.43, 0.46, 0.69, 0.99, 0.88], [-0.17, 1.47, 0.53, 0.44, 0.98]],
    [[0, 0, 0.73, 0.60, 1.83], [0.46, 0.38, 0.75, 0.87, 0.95],
      [0.10, -0.89, 0.66, 0.55, 1.21], [-0.14, 1.56, 0.49, 0.37, 0.78]],
    [[0, 0, 0.70, 0.50, 1.73], [0.20, -0.59, 0.68, 0.56, 1.34],
      [0.09, 0.80, 0.64, 0.58, 1.25]],
  ];
  const cloudBands = [
    [[87, 23, -37, 4.4], [94, 28, 35, 5.1], [-88, 25, 19, 4.9], [-94, 26, -45, 3.9]],
    [[109, 27, -7, 3.9], [115, 32, 65, 4.5], [-109, 26, -12, 3.6], [-115, 34, 46, 4.8]],
    [[130, 24, -61, 3.8], [127, 24, 17, 3.1], [-130, 24, 66, 3.6], [-127, 22, -31, 3.4]],
  ];
  const cloudMaterial = new T.MeshStandardMaterial({
    vertexColors: true, roughness: 1, flatShading: true,
    emissive: '#c6b9bd', emissiveIntensity: 0.32,
  });
  const cloudMeshes = cloudBands.map((band, layer) => {
    const batch = new T.InstancedMesh(cloudGeometry(cloudShapes[layer]), cloudMaterial, band.length);
    batch.name = 'Tri Ton cloud band ' + (layer + 1);
    band.forEach(([x, y, z, size], i) => {
      pose.position.set(x, y, z);
      pose.rotation.set(0, ((i % 3) - 1) * 0.22, 0);
      pose.scale.setScalar(size);
      pose.updateMatrix();
      batch.setMatrixAt(i, pose.matrix);
    });
    batch.computeBoundingSphere();
    backdrop.add(batch);
    return batch;
  });

  const wings = new Facets(), white = color('#fff1da');
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const x = side * (62 + i * 1.2), y = 13.4 + Math.cos(i * 0.71) * 1.27, z = -31 + i * 2.03;
      const p = (u, v, w) => [x + u, y + v, z + w];
      wings.triangle(p(0, 0, 0), p(0.09, 0.28, -0.52), p(-0.12, 0.06, -0.24), white);
      wings.triangle(p(0, 0, 0), p(-0.21, 0.06, 0.26), p(0.12, 0.31, 0.51), white);
    }
  }
  backdrop.add(new T.Mesh(wings.geometry(), new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide })));
  function repeat(tile, speed) {
    const strip = new T.Group();
    strip.name = tile.name;
    for (let i = -2; i <= 2; i++) {
      const copy = tile.clone();
      copy.position.z = i * fieldLength;
      strip.add(copy);
    }
    scene.add(strip);
    return { strip, length: fieldLength, speed };
  }

  const layers = [repeat(near, 6.9), repeat(middle, 3.0)];
  const flyKite = buildFieldKite(backdrop);
  return {
    layers,
    animateAmbient(time) {
      daylight.value = time;
      flyKite(time, layers[1].strip.position.z);
      cloudMeshes.forEach((clouds, layer) => {
        const phase = layer * 0.72;
        clouds.position.z = (Math.sin(time * (0.026 - layer * 0.005) + phase) - Math.sin(phase)) * 18;
        clouds.position.x = Math.sin(time * 0.018 + phase) * (2.1 - layer * 0.45);
      });
      ranges.position.z = Math.sin(time * 0.018) * 3.5;
    },
  };
}
