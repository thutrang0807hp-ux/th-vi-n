import * as T from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/utils/BufferGeometryUtils.js';

const scene = new T.Scene();
scene.background = new T.Color('#d8a899');
scene.fog = new T.FogExp2('#d8a899', 0.012);

const status = document.querySelector('#status');
const halfCabin = 4.05;
const boothCenter = 2.86;
const aisleLimit = 1.49;
const cameraAisleLimit = 1.59;

const camera = new T.PerspectiveCamera(56, 1, 0.05, 155);
camera.position.set(0, 1.91, 10.8);
camera.lookAt(0, 1.67, -12);

const material = (color, roughness = 0.65, metalness = 0) =>
  new T.MeshStandardMaterial({ color, roughness, metalness });
const walnut = material('#693921', 0.42);
const darkWood = material('#351e17');
const bronze = material('#b77b3b', 0.34, 0.58);
const green = material('#31483a', 0.59);
const seam = material('#182d23');
const pillow = material('#c4a182');
const curtain = material('#c29a79');
const ceiling = material('#895942');
const lightShade = new T.MeshStandardMaterial({
  color: '#ffe4b2', emissive: '#ffac59', emissiveIntensity: 1.15, roughness: 0.45
});
const pink = material('#ed859e', 0.49);
const leather = material('#774828');
const bookColors = ['#793e36', '#36514e', '#a98650', '#525930'].map(color => material(color));

function mesh(geometry, surface, x, y, z) {
  const object = new T.Mesh(geometry, surface);
  object.position.set(x, y, z);
  scene.add(object);
  return object;
}
function box(w, h, d, surface, x, y, z, radius = 0) {
  const geometry = radius ? new RoundedBoxGeometry(w, h, d, 2, radius) : new T.BoxGeometry(w, h, d);
  return mesh(geometry, surface, x, y, z);
}
const sphere = new T.SphereGeometry(1, 18, 12);
function oval(surface, x, y, z, width, height, depth) {
  const object = mesh(sphere, surface, x, y, z);
  object.scale.set(width, height, depth);
  return object;
}
function cylinder(top, bottom, height, surface, x, y, z) {
  return mesh(new T.CylinderGeometry(top, bottom, height, 20), surface, x, y, z);
}
function point(color, intensity, radius, x, y, z) {
  const light = new T.PointLight(color, intensity, radius);
  light.position.set(x, y, z);
  scene.add(light);
}

