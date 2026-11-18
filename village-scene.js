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

function buildBulkhead(z, facesFront) {
  const start = scene.children.length;
  const profile = new T.Shape();
  profile.moveTo(-halfCabin, -0.02);
  profile.lineTo(halfCabin, -0.02);
  profile.lineTo(halfCabin, 3);
  for (let i = 1; i <= 32; i++) {
    const angle = i * Math.PI / 32;
    profile.lineTo(Math.cos(angle) * halfCabin, 3 + Math.sin(angle) * 1.04);
  }
  profile.closePath();
  mesh(new T.ExtrudeGeometry(profile, { depth: 0.17, bevelEnabled: false }), darkWood, 0, 0, -0.11);
  box(8, 0.15, 0.08, bronze, 0, 2.83, 0.055);
  box(8, 0.17, 0.12, walnut, 0, 0.12, 0.065);
  box(1.54, 2.7, 0.22, darkWood, 0, 1.36, 0.14, 0.09);
  box(1.45, 2.61, 0.19, bronze, 0, 1.36, 0.19, 0.075);
  box(1.33, 2.52, 0.21, walnut, 0, 1.33, 0.22, 0.075);
  box(0.93, 1.17, 0.06, bronze, 0, 1.77, 0.34, 0.07);
  box(0.83, 1.07, 0.045, material('#354849', 0.28), 0, 1.77, 0.37, 0.065);
  box(0.034, 1.07, 0.035, bronze, 0, 1.77, 0.401);
  box(0.83, 0.037, 0.035, bronze, 0, 1.77, 0.401);
  box(0.85, 0.42, 0.045, darkWood, 0, 0.49, 0.335, 0.035);
  box(0.73, 0.31, 0.04, walnut, 0, 0.49, 0.36, 0.03);
  oval(bronze, 0.49, 1.07, 0.35, 0.063, 0.05, 0.034);
  oval(bronze, 0, 3.15, 0.12, 0.245, 0.245, 0.072);
  oval(pillow, 0, 3.15, 0.174, 0.196, 0.196, 0.04);
  box(0.018, 0.15, 0.02, darkWood, 0.025, 3.18, 0.215).rotation.z = -0.55;
  box(0.10, 0.016, 0.02, darkWood, -0.035, 3.15, 0.216);
  for (const side of [-1, 1]) {
    const x = side * 2.35;
    box(2.38, 2.57, 0.115, walnut, x, 1.42, 0.095, 0.05);
    box(2.16, 2.36, 0.11, darkWood, x, 1.42, 0.14, 0.035);
    for (let shelf = 0; shelf < 4; shelf++) {
      const y = 0.41 + shelf * 0.55;
      box(2.14, 0.087, 0.35, walnut, x, y, 0.25);
      for (let i = 0; i < 12; i++) {
        const h = 0.18 + random() * 0.22;
        box(0.107, h, 0.17, bookColors[(i + shelf) % 4], x - 0.87 + i * 0.15,
          y + 0.045 + h / 2, 0.27);
      }
    }
    box(0.18, 0.38, 0.13, bronze, side * 3.7, 2.28, 0.13, 0.03);
    oval(lightShade, side * 3.7, 2.29, 0.21, 0.075, 0.15, 0.058);
  }
  const wall = new T.Group();
  for (const object of scene.children.slice(start)) wall.add(object);
  batchScenery(wall, false);
  wall.position.z = z;
  if (facesFront) wall.rotation.y = Math.PI;
  scene.add(wall);
}

