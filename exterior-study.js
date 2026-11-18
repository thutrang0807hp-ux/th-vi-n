import * as T from './vendor/three-r164/three.module.min.js';
import { GLTFLoader } from './vendor/three-r164/GLTFLoader.js';
import { mergeGeometries } from './vendor/three-r164/BufferGeometryUtils.js';

const loader = new GLTFLoader();
const models = ['Pine_1', 'Pine_4', 'TwistedTree_3', 'Rock_Medium_3', 'Rock_Medium_2',
  'Grass_Wispy_Short', 'Grass_Common_Short', 'Grass_Common_Tall', 'Bush_Common', 'Flower_3_Single'];
export async function loadExteriorStudy() {
  return Object.fromEntries(await Promise.all(models.map(async name => [
    name, (await loader.loadAsync(new URL('./kit/' + name + '.gltf', import.meta.url).href)).scene
  ])));
}

const surface = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: 0.87, ...extra });
const tone = (color, intensity = 0.18) => surface(color, { emissive: color, emissiveIntensity: intensity });
const ivory = tone('#f4d7a9', 0.32);
const tile = tone('#bd5741', 0.30);
const oak = tone('#ad7950', 0.22);
const dark = surface('#4a312a');

function tulipCup() {
  const points = [];
  const colors = [];
  const indices = [];
  const sides = 12;
  const rings = [[0.012, 0.51], [0.107, 0.55], [0.151, 0.65], [0.135, 0.79], [0.092, 0.81],
    [0.069, 0.72], [0.013, 0.63]];
  rings.forEach(([radius, height], row) => {
    for (let i = 0; i < sides; i++) {
      const angle = (i + (row % 2) * 0.26) * Math.PI * 2 / sides;
      const seam = i % 2 ? -1 : 1;
      const lip = row === 3 || row === 4 ? 0.022 * seam : 0;
      const r = radius * (1 + seam * 0.11);
      points.push(Math.sin(angle) * r, height + lip, Math.cos(angle) * r);
      const value = [0.43, 0.63, 0.80, 1.0, 0.96, 0.63, 0.33][row] * (i % 3 === 1 ? 0.83 : 1);
      colors.push(value, value * 0.96, value * 0.94);
      if (row) {
        const a = (row - 1) * sides + i, b = (row - 1) * sides + (i + 1) % sides;
        const c = row * sides + i, d = row * sides + (i + 1) % sides;
        indices.push(a, b, c, b, d, c);
      }
    }
  });
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  const faceted = geometry.toNonIndexed();
  geometry.dispose();
  faceted.computeVertexNormals();
  return faceted;
}

function grassCard() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const blades = [
    [50, 24, 33, 12], [63, 55, 7, 14], [65, 87, 16, 11], [58, 36, 51, 13],
    [78, 105, 53, 14], [44, 20, 64, 13], [76, 87, 30, 11], [55, 51, 28, 10],
    [66, 71, 38, 13], [81, 117, 79, 10], [37, 13, 84, 12], [68, 56, 63, 11],
  ];
  const shades = ['#a3b64c', '#6b8b32', '#92b442', '#bfd176'];
  blades.forEach(([base, tip, top, width], i) => {
    const gradient = ctx.createLinearGradient(base, 128, tip, top);
    gradient.addColorStop(0, '#536d27');
    gradient.addColorStop(0.53, shades[i % shades.length]);
    gradient.addColorStop(1, '#c2d678');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(base - width * 0.5, 128);
    ctx.quadraticCurveTo(base - width * 0.25, top + 24, tip, top);
    ctx.quadraticCurveTo(base + width * 0.8, top + 20, base + width * 0.5, 128);
    ctx.fill();
  });
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 4;
  const first = new T.PlaneGeometry(1.2, 0.82).translate(0, 0.41, 0);
  const second = first.clone().rotateY(Math.PI / 2);
  const geometry = mergeGeometries([first, second]);
  first.dispose();
  second.dispose();
  return [geometry, new T.MeshStandardMaterial({
    map, roughness: 1, alphaTest: 0.44, side: T.DoubleSide, emissive: '#525c26', emissiveIntensity: 0.45,
  })];
}