let seed = 521;
function random() {
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  return seed / 4294967296;
}
function textile() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#721f2e';
  ctx.fillRect(0, 0, 256, 320);
  for (let i = 0; i < 12000; i++) {
    ctx.fillStyle = random() > 0.6 ? '#f2b07c25' : '#160a1c22';
    ctx.fillRect(random() * 256, random() * 320, 1 + random() * 3, 1);
  }
  ctx.strokeStyle = '#ce9464';
  for (const offset of [5, 11, 30, 36]) {
    ctx.lineWidth = offset === 11 ? 3 : 1;
    ctx.strokeRect(offset, -3, 256 - 2 * offset, 326);
  }
  function rosette(x, y, radius) {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.ellipse(0, radius * 0.57, radius * 0.2, radius * 0.48, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  for (let y = 0; y <= 320; y += 20) for (const x of [20, 236]) rosette(x, y, 8);
  for (const y of [0, 160, 320]) rosette(128, y, 49);
  for (const y of [78, 242]) for (const x of [76, 180]) rosette(x, y, 22);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.wrapT = T.RepeatWrapping;
  texture.repeat.y = 10;
  return new T.MeshStandardMaterial({ map: texture, roughness: 0.95 });
}

function buildShell() {
  box(halfCabin * 2 + 0.24, 0.24, 31, darkWood, 0, -0.15, -2);
  const planks = Array.from({ length: 7 }, (_, i) => material(new T.Color('#744327').multiplyScalar(0.8 + i * 0.066), 0.47));
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 22; col++) {
      box(0.365, 0.035, 1.53, planks[Math.floor(random() * planks.length)],
        (col - 10.5) * 0.374, -0.025, -16.7 + row * 1.55);
    }
  }
  const carpet = mesh(new T.PlaneGeometry(2.78, 30.7), textile(), 0, 0.005, -2);
  carpet.rotation.x = -Math.PI / 2;

  const vault = new T.CylinderGeometry(1, 1, 31, 48, 1, true, Math.PI / 2, Math.PI);
  vault.rotateX(Math.PI / 2);
  vault.scale(halfCabin + 0.03, 1.03, 1);
  const vaultLining = ceiling.clone();
  vaultLining.side = T.BackSide;
  mesh(vault, vaultLining, 0, 3, -2);
  for (let z = -16; z <= 13; z += 3.6) {
    const arch = new T.CatmullRomCurve3(Array.from({ length: 25 }, (_, i) => {
      const angle = i * Math.PI / 24;
      return new T.Vector3(Math.cos(angle) * halfCabin, 2.98 + Math.sin(angle) * 1.02, z);
    }));
    mesh(new T.TubeGeometry(arch, 32, 0.05, 7, false), bronze, 0, 0, 0);
    cylinder(0.055, 0.055, 0.18, bronze, 0, 3.88, z);
    oval(lightShade, 0, 3.72, z, 0.25, 0.13, 0.25);
    cylinder(0.26, 0.26, 0.035, bronze, 0, 3.77, z);
    if (z < 10 && z > -13) point('#ffc284', 12, 5.3, 0, 3.57, z);
  }
  for (const side of [-1, 1]) {
    const x = side * halfCabin;
    box(0.19, 0.89, 31, walnut, x, 0.43, -2);
    box(0.29, 0.14, 31, darkWood, x, 0.92, -2);
    box(0.21, 0.38, 31, walnut, x, 3.08, -2);
    box(0.54, 0.045, 31, bronze, x - side * 0.22, 3.14, -2);
    for (let offset = 0; offset < 4; offset++) {
      box(0.028, 0.045, 31, darkWood, x - side * (0.1 + offset * 0.12), 3.177, -2);
    }
    for (let z = -16; z <= 13; z += 3.6) {
      box(0.23, 2.3, 0.2, darkWood, x, 1.99, z);
      box(0.075, 0.045, 3.45, bronze, x, 2.79, z + 1.8);
      for (const direction of [-1, 1]) drape(x, z, side, direction);
      box(0.36, 0.26, 0.67, leather, x - side * 0.2, 3.33, z + 0.9, 0.052);
    }
  }
}

function finishMaterials() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  function texture(surface, grain) {
    const pixels = ctx.createImageData(256, 256);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const warp = x + 4 * Math.sin(y * 0.023 + x * 0.055) + 1.1 * Math.sin(y * 0.11);
      const band = grain ? 13 * Math.sin(warp * 0.22) + 7 * Math.sin(warp * 0.81) : 0;
      const value = 205 + band + (random() - 0.5) * (grain ? 18 : 38);
      const index = (y * 256 + x) * 4;
      pixels.data.set([value, value, value, 255], index);
    }
    ctx.putImageData(pixels, 0, 0);
    const copy = document.createElement('canvas');
    copy.width = copy.height = 256;
    copy.getContext('2d').drawImage(canvas, 0, 0);
    const map = new T.CanvasTexture(copy);
    surface.map = map;
    surface.bumpMap = map;
    surface.bumpScale = grain ? 0.012 : 0.004;
  }
  texture(walnut, true);
  texture(green, false);
  texture(pillow, false);
  texture(curtain, false);
  green.color.set('#405247');
  walnut.color.set('#845035');
  curtain.side = T.DoubleSide;
}

function drape(x, z, side, direction) {
  const geometry = new T.PlaneGeometry(1, 1, 30, 24);
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const u = vertices.getX(i) + 0.5;
    const v = vertices.getY(i) + 0.5;
    const spread = 0.16 + 0.26 * Math.pow(Math.abs(v - 0.44), 0.72);
    const folds = Math.sin(u * Math.PI * 11 + v * 0.38) * (0.018 + 0.057 * Math.abs(v - 0.44));
    vertices.setXYZ(i, -side * (folds + 0.045 * Math.sin(v * Math.PI)),
      1.04 + v * 1.82 + 0.035 * Math.sin(u * Math.PI * 10) * (1 - v),
      direction * (0.08 + u * spread));
  }
  geometry.computeVertexNormals();
  mesh(geometry, curtain, x - side * 0.12, 0, z);
  box(0.12, 0.043, 0.22, bronze, x - side * 0.155, 1.85, z + direction * 0.19, 0.014);
}