function buildScenery() {
  const layers = [];
  const skyColor = new T.Color('#bddbcf');
  scene.background.copy(skyColor);
  scene.fog = new T.FogExp2(skyColor, 0.0105);
  const sky = new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    uniforms: {
      horizon: { value: new T.Color('#f9e5c8') },
      zenith: { value: new T.Color('#79c4ed') },
      cloudColor: { value: new T.Color('#fff2dc') }
    },
    vertexShader: `
      varying vec3 direction;
      void main() {
        direction = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 horizon;
      uniform vec3 zenith;
      uniform vec3 cloudColor;
      varying vec3 direction;
      float cloud(vec2 uv, vec2 center, vec2 size) {
        vec2 q = (uv - center) / size;
        return exp(-dot(q, q) * 2.25);
      }
      void main() {
        vec3 ray = normalize(direction);
        vec2 uv = vec2(atan(ray.z, max(abs(ray.x), 0.0001)), ray.y);
        vec3 color = mix(horizon, zenith, smoothstep(-0.08, 0.36, ray.y));
        float band = cloud(uv, vec2(-0.60, 0.24), vec2(0.35, 0.058))
          + cloud(uv, vec2(-0.50, 0.27), vec2(0.18, 0.069))
          + cloud(uv, vec2(0.61, 0.30), vec2(0.30, 0.063))
          + cloud(uv, vec2(0.81, 0.23), vec2(0.36, 0.035));
        color = mix(color, cloudColor, min(band, 1.0) * 0.59);
        vec3 sun = normalize(vec3(1.0, 0.32, -0.50));
        float angle = distance(vec3(abs(ray.x), ray.yz), sun);
        color = mix(color, cloudColor, 0.27 * exp(-angle * 7.0) + 0.70 * (1.0 - smoothstep(0.025, 0.031, angle)));
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `
  });
  const dome = mesh(new T.SphereGeometry(138, 32, 16), sky, 0, 1.35, 0);
  dome.renderOrder = -1;

  function loop(length, speed, copies, build) {
    const start = scene.children.length;
    build(length);
    const tile = new T.Group();
    for (const object of scene.children.slice(start)) tile.add(object);
    batchScenery(tile, false);
    const strip = new T.Group();
    for (let i = -copies; i <= copies; i++) {
      const copy = tile.clone();
      copy.position.z = i * length;
      strip.add(copy);
    }
    scene.add(strip);
    layers.push({ strip, length, speed });
  }

  const pasture = new T.MeshStandardMaterial({ color: '#b0cc82', vertexColors: true, side: T.DoubleSide });
  const fieldPath = new T.MeshStandardMaterial({ color: '#bc9e77', roughness: 1, side: T.DoubleSide });
  const stemMaterial = material('#6e983f');
  const petalMaterial = new T.MeshStandardMaterial({ color: '#ffffff', roughness: 0.76, side: T.DoubleSide });
  const palette = ['#f688ae', '#f8cf6b', '#ef7b7f', '#ad93df', '#fff0ce', '#f5a5c5'].map(color => new T.Color(color));
  const stem = new T.CylinderGeometry(0.017, 0.023, 0.53, 4);
  stem.translate(0, 0.265, 0);
  const blade = new T.PlaneGeometry(0.13, 0.34, 2, 3);
  const leaves = new T.MeshStandardMaterial({ color: '#8ab458', roughness: 0.94, side: T.DoubleSide });
  const bladePositions = blade.attributes.position;
  for (let i = 0; i < bladePositions.count; i++) {
    const y = bladePositions.getY(i) / 0.34 + 0.5;
    bladePositions.setXYZ(i, bladePositions.getX(i) * Math.sin(y * Math.PI),
      0.15 + y * 0.33, y * y * 0.19);
  }
  blade.computeVertexNormals();

  // A scalloped cup silhouette reads as tulip petals even at a distance.
  const bloom = new T.LatheGeometry([
    new T.Vector2(0.026, 0.47), new T.Vector2(0.102, 0.49), new T.Vector2(0.147, 0.59),
    new T.Vector2(0.153, 0.66), new T.Vector2(0.125, 0.724), new T.Vector2(0.106, 0.70),
    new T.Vector2(0.093, 0.58)
  ], 12);
  const bloomPositions = bloom.attributes.position;
  for (let i = 0; i < bloomPositions.count; i++) {
    if (bloomPositions.getY(i) < 0.69) continue;
    const angle = Math.atan2(bloomPositions.getX(i), bloomPositions.getZ(i));
    bloomPositions.setY(i, bloomPositions.getY(i) + Math.cos(angle * 6) * 0.026);
  }
  bloom.computeVertexNormals();
  const distantBloom = new T.LatheGeometry([
    new T.Vector2(0.023, 0.50), new T.Vector2(0.13, 0.55),
    new T.Vector2(0.15, 0.65), new T.Vector2(0.115, 0.72)
  ], 6);

  function terrain(x, z, length) {
    const phase = z / length * Math.PI * 2;
    const rise = Math.min((x - 4) * 0.022, 0.75);
    return -0.65 + rise + 0.14 * Math.sin(phase * 2 + x * 0.18) + 0.09 * Math.cos(phase * 3 - x * 0.23);
  }

  function field(length, minX, maxX, rows, count, distant) {
    const dummy = new T.Object3D();
    const tint = new T.Color();
    for (const side of [-1, 1]) {
      const blooms = new T.InstancedMesh(distant ? distantBloom : bloom, petalMaterial, rows * count);
      const stems = distant ? null : new T.InstancedMesh(stem, stemMaterial, blooms.count);
      const blades = distant ? null : new T.InstancedMesh(blade, leaves, blooms.count);
      let index = 0;
      const ground = new T.PlaneGeometry(length, maxX - minX, 62, 12);
      const nodes = ground.attributes.position;
      const colors = [];
      const low = new T.Color('#a1ad83');
      const high = new T.Color('#eef1c4');
      for (let i = 0; i < nodes.count; i++) {
        const z = nodes.getX(i);
        const x = minX + nodes.getY(i) + (maxX - minX) / 2;
        nodes.setXYZ(i, side * x, terrain(x, z, length) - (distant ? 0.12 : 0), z);
        tint.copy(low).lerp(high, 0.47 + Math.sin(x * 0.21 + z * Math.PI * 4 / length) * 0.24);
        colors.push(tint.r, tint.g, tint.b);
      }
      ground.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
      ground.computeVertexNormals();
      mesh(ground, pasture, 0, 0, 0);

      for (let row = 0; row < rows; row++) {
        const band = Math.floor(row / 3);
        const rowX = minX + 1.45 + row * (distant ? 1.74 : 0.95) + band * (distant ? 1.10 : 1.25);
        for (let n = 0; n < count; n++) {
          const z = -length / 2 + (n + random()) * length / count;
          const phase = z / length * Math.PI * 2;
          const openGreen = 0.58 * Math.sin(phase * 2 + band * 0.99 + side)
            + 0.42 * Math.cos(phase * 3 - band * 0.56);
          if (openGreen > 0.54 && (band + 1) % 3 !== 0) continue;
          const bend = Math.sin(phase + band * 0.12) * (distant ? 2.5 : 1.25)
            + Math.sin(phase * 2 + side) * 0.49;
          const x = rowX + bend + (random() - 0.5) * 0.53;
          dummy.position.set(side * x, terrain(x, z, length) - (distant ? 0.12 : 0), z);
          const scale = (distant ? 1.18 : 0.91) + random() * 0.36;
          dummy.scale.set(scale, scale * (0.89 + random() * 0.28), scale);
          dummy.rotation.set((random() - 0.5) * 0.29, random() * Math.PI * 2, (random() - 0.5) * 0.22);
          dummy.updateMatrix();
          blooms.setMatrixAt(index, dummy.matrix);
          tint.copy(palette[(band + (side > 0 ? 1 : 0)) % palette.length]).multiplyScalar(0.85 + random() * 0.23);
          blooms.setColorAt(index, tint);
          stems?.setMatrixAt(index, dummy.matrix);
          blades?.setMatrixAt(index, dummy.matrix);
          index++;
        }
      }
      if (!distant) {
        const path = new T.PlaneGeometry(length, 0.78, 62, 1);
        const p = path.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const z = p.getX(i);
          const x = 12.10 + Math.sin(z / length * Math.PI * 2) * 0.95
            + Math.sin(z / length * Math.PI * 4 + side) * 0.37 + p.getY(i);
          p.setXYZ(i, side * x, terrain(x, z, length) + 0.018, z);
        }
        path.computeVertexNormals();
        mesh(path, fieldPath, 0, 0, 0);
      }
      for (const object of [blooms, stems, blades].filter(Boolean)) {
        object.count = index;
        object.computeBoundingSphere();
        scene.add(object);
      }
    }
  }

  loop(88, 7.8, 2, length => field(length, 4, 31, 18, 105, false));
  loop(112, 4.15, 2, length => field(length, 30, 76, 18, 80, true));

  const ridgeMaterials = ['#8fac77', '#a8bd88', '#b4c991'].map(color => material(color, 1));
  const roundedHill = new T.SphereGeometry(1, 18, 9);
  const springCanopies = ['#90b772', '#b8ce81', '#ec9db4'].map(color => material(color));
  const treeTrunk = material('#85654f');
  const canopy = new T.IcosahedronGeometry(1, 1);
  loop(120, 0.8, 2, length => {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 8; i++) {
        const z = -length / 2 + (i + 0.5) * length / 8;
        mesh(roundedHill, ridgeMaterials[i % 3], side * (80 + random() * 20), -1.75, z)
          .scale.set(22 + random() * 9, 4.5 + random() * 5.5, 14 + random() * 12);
        for (let j = 0; j < 3; j++) {
          const x = side * (71 + random() * 8);
          const along = z + (random() - 0.5) * 8;
          const size = 0.82 + random() * 0.68;
          cylinder(0.095, 0.13, size * 1.65, treeTrunk, x, size * 0.81, along);
          const crown = springCanopies[(i + j) % springCanopies.length];
          mesh(canopy, crown, x, size * 1.85, along).scale.set(size, size * 1.18, size);
          mesh(canopy, crown, x + side * size * 0.38, size * 1.62, along + size * 0.51)
            .scale.set(size * 0.79, size * 0.84, size * 0.86);
        }
      }
    }
  });
  return layers;
}