export function plantExteriorStudy(scene, kit, ground, length) {
  const root = new T.Group();
  root.name = 'Tulip meadow tile';
  scene.add(root);
  const random = T.MathUtils.seededRandom;
  random(3279);
  const dummy = new T.Object3D();
  function put(mesh, index, x, y, z, scale, turn, color) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, turn, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    if (color) mesh.setColorAt(index, color);
  }
  function add(geometry, material, x, y, z) {
    const object = new T.Mesh(geometry, material);
    object.position.set(x, y, z);
    root.add(object);
    return object;
  }
  function box(material, x, y, z, w, h, d) {
    return add(new T.BoxGeometry(w, h, d), material, x, y, z);
  }
  function stand(name, placements, tint, emission = 0.18) {
    kit[name].updateMatrixWorld(true);
    kit[name].traverse(part => {
      if (!part.isMesh) return;
      const matte = part.material.clone();
      matte.roughness = 0.92;
      if (tint) matte.color.set(tint);
      if (matte.map) matte.emissiveMap = matte.map;
      matte.emissive.set('#ffffff');
      matte.emissiveIntensity = emission;
      const geometry = part.geometry.clone().applyMatrix4(part.matrixWorld);
      const batch = new T.InstancedMesh(geometry, matte, placements.length);
      placements.forEach(([x, z, scale, lift = 0], i) => {
        put(batch, i, x, ground(x, z) + lift, z, scale, random() * Math.PI * 2);
      });
      batch.computeBoundingSphere();
      root.add(batch);
    });
  }

  const colors = ['#f12b32', '#ffcf35', '#ffe9bb', '#f75c93', '#b470d2', '#ffad2a', '#ff83ad'];
  const halfLength = length / 2;
  const sectionCount = Math.ceil(length / 12);
  const sectionLength = length / sectionCount;
  const sections = Array.from({ length: sectionCount }, () => []);
  const columns = Math.ceil(length / 0.52);
  const spacing = length / columns;
  const cream = new T.Color('#fff1d6');
  for (let row = 0; row < 30; row++) {
    for (let column = 0; column < columns; column++) {
      const z = -halfLength + (column + 0.2 + random() * 0.65) * spacing;
      const phase = z * Math.PI * 2 / length;
      const x = 5.78 + row * 0.33 + 0.52 * Math.sin(phase * 2) + 0.14 * random();
      if (ground(x, z) < -0.52) continue;
      const band = row < 6 && random() < 0.56 ? (random() < 0.68 ? 0 : 3) :
        Math.floor(row / 3.6 + 1.05 * Math.sin(phase) + 2) % colors.length;
      const tint = new T.Color(colors[band]).lerp(cream, random() * 0.16);
      const section = Math.floor((z + halfLength) / sectionLength);
      sections[section].push([x, z, 0.69 + random() * 0.44, random() * Math.PI * 2, tint]);
    }
  }
  const leaf = new T.PlaneGeometry(0.21, 0.51, 2, 4);
  const positions = leaf.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const along = positions.getY(i) / 0.51 + 0.5;
    const across = positions.getX(i) / 0.10;
    positions.setXYZ(i, positions.getX(i) * Math.sin(Math.PI * along), 0.13 + along * 0.49,
      along * along * 0.33 - across * across * 0.027 * Math.sin(Math.PI * along));
  }
  leaf.computeVertexNormals();
  const opposite = leaf.clone().rotateY(Math.PI * 0.83).translate(0, -0.045, 0);
  const stem = new T.CylinderGeometry(0.012, 0.019, 0.54, 5).translate(0, 0.27, 0);
  const foliage = mergeGeometries([leaf, opposite, stem]);
  const cup = tulipCup();
  const petalMaterial = surface('#ffffff', { vertexColors: true, flatShading: true, side: T.DoubleSide });
  const leafMaterial = tone('#739e36', 0.20);
  leafMaterial.side = T.DoubleSide;
  for (const flowers of sections) {
    const bulbs = new T.InstancedMesh(cup, petalMaterial, flowers.length);
    bulbs.name = 'Tulip blooms';
    const greens = new T.InstancedMesh(foliage, leafMaterial, flowers.length);
    flowers.forEach(([x, z, scale, angle, tint], i) => {
      const y = ground(x, z);
      put(bulbs, i, x, y, z, scale, angle, tint);
      put(greens, i, x, y, z, scale, angle);
    });
    bulbs.computeBoundingSphere();
    greens.computeBoundingSphere();
    root.add(bulbs, greens);
  }

  const fenceBay = length / Math.ceil(length / 3);
  for (let z = -halfLength; z < halfLength - fenceBay / 2; z += fenceBay) {
    const y = ground(5.2, z);
    box(oak, 5.2, y + 0.38, z, 0.16, 0.77, 0.17);
    const rail = box(oak, 5.2, (y + ground(5.2, z + fenceBay)) / 2 + 0.50,
      z + fenceBay / 2, 0.10, 0.12, fenceBay);
    rail.rotation.x = -Math.atan2(ground(5.2, z + fenceBay) - y, fenceBay);
  }
  const meadow = [];
  const banks = [];
  const verge = [];
  for (let i = 0; i < Math.round(5700 * length / 68); i++) {
    const x = 4.55 + random() * 30;
    const z = -halfLength + random() * length;
    if (ground(x, z) < -0.52) continue;
    const wave = 0.55 + 0.45 * Math.sin(x * 1.55 + z * 0.58) * Math.cos(z * 0.43);
    if (random() > wave + (x < 17 ? 0.39 : 0.18)) continue;
    if (x < 6.4) verge.push([x, z, 0.17 + random() * 0.22]);
    else if (ground(x + 0.75, z) < -0.52 || ground(x - 0.75, z) < -0.52) {
      banks.push([x, z, 0.36 + random() * 0.34]);
    } else meadow.push([x, z, 0.22 + random() * 0.28]);
  }
  const closeGrass = meadow.filter(([x]) => x < 7.9);
  const cards = meadow.filter(([x]) => x >= 7.9);
  for (let i = 0; i < Math.round(6200 * length / 56); i++) {
    const x = 4.55 + random() * 13.2;
    const z = -halfLength + random() * length;
    if (ground(x, z) > -0.51) cards.push([x, z, 0.25 + random() * 0.29]);
  }
  const [cardGeometry, cardMaterial] = grassCard();
  const carpet = new T.InstancedMesh(cardGeometry, cardMaterial, cards.length);
  cards.forEach(([x, z, scale], i) => put(carpet, i, x, ground(x, z), z, scale, random() * Math.PI * 2));
  carpet.computeBoundingSphere();
  root.add(carpet);
  stand('Grass_Common_Short', closeGrass, '#a9c675', 0.25);
  stand('Grass_Common_Tall', banks, '#99ab60', 0.20);
  stand('Grass_Wispy_Short', verge, '#c2c977', 0.26);
  stand('Rock_Medium_3', [[5.4, 1.6, 0.32], [5.55, 10.9, 0.24], [18, -12, 0.46], [26, 14, 0.66]], '#dabec1');
  stand('Rock_Medium_2', [[5.2, -8, 0.29], [5.7, 1.0, 0.18], [14.9, 17, 0.30], [24, -18, 0.68]], '#c1bac5');
  stand('Bush_Common', [[6.1, -15, 0.42], [6.25, 10, 0.32], [29, 1, 0.72], [35, -22, 0.54]], '#b7c981');
  stand('Flower_3_Single', [[5.1, -8, 0.15], [5.9, 10.8, 0.13], [5.05, 4.3, 0.13]], null);
  stand('Pine_1', [[29, -21, 0.73], [37, 8, 0.70], [27, 16, 0.62], [41, -5, 0.63], [44, 21, 0.72]], '#c5c995', 0.40);
  stand('Pine_4', Array.from({ length: 29 }, (_, i) => [
    44 + random() * 13, -52 + i * 3.7 + random() * 2.2, 0.48 + random() * 0.55
  ]), '#a6c2b2', 0.36);

  // Reuse the authored winding bark and build a new blossom canopy for this study.
  const cherry = kit.TwistedTree_3;
  cherry.updateMatrixWorld(true);
  let bark;
  cherry.traverse(part => {
    if (part.isMesh && part.material.name === 'Bark_TwistedTree') bark = part;
  });
  const barkMaterial = bark.material.clone();
  barkMaterial.emissive.set('#763744');
  barkMaterial.emissiveIntensity = 0.31;
  const crownGeometry = new T.IcosahedronGeometry(1, 1);
  const crownPositions = crownGeometry.attributes.position;
  for (let i = 0; i < crownPositions.count; i++) {
    const x = crownPositions.getX(i), y = crownPositions.getY(i), z = crownPositions.getZ(i);
    const r = 0.87 + 0.16 * Math.cos(x * 8 + z * 6) * Math.sin(y * 9 - z * 3);
    crownPositions.setXYZ(i, x * r, y * r * 0.78, z * r);
  }
  crownGeometry.computeVertexNormals();
  const blossom = surface('#ffffff', { flatShading: true, emissive: '#ffb9bc', emissiveIntensity: 0.26 });
  const anchors = [[0, 14, 0], [-2.0, 11.7, 0.6], [3.6, 11, 0], [2.5, 9.6, -3.2],
    [-2.9, 9.2, 2.8], [0.4, 11.8, -3.9], [1.6, 13, 2.6]];
  const cherries = [[10.1, -2.7, 0.44, 1.27], [30, 18, 0.42, -1.0], [38, -16, 0.42, 3.0]];
  const lobesPerAnchor = 69;
  const clusters = new T.InstancedMesh(crownGeometry, blossom, cherries.length * anchors.length * lobesPerAnchor);
  const pinks = ['#ed83a4', '#f99eb8', '#fbb4c4', '#ffd1da', '#ffe1d9'].map(color => new T.Color(color));
  let index = 0;
  for (const [x, z, scale, turn] of cherries) {
    const y = ground(x, z);
    const trunk = add(bark.geometry.clone().applyMatrix4(bark.matrixWorld), barkMaterial, x, y, z);
    trunk.rotation.y = turn;
    trunk.scale.set(scale, scale * 0.77, scale);
    for (const [a, height, b] of anchors) {
      for (let i = 0; i < lobesPerAnchor; i++) {
        const angle = random() * Math.PI * 2;
        const spread = Math.sqrt(random()) * (i < 25 ? 2.4 : 2.95);
        const dx = (a + Math.cos(angle) * spread) * scale;
        const dz = (b + Math.sin(angle) * spread) * scale;
        const lift = (random() - 0.43) * (i < 25 ? 2.7 : 3.9);
        dummy.position.set(x + Math.cos(turn) * dx + Math.sin(turn) * dz,
          y + (height + lift) * scale * 0.77,
          z - Math.sin(turn) * dx + Math.cos(turn) * dz);
        dummy.rotation.set((random() - 0.5) * 1.2, angle, (random() - 0.5) * 1.4);
        dummy.scale.setScalar(scale * (i < 25 ? 0.62 + random() * 0.66 : 0.22 + random() * 0.43));
        dummy.updateMatrix();
        clusters.setMatrixAt(index, dummy.matrix);
        clusters.setColorAt(index++, pinks[Math.min(4, Math.floor(random() * 4 + (lift > 0 ? 1 : 0)))]);
      }
    }
  }
  clusters.computeBoundingSphere();
  root.add(clusters);

  const millX = 27, millZ = -3.9;
  const base = ground(millX, millZ);
  add(new T.CylinderGeometry(0.78, 1.22, 4.0, 10), ivory, millX, base + 2, millZ);
  add(new T.ConeGeometry(1.13, 1.55, 10), tile, millX, base + 4.60, millZ);
  box(dark, millX - 1.05, base + 0.64, millZ, 0.32, 1.25, 0.55);
  box(dark, millX - 0.83, base + 2.45, millZ + 0.43, 0.22, 0.46, 0.34);
  add(new T.SphereGeometry(0.23, 10, 7), oak, millX - 1.15, base + 3.56, millZ);
  for (let blade = 0; blade < 4; blade++) {
    const angle = Math.PI * blade / 2 + 0.76;
    const arm = box(dark, millX - 1.18, base + 3.56 + 1.34 * Math.cos(angle),
      millZ + 1.34 * Math.sin(angle), 0.13, 2.68, 0.105);
    arm.rotation.x = angle;
    for (let rung = 0; rung < 9; rung++) {
      const r = 0.92 + rung * 0.19;
      const sail = box(oak, millX - 1.21, base + 3.56 + r * Math.cos(angle),
        millZ + r * Math.sin(angle), 0.07, 0.06, 0.51);
      sail.rotation.x = angle;
    }
  }

  for (const [x, z, scale] of [[41, -19, 1], [34, 25, 0.80], [46, 18, 0.72]]) {
    const y = ground(x, z);
    box(ivory, x, y + scale * 0.88, z, 1.9 * scale, 1.76 * scale, 3.0 * scale);
    add(new T.CylinderGeometry(0, 1.60 * scale, 1.15 * scale, 4, 1),
      tile, x, y + scale * 2.28, z).rotation.y = Math.PI / 4;
    box(dark, x - 0.96 * scale, y + 0.44 * scale, z + 0.41 * scale, 0.05, 0.86 * scale, 0.36 * scale);
  }

  const cloudGeometry = new T.IcosahedronGeometry(1, 1);
  const cloudMaterial = surface('#fff2e5', { flatShading: true, emissive: '#ebd5dc', emissiveIntensity: 0.35 });
  const cloudShapes = [
    [[0, 0, 0, 1.0], [0.15, 0.1, -0.85, 0.68], [-0.05, -0.12, 0.83, 0.69],
      [0.19, 0.39, 0.06, 0.71], [-0.16, -0.08, 1.42, 0.39], [0.10, -0.11, -1.45, 0.36]],
    [[0, 0.08, 0, 1.0], [0.09, -0.25, -0.77, 0.72], [-0.12, -0.19, 0.95, 0.68],
      [0.16, -0.38, -1.47, 0.41], [0.05, -0.44, 1.48, 0.33]],
  ];
  const clouds = [[82, 20, -28, 2.8, 1], [101, 24, 26, 3.6, 0], [111, 19, 51, 2.7, 1],
    [107, 28, 65, 2.8, 1], [100, 20, -57, 3.0, 0], [76, 18, 7, 2.0, 1],
    [123, 30, -9, 3.1, 0], [114, 20, 88, 3.6, 1], [111, 23, -103, 3.6, 1]];
  const clumpCount = clouds.reduce((count, cloud) => count + cloudShapes[cloud[4]].length, 0);
  const skyClouds = new T.InstancedMesh(cloudGeometry, cloudMaterial, clumpCount);
  let cloudIndex = 0;
  const sunrise = new T.Color('#fce3d3'), shadow = new T.Color('#d9cce2');
  for (const [x, y, z, size, shape] of clouds) {
    for (const [dx, dy, dz, radius] of cloudShapes[shape]) {
      const r = radius * size;
      dummy.position.set(x + dx * size, y + dy * size, z + dz * size * 1.84);
      dummy.rotation.set(0.15, dz * 0.37, 0.14);
      dummy.scale.set(r * 0.88, r * (shape === 1 ? 0.51 : 0.82), r * (shape === 1 ? 1.94 : 1.37));
      dummy.updateMatrix();
      skyClouds.setMatrixAt(cloudIndex, dummy.matrix);
      skyClouds.setColorAt(cloudIndex++, shadow.clone().lerp(sunrise, 0.61 + dy * 0.25));
    }
  }
  skyClouds.computeBoundingSphere();
  scene.add(skyClouds);

  const ridges = [
    { x: 59, width: 53, relief: 5.8, offset: 0.7, shade: '#536b36', light: '#a0b654' },
    { x: 70, width: 62, relief: 20, offset: 1.8, shade: '#3d632b', light: '#a9c441' },
    { x: 90, width: 52, relief: 30, offset: 3.4, shade: '#506e45', light: '#a5be6e' },
  ];
  const sun = new T.Vector3(-0.66, 0.60, -0.44).normalize();
  const profiles = [0, 0.30, 0.61, 0.84, 1];
  for (const ridge of ridges) {
    const { x, width, relief, offset } = ridge;
    const points = [], triangles = [];
    const peaks = Array.from({ length: width }, (_, i) => {
      const z = i / (width - 1) * 9.3;
      const mass = Math.pow(0.5 + 0.5 * Math.sin(z * 2.6 + offset), 2.1);
      const spur = 0.08 * Math.sin(z * 13.0 + offset) + 0.08 * Math.cos(z * 6.3);
      return relief * Math.max(0.20, 0.22 + mass * 0.78 + spur);
    });
    for (let row = 0; row < profiles.length; row++) {
      for (let i = 0; i < width; i++) {
        const z = -120 + i * 240 / (width - 1) + (random() - 0.5) * 2.4;
        const height = -1.10 + peaks[i] * profiles[row] + (random() - 0.5) * (0.6 + relief * 0.07);
        const slope = (Math.cos(i * 0.61 + offset) * 2.4 + Math.sin(i * 0.27) * 2.3) * Math.sin(row * 0.77);
        points.push(x + row * (relief * 0.115 + 0.82) + slope, height, z);
        if (row && i) {
          const d = row * width + i, c = d - 1, b = d - width, a = b - 1;
          if ((row + i) % 2 === 0) triangles.push(a, c, d, a, d, b);
          else triangles.push(a, c, b, b, c, d);
        }
      }
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3));
    geometry.setIndex(triangles);
    const faces = geometry.toNonIndexed();
    geometry.dispose();
    faces.computeVertexNormals();
    const positions = faces.attributes.position;
    const normals = faces.attributes.normal;
    const colors = [];
    const shade = new T.Color(ridge.shade), light = new T.Color(ridge.light);
    const normal = new T.Vector3();
    const front = new T.Vector3(-1, 0.5, 0);
    for (let i = 0; i < positions.count; i += 3) {
      normal.fromBufferAttribute(normals, i);
      if (normal.dot(front) < 0) normal.negate();
      const daylight = T.MathUtils.clamp(0.50 + normal.dot(sun) * 0.53 + (random() - 0.5) * 0.25, 0, 1);
      const color = shade.clone().lerp(light, daylight);
      for (let vertex = 0; vertex < 3; vertex++) colors.push(color.r, color.g, color.b);
    }
    faces.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    const mountain = new T.Mesh(faces,
      new T.MeshBasicMaterial({ side: T.DoubleSide, vertexColors: true, toneMapped: false }));
    mountain.name = 'Distant mountain ridge';
    scene.add(mountain);
  }
  return root;
}