const shadeProfile = [
  [0.214, 0], [0.207, 0.054], [0.181, 0.123], [0.134, 0.178], [0.078, 0.199], [0.061, 0.198]
];
function tableLamp(x, z) {
  const profile = [[0, 0], [0.16, 0], [0.16, 0.018], [0.145, 0.035], [0.07, 0.056],
    [0.038, 0.08], [0.025, 0.145], [0.038, 0.171], [0.039, 0.194], [0.024, 0.21], [0.024, 0.3]];
  const lathe = points => new T.LatheGeometry(points.map(([r, y]) => new T.Vector2(r, y)), 24);
  mesh(lathe(profile), bronze, x, 1.03, z);
  // Lathe vertices run from the base of the shade to its crown.
  mesh(lathe(shadeProfile), lightShade, x, 1.29, z);
  for (const [radius, height] of [shadeProfile[0], shadeProfile.at(-1)]) {
    mesh(new T.TorusGeometry(radius, 0.006, 6, 26), bronze, x, 1.29 + height, z).rotation.x = Math.PI / 2;
  }
  for (let panel = 0; panel < 8; panel++) {
    const angle = panel * Math.PI / 4;
    const rib = new T.CatmullRomCurve3(shadeProfile.map(([r, y]) =>
      new T.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r)));
    mesh(new T.TubeGeometry(rib, 8, 0.0035, 4, false), bronze, x, 1.29, z);
  }
  oval(bronze, x, 1.503, z, 0.041, 0.025, 0.041);
}

function boothPadding(x, back, direction) {
  box(1.83, 1.15, 0.30, seam, x, 1.03, back, 0.14);
  for (let channel = 0; channel < 5; channel++) {
    const cushion = box(0.34, 0.93, 0.32, green, x + (channel - 2) * 0.334,
      1.06, back - direction * 0.075, 0.11);
    cushion.rotation.x = direction * 0.055;
  }
}

function buildBooths() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 8, 32, 32, 32);
  gradient.addColorStop(0, '#1f130cba');
  gradient.addColorStop(1, '#1f130c00');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const shadowMaterial = new T.MeshBasicMaterial({
    map: new T.CanvasTexture(canvas), transparent: true, depthWrite: false
  });
  const shadowGeometry = new T.PlaneGeometry(2.7, 1.65);
  shadowGeometry.rotateX(-Math.PI / 2);
  for (const side of [-1, 1]) for (let z = -13.3; z <= 12; z += 3.6) {
    const x = side * boothCenter;
    for (const direction of [-1, 1]) {
      const back = z + direction * 1.29;
      mesh(shadowGeometry, shadowMaterial, x, 0.004, back - direction * 0.2);
      box(1.8, 0.53, 0.79, darkWood, x, 0.29, back - direction * 0.17, 0.08);
      box(1.75, 0.28, 0.83, green, x, 0.62, back - direction * 0.23, 0.12);
      boothPadding(x, back, direction);
      box(0.23, 0.3, 0.81, green, x - side * 0.82, 0.81, back - direction * 0.27, 0.1);
      const cushion = box(0.47, 0.48, 0.16, pillow, x + side * 0.36, 0.95, back - direction * 0.32, 0.075);
      cushion.rotation.z = direction * 0.22;
    }
    box(1.58, 0.115, 0.94, walnut, x, 0.97, z, 0.065);
    box(1.52, 0.027, 0.887, bronze, x, 0.943, z, 0.014);
    cylinder(0.105, 0.16, 0.85, darkWood, x, 0.49, z);
    cylinder(0.22, 0.23, 0.045, walnut, x, 0.066, z);
    const lampX = x + side * 0.23;
    tableLamp(lampX, z);
    for (let i = 0; i < 2; i++) {
      const book = box(0.28, 0.048, 0.19, bookColors[(i + Math.round(z + 14)) % bookColors.length], x - side * 0.23, 1.05 + i * 0.049, z + 0.18, 0.01);
      book.rotation.y = i * 0.26;
    }
    cylinder(0.068, 0.055, 0.09, pillow, x - side * 0.55, 1.07, z - 0.2);
    cylinder(0.054, 0.054, 0.005, darkWood, x - side * 0.55, 1.117, z - 0.2);
    const handle = mesh(new T.TorusGeometry(0.035, 0.009, 6, 14), pillow,
      x - side * 0.47, 1.073, z - 0.2);
    handle.rotation.y = side * 0.25;
    if (z > 3 && z < 10) {
      const saucer = cylinder(0.111, 0.099, 0.014, pillow, x - side * 0.55, 1.017, z - 0.2);
      saucer.position.z += 0.01;
      box(0.38, 0.018, 0.27, bookColors[0], x - side * 0.2, 1.031, z + 0.18, 0.006);
    }
    if (z > 3 && z < 10) point('#ffc27d', 8, 2.6, lampX, 1.28, z);
  }
}