function batchScenery(root = scene, useSections = true) {
  const batches = new Map();
  for (const object of root.children) {
    if (!object.isMesh || object.isInstancedMesh || object.material.transparent) continue;
    const section = useSections ? Math.floor(object.position.z / 14) : 0;
    const key = [object.material.id, Boolean(object.geometry.index), Object.keys(object.geometry.attributes).sort().join(), section].join('/');
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
    root.remove(...objects);
    root.add(new T.Mesh(merged, objects[0].material));
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
  buildBulkhead(-17.33, false);
  buildBulkhead(13.42, true);
  const scenery = buildScenery();
  batchScenery();
  play(renderer, buildMascot(), scenery);
  status.remove();
}

function play(renderer, { mascot, feet }, layers) {
  const motionButton = document.querySelector('#motion-toggle');
  let trainMoving = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  function updateMotionButton() {
    motionButton.textContent = trainMoving ? 'Dừng tàu' : 'Chạy tàu';
  }
  motionButton.addEventListener('click', () => {
    trainMoving = !trainMoving;
    updateMotionButton();
  });
  updateMotionButton();
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
  let lastSceneryRender = 0;

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
    if (trainMoving) {
      for (const { strip, speed, length } of layers) {
        strip.position.z = (strip.position.z + dt * speed) % length;
      }
    }
    if (!needsRender && !cameraMoving && (!trainMoving || now - lastSceneryRender < 1000 / 30)) return;
    lastSceneryRender = now;
    needsRender = false;

    const { x, y, z } = follow;
    const sinYaw = Math.sin(yaw);
    const cosYaw = Math.cos(yaw);
    mascot.visible = !firstPerson;
    if (firstPerson) {
      const eyeHeight = y + 1.45;
      camera.position.set(x, eyeHeight, z);
      look.set(x + sinYaw * Math.cos(pitch), eyeHeight + Math.sin(pitch), z - cosYaw * Math.cos(pitch));
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