function buildEndWall() {
  const z = -17.2;
  box(halfCabin * 2 + 0.12, 3.85, 0.18, darkWood, 0, 1.9, z);
  box(1.43, 2.63, 0.26, bronze, 0, 1.32, z + 0.12, 0.09);
  box(1.31, 2.52, 0.24, walnut, 0, 1.29, z + 0.16, 0.075);
  box(0.88, 1.12, 0.07, material('#6c8581', 0.24), 0, 1.73, z + 0.3, 0.06);
  box(0.046, 1.12, 0.06, bronze, 0, 1.73, z + 0.343);
  box(0.88, 0.05, 0.06, bronze, 0, 1.73, z + 0.343);
  oval(bronze, 0.48, 1.04, z + 0.33, 0.06, 0.06, 0.05);
  oval(bronze, 0, 3.11, z + 0.22, 0.24, 0.24, 0.065);
  oval(pillow, 0, 3.11, z + 0.27, 0.19, 0.19, 0.04);
  box(0.022, 0.16, 0.02, darkWood, 0, 3.14, z + 0.311).rotation.z = -0.35;
  box(0.12, 0.02, 0.02, darkWood, -0.04, 3.11, z + 0.311);
  for (const side of [-1, 1]) {
    const x = side * 1.99;
    for (let shelf = 0; shelf < 4; shelf++) {
      const y = 0.5 + shelf * 0.62;
      box(1.97, 0.095, 0.41, walnut, x, y, z + 0.27);
      for (let i = 0; i < 12; i++) {
        const h = 0.2 + random() * 0.25;
        box(0.115, h, 0.22, bookColors[i % 4], x - 0.8 + i * 0.14, y + 0.05 + h / 2, z + 0.31);
      }
    }
  }
}

function buildScenery() {
  box(220, 0.15, 250, material('#496361'), 0, -2.48, -26);
  const lake = material('#588a98', 0.26, 0.18);
  const foothill = material('#485c58');
  const rock = material('#657780');
  const snow = material('#e8e1dd');
  const pine = [material('#233f35'), material('#324e3b'), material('#445a41')];
  const tree = new T.ConeGeometry(1, 1, 5);
  const cloud = new T.MeshBasicMaterial({ color: '#f5c8bb' });
  const ripples = new T.MeshBasicMaterial({ color: '#aacac8', transparent: true, opacity: 0.39 });
  const stone = material('#908074');
  for (const side of [-1, 1]) {
    box(26, 0.12, 170, lake, side * 26, -2.35, -27);
    for (let i = 0; i < 18; i++) {
      const x = side * (63 + random() * 20);
      const y = 17 + random() * 11;
      const z = -104 + random() * 105;
      oval(cloud, x, y, z, 2 + random() * 2, 0.35 + random(), 4 + random() * 8);
    }
    for (let i = 0; i < 56; i++) {
      box(0.1 + random() * 0.35, 0.009, 0.4 + random() * 2.2, ripples,
        side * (15 + random() * 23), -2.281, -105 + random() * 148);
    }
    for (let i = 0; i < 14; i++) {
      const x = side * (47 + random() * 24);
      const z = -100 + i * 13;
      const peak = 13 + random() * 18;
      const mountain = mesh(new T.ConeGeometry(14 + random() * 12, peak, 6), rock, x, peak / 2 - 2.4, z);
      mountain.rotation.y = random() * Math.PI;
      const cap = mesh(new T.ConeGeometry(mountain.geometry.parameters.radius * 0.32, peak * 0.32, 6), snow,
        x, peak * 0.84 - 2.37, z);
      cap.rotation.y = mountain.rotation.y;
      oval(foothill, side * 42, -2.25, z + 3, 13, 4 + random() * 3.6, 13);
    }
    for (let i = 0; i < 160; i++) {
      const near = i < 55;
      const x = side * (near ? 6 + random() * 8 : 40 + random() * 10);
      const z = 22 - random() * 142;
      const height = 2 + random() * 4.8;
      for (let layer = 0; layer < 2; layer++) {
        const o = mesh(tree, pine[i % 3], x, (near ? -2.1 : 0.1) + height * (0.38 + layer * 0.27), z);
        o.scale.set(height * (0.235 - layer * 0.055), height * 0.74, height * (0.235 - layer * 0.055));
        o.rotation.y = i;
      }
    }
  }
  const bridgeX = -27;
  const bridgeStart = -46;
  box(1.35, 0.49, 31, stone, bridgeX, 1.86, bridgeStart + 14.5);
  box(1.49, 0.12, 31, stone, bridgeX, 2.14, bridgeStart + 14.5);
  for (let i = 0; i < 9; i++) {
    const z = bridgeStart + i * 3.65;
    box(1.12, 2.59, 0.51, stone, bridgeX, -1.05, z);
    if (i === 8) continue;
    const arch = mesh(new T.TorusGeometry(1.82, 0.22, 8, 18, Math.PI), stone,
      bridgeX, -0.06, z + 1.82);
    arch.rotation.y = Math.PI / 2;
  }

}

function batchScenery() {
  const batches = new Map();
  for (const object of scene.children) {
    if (!object.isMesh || object.material.transparent) continue;
    const section = Math.floor(object.position.z / 14);
    const key = [object.material.id, Boolean(object.geometry.index), section].join('/');
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(object);
  }
  for (const objects of batches.values()) {
    if (objects.length < 2) continue;
    const geometries = objects.map(object => {
      object.updateMatrix();
      return object.geometry.clone().applyMatrix4(object.matrix);
    });
    const merged = mergeGeometries(geometries);
    for (const geometry of geometries) geometry.dispose();
    if (!merged) continue;
    merged.computeBoundingSphere();
    scene.remove(...objects);
    mesh(merged, objects[0].material, 0, 0, 0);
  }
}

function buildMascot() {
  const start = scene.children.length;
  const z = 0;
  const feet = [];
  oval(new T.MeshBasicMaterial({ color: '#220c12', transparent: true, opacity: 0.28, depthWrite: false }),
    0, 0.017, z, 0.44, 0.009, 0.42);
  box(0.63, 0.65, 0.43, pink, 0, 0.47, z, 0.16);
  box(1.01, 0.87, 0.72, pink, 0, 1.1, z, 0.22);
  for (const side of [-1, 1]) {
    feet.push(oval(pink, side * 0.19, 0.16, z - 0.025, 0.16, 0.16, 0.19));
    oval(pink, side * 0.35, 0.46, z, 0.12, 0.22, 0.13).rotation.z = side * 0.35;
    box(0.064, 0.42, 0.083, leather, side * 0.24, 0.55, z + 0.195, 0.025).rotation.z = side * 0.16;
  }
  box(0.51, 0.39, 0.21, leather, 0, 0.5, z + 0.24, 0.064);
  box(0.51, 0.16, 0.222, darkWood, 0, 0.61, z + 0.247, 0.05);
  for (const side of [-1, 1]) {
    box(0.055, 0.21, 0.024, bronze, side * 0.125, 0.5, z + 0.366, 0.01);
    box(0.078, 0.059, 0.018, darkWood, side * 0.125, 0.465, z + 0.38, 0.01);
  }
  const mascot = new T.Group();
  for (const child of scene.children.slice(start)) mascot.add(child);
  mascot.position.z = 5.95;
  scene.add(mascot);
  return { mascot, feet };
}

function start() {
  const renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.35));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  document.querySelector('#scene').append(renderer.domElement);

  scene.add(new T.HemisphereLight('#ffe5cb', '#574043', 1.27));
  const sun = new T.DirectionalLight('#ffe1bd', 2.12);
  sun.position.set(-9, 6, 5);
  scene.add(sun);

  finishMaterials();
  buildShell();
  buildBooths();
  buildEndWall();
  buildScenery();
  batchScenery();
  play(renderer, buildMascot());
  status.remove();
}

function play(renderer, { mascot, feet }) {
  const keys = new Set();
  const cameraButton = document.querySelector('#camera-toggle');
  const seatButton = document.querySelector('#seat-toggle');
  const panel = document.querySelector('#focus-panel');
  const timer = document.querySelector('#focus-clock');
  const timerButton = document.querySelector('#timer-start');
  const duration = 25 * 60 * 1000;
  let remaining = duration;
  let deadline = null;
  let firstPerson = false;
  let seated = false;
  let yaw = 0;
  let pitch = 0;
  let drag = null;
  let distance = 4.85;
  let needsRender = true;
  let stride = 0;
  let strideWeight = 0;
  const velocity = new T.Vector2();
  const follow = mascot.position.clone();
  const look = new T.Vector3();
  const clamp = T.MathUtils.clamp;

  function toggleCamera() {
    firstPerson = !firstPerson;
    needsRender = true;
    cameraButton.setAttribute('aria-pressed', firstPerson);
    cameraButton.textContent = firstPerson ? 'Camera theo sau' : 'Camera POV';
  }

  function toggleSeat() {
    seated = !seated;
    velocity.set(0, 0);
    needsRender = true;
    if (seated) {
      const booth = clamp(Math.round((mascot.position.z + 13.3) / 3.6), 0, 7);
      mascot.position.set(boothCenter - 0.48, 0.28, -13.3 + booth * 3.6 + 0.95);
      mascot.rotation.y = Math.PI;
    } else {
      mascot.position.set(aisleLimit - 0.18, 0, mascot.position.z);
      mascot.rotation.y = 0;
    }
    yaw = 0;
    pitch = 0;
    seatButton.textContent = seated ? 'Đứng dậy' : 'Ngồi';
    seatButton.setAttribute('aria-pressed', seated);
  }

  function toggleFocus() {
    keys.clear();
    if (panel.open) panel.close();
    else panel.showModal();
  }

  function updateTimer() {
    if (deadline !== null) {
      remaining = Math.max(0, deadline - performance.now());
      if (!remaining) {
        deadline = null;
        timerButton.textContent = 'Bắt đầu';
      }
    }
    const seconds = Math.ceil(remaining / 1000);
    const text = [Math.floor(seconds / 60), seconds % 60].map(value => String(value).padStart(2, '0')).join(':');
    if (timer.textContent !== text) timer.textContent = text;
  }

  cameraButton.addEventListener('click', toggleCamera);
  seatButton.addEventListener('click', toggleSeat);
  document.querySelector('#focus-toggle').addEventListener('click', toggleFocus);
  timerButton.addEventListener('click', () => {
    if (deadline !== null) {
      updateTimer();
      deadline = null;
      timerButton.textContent = 'Tiếp tục';
    } else {
      if (!remaining) remaining = duration;
      deadline = performance.now() + remaining;
      timerButton.textContent = 'Tạm dừng';
    }
  });
  document.querySelector('#timer-reset').addEventListener('click', () => {
    remaining = duration;
    deadline = null;
    timerButton.textContent = 'Bắt đầu';
    updateTimer();
  });

  const movement = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ShiftLeft', 'ShiftRight']);
  window.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (!event.repeat && event.code === 'KeyF') toggleFocus();
    if (panel.open) return;
    if (movement.has(event.code)) {
      event.preventDefault();
      keys.add(event.code);
    }
    if (!event.repeat && event.code === 'KeyV') toggleCamera();
    if (!event.repeat && event.code === 'KeyE') toggleSeat();
  });
  window.addEventListener('keyup', event => keys.delete(event.code));
  window.addEventListener('blur', () => keys.clear());
  for (const button of document.querySelectorAll('[data-key]')) {
    button.addEventListener('pointerdown', event => {
      button.setPointerCapture(event.pointerId);
      keys.add(button.dataset.key);
    });
    button.addEventListener('lostpointercapture', () => keys.delete(button.dataset.key));
  }

  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    yaw = (yaw - (event.clientX - drag.x) * 0.004) % (2 * Math.PI);
    pitch = clamp(pitch - (event.clientY - drag.y) * 0.003, -0.55, 0.62);
    needsRender = true;
    drag.x = event.clientX;
    drag.y = event.clientY;
  });
  canvas.addEventListener('lostpointercapture', event => {
    if (drag?.id === event.pointerId) drag = null;
  });
  canvas.addEventListener('dblclick', toggleCamera);
  canvas.addEventListener('wheel', event => {
    if (firstPerson) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    distance = clamp(distance + delta * 0.004, 2.2, 5.8);
    needsRender = true;
  }, { passive: true });

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.fov = camera.aspect < 1 ? 68 : 54;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    needsRender = true;
  }
  resize();
  window.addEventListener('resize', resize);
  const pressed = (letter, arrow) => Number(keys.has(letter) || keys.has(arrow));
  let lastFrame = performance.now();

  renderer.setAnimationLoop(now => {
    const dt = clamp((now - lastFrame) / 1000, 0, 0.08);
    lastFrame = now;
    const dx = pressed('KeyD', 'ArrowRight') - pressed('KeyA', 'ArrowLeft');
    const dz = pressed('KeyS', 'ArrowDown') - pressed('KeyW', 'ArrowUp');
    const moving = !seated && (dx !== 0 || dz !== 0);
    const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const speed = moving ? (sprint ? 4 : 2.4) / Math.hypot(dx, dz) : 0;
    const heading = firstPerson ? yaw : 0;
    const blend = 1 - Math.exp(-dt * 17);
    velocity.x = T.MathUtils.lerp(velocity.x, (dx * Math.cos(heading) - dz * Math.sin(heading)) * speed, blend);
    velocity.y = T.MathUtils.lerp(velocity.y, (dx * Math.sin(heading) + dz * Math.cos(heading)) * speed, blend);

    const position = mascot.position;
    const oldX = position.x;
    const oldZ = position.z;
    if (!seated && velocity.lengthSq() > 0.001) {
      position.x = clamp(position.x + velocity.x * dt, -aisleLimit, aisleLimit);
      position.z = clamp(position.z + velocity.y * dt, -15.6, 7.7);
    }
    const travel = Math.hypot(position.x - oldX, position.z - oldZ);
    if (travel > 0.0001) {
      const angle = Math.atan2(oldX - position.x, oldZ - position.z);
      const difference = angle - mascot.rotation.y;
      mascot.rotation.y += Math.atan2(Math.sin(difference), Math.cos(difference)) * blend;
      stride += travel * 8.5;
      needsRender = true;
    }
    const previousWeight = strideWeight;
    strideWeight = T.MathUtils.lerp(strideWeight, travel > 0.0001 ? 1 : 0, blend);
    if (strideWeight < 0.01) strideWeight = 0;
    if (previousWeight !== strideWeight || travel > 0.0001) {
      feet.forEach((foot, index) => {
        const step = Math.sin(stride + index * Math.PI) * strideWeight;
        foot.position.y = 0.16 + Math.max(0, step) * 0.075;
        foot.position.z = -0.025 + step * 0.115;
      });
      needsRender = true;
    }

    const cameraMoving = follow.distanceToSquared(position) > 0.000002;
    if (firstPerson) follow.copy(position);
    else follow.lerp(position, 1 - Math.exp(-dt * 15));
    updateTimer();
    if (!needsRender && !cameraMoving) return;
    needsRender = false;

    const { x, y, z } = follow;
    const sinYaw = Math.sin(yaw);
    const cosYaw = Math.cos(yaw);
    mascot.visible = !firstPerson;
    if (firstPerson) {
      camera.position.set(x, y + 1.18, z);
      look.set(x + sinYaw * Math.cos(pitch), y + 1.18 + Math.sin(pitch), z - cosYaw * Math.cos(pitch));
    } else {
      const pivotX = clamp(x, -cameraAisleLimit + 0.08, cameraAisleLimit - 0.08);
      const elevation = clamp(0.14 - pitch, -0.33, 0.72);
      const orbitX = -sinYaw * Math.cos(elevation);
      const orbitZ = cosYaw * Math.cos(elevation);
      const toSide = orbitX > 0 ? cameraAisleLimit - pivotX : cameraAisleLimit + pivotX;
      const toEnd = orbitZ > 0 ? 12.95 - z : z + 16.8;
      const radius = Math.min(distance, toSide / Math.max(Math.abs(orbitX), 0.001),
        toEnd / Math.max(Math.abs(orbitZ), 0.001));
      const lift = 0.65 * (1 - clamp(radius / 1.4, 0, 1));
      camera.position.set(pivotX + orbitX * radius,
        clamp(y + 1.3 + Math.sin(elevation) * radius + lift, 1.42, 3.14), z + orbitZ * radius);
      look.set(pivotX + sinYaw * 0.42, y + 1.17, z - cosYaw * 0.42);
    }
    camera.lookAt(look);
    renderer.render(scene, camera);
  });
}

try {
  start();
} catch (error) {
  status.textContent = 'Không dựng được cảnh 3D. Hãy thử trình duyệt có hỗ trợ WebGL.';
  console.error(error);
}
