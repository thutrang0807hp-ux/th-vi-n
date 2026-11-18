import { loadExteriorStudy, plantExteriorStudy } from './exterior-study.js';
import * as T from './vendor/three-r164/three.module.min.js';
import { RoundedBoxGeometry } from './vendor/three-r164/RoundedBoxGeometry.js';
import { mergeGeometries } from './vendor/three-r164/BufferGeometryUtils.js';

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

const reviewBayZ = 4.7;
const isReviewBooth = (side, z) => side > 0 && Math.abs(z - reviewBayZ) < 0.01;
let bayMaterials;
function reviewFinishes() {
  if (bayMaterials) return bayMaterials;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const context = canvas.getContext('2d');
  const data = context.createImageData(96, 96);
  for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
    const yarn = 236 + 8 * Math.sin(x * Math.PI / 2) * Math.cos(y * Math.PI / 2)
      + 5 * Math.cos((x + y) * Math.PI / 4) + 3 * Math.sin(x * 0.73 + y * 0.91);
    data.data.set([yarn, yarn, yarn, 255], (y * 96 + x) * 4);
  }
  context.putImageData(data, 0, 0);
  const weave = new T.CanvasTexture(canvas);
  const fabric = material('#527553', 0.95);
  fabric.map = weave;
  fabric.bumpMap = weave;
  fabric.bumpScale = 0.0032;
  const fabricEdge = fabric.clone();
  fabricEdge.color.set('#3c5c42');
  const linen = fabric.clone();
  linen.color.set('#d7c19d');
  linen.side = T.DoubleSide;
  linen.bumpScale = 0.002;
  const wood = walnut.clone();
  wood.color.set('#a8673a');
  wood.roughness = 0.48;
  const silk = new T.MeshStandardMaterial({
    color: '#ffead1', emissive: '#f5a95c', emissiveIntensity: 0.62, roughness: 0.82,
  });
  bayMaterials = {
    fabric, fabricEdge, linen, wood, silk,
    piping: material('#ddc59a', 0.84),
    brass: material('#b48b55', 0.47, 0.42),
  };
  return bayMaterials;
}

const bayGeometry = new Map();
function bayBox(width, height, depth, radius, finish, x, y, z) {
  const key = [width, height, depth, radius].join('/');
  if (!bayGeometry.has(key)) {
    bayGeometry.set(key, radius ? new RoundedBoxGeometry(width, height, depth, 1, radius)
      : new T.BoxGeometry(width, height, depth));
  }
  return mesh(bayGeometry.get(key), finish, x, y, z);
}

function bayPiping(width, height, corner, thin, surface, x, y, z, floor = false) {
  const key = [width, height, corner, thin, floor].join('/');
  if (!bayGeometry.has(key)) {
    const points = [];
    for (let quadrant = 0; quadrant < 4; quadrant++) {
      const angle = quadrant * Math.PI / 2;
      const cx = Math.sign(Math.cos(angle + Math.PI / 4)) * (width / 2 - corner);
      const cy = Math.sign(Math.sin(angle + Math.PI / 4)) * (height / 2 - corner);
      for (let i = 0; i <= 3; i++) {
        const t = angle + i * Math.PI / 6;
        const px = cx + corner * Math.cos(t);
        const py = cy + corner * Math.sin(t);
        points.push(new T.Vector3(px, floor ? 0 : py, floor ? py : 0));
      }
    }
    const path = new T.CatmullRomCurve3(points, true, 'centripetal');
    bayGeometry.set(key, new T.TubeGeometry(path, 32, thin, 5, true));
  }
  return mesh(bayGeometry.get(key), surface, x, y, z);
}

function reviewBackrest(x, back, direction) {
  const m = reviewFinishes();
  bayBox(1.83, 1.15, 0.30, 0.14, m.fabricEdge, x, 1.03, back);
  bayBox(1.72, 0.99, 0.274, 0.145, m.fabric, x, 1.052, back - direction * 0.078);
  const face = back - direction * 0.213;
  bayPiping(1.61, 0.866, 0.124, 0.013, m.piping, x, 1.055, face);
  for (const offset of [-0.262, 0.262]) {
    bayBox(0.009, 0.69, 0.009, 0.004, m.fabricEdge, x + offset, 1.051, face - direction * 0.006);
  }
}

function reviewLamp(x, z) {
  const m = reviewFinishes();
  const profile = (points, surface, y) =>
    mesh(new T.LatheGeometry(points.map(([r, h]) => new T.Vector2(r, h)), 24), surface, x, y, z);
  profile([[0, 0], [.165, 0], [.165, .015], [.142, .027], [.077, .049], [.040, .080],
    [.034, .155], [.055, .184], [.043, .213], [.041, .281], [0, .281]], m.brass, 1.029);
  profile([[.218, 0], [.212, .022], [.196, .066], [.17, .115], [.129, .16],
    [.086, .191], [.056, .199]], m.silk, 1.29);
  for (const [radius, y] of [[.218, 1.289], [.056, 1.487]]) {
    mesh(new T.TorusGeometry(radius, .0048, 6, 28), m.brass, x, y, z).rotation.x = Math.PI / 2;
  }
  for (let rib = 0; rib < 6; rib++) {
    const angle = rib * Math.PI / 3;
    const curve = new T.CatmullRomCurve3([[.218, 0], [.197, .066], [.129, .16], [.056, .198]]
      .map(([r, y]) => new T.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r)));
    mesh(new T.TubeGeometry(curve, 7, .0022, 4), m.brass, x, 1.29, z);
  }
  oval(m.brass, x, 1.504, z, .034, .023, .034);
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
      for (const direction of [-1, 1]) {
        const reviewDrape = side > 0 && ((Math.abs(z - 2) < .01 && direction > 0)
          || (Math.abs(z - 5.6) < .01 && direction < 0));
        drape(x, z, side, direction, reviewDrape);
      }
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

function drape(x, z, side, direction, review) {
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
  const finishes = review ? reviewFinishes() : null;
  mesh(geometry, finishes?.linen ?? curtain, x - side * 0.12, 0, z);
  box(0.12, 0.043, 0.22, finishes?.brass ?? bronze,
    x - side * 0.155, 1.85, z + direction * 0.19, 0.014);
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
  const tableStacks = [];
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
    const review = isReviewBooth(side, z);
    const finishes = review ? reviewFinishes() : null;
    for (const direction of [-1, 1]) {
      const back = z + direction * 1.29;
      mesh(shadowGeometry, shadowMaterial, x, 0.004, back - direction * 0.2);
      if (review) {
        bayBox(1.8, 0.53, 0.79, 0.08, darkWood, x, 0.29, back - direction * 0.17);
        bayBox(1.75, 0.28, 0.83, 0.12, finishes.fabric, x, 0.62, back - direction * 0.23);
        bayPiping(1.64, 0.727, 0.11, 0.010, finishes.piping,
          x, 0.741, back - direction * 0.23, true);
        reviewBackrest(x, back, direction);
        bayBox(0.23, 0.3, 0.81, 0.1, finishes.fabricEdge, x - side * 0.82, 0.81,
          back - direction * 0.27);
      } else {
        box(1.8, 0.53, 0.79, darkWood, x, 0.29, back - direction * 0.17, 0.08);
        box(1.75, 0.28, 0.83, green, x, 0.62, back - direction * 0.23, 0.12);
        boothPadding(x, back, direction);
        box(0.23, 0.3, 0.81, green, x - side * 0.82, 0.81, back - direction * 0.27, 0.1);
      }
      const cushion = box(0.47, 0.48, 0.16, finishes?.linen ?? pillow,
        x + side * 0.36, 0.95, back - direction * 0.32, 0.075);
      cushion.rotation.z = direction * 0.22;
    }
    box(1.58, 0.115, 0.94, finishes?.wood ?? walnut, x, 0.97, z, 0.065);
    if (review) bayPiping(1.48, 0.85, 0.072, 0.0048, finishes.brass, x, 1.029, z, true);
    box(1.52, 0.027, 0.887, bronze, x, 0.943, z, 0.014);
    cylinder(0.105, 0.16, 0.85, darkWood, x, 0.49, z);
    cylinder(0.22, 0.23, 0.045, walnut, x, 0.066, z);
    const lampX = x + side * 0.23;
    if (review) reviewLamp(lampX, z);
    else tableLamp(lampX, z);
    const books = new T.Group();
    for (let i = 0; i < 2; i++) {
      const book = box(0.28, 0.048, 0.19, bookColors[(i + Math.round(z + 14)) % bookColors.length], x - side * 0.23, 1.05 + i * 0.049, z + 0.18, 0.01);
      book.rotation.y = i * 0.26;
      books.add(book);
    }
    cylinder(0.068, 0.055, 0.09, pillow, x - side * 0.55, 1.07, z - 0.2);
    cylinder(0.054, 0.054, 0.005, darkWood, x - side * 0.55, 1.117, z - 0.2);
    const handle = mesh(new T.TorusGeometry(0.035, 0.009, 6, 14), pillow,
      x - side * 0.47, 1.073, z - 0.2);
    handle.rotation.y = side * 0.25;
    if (z > 3 && z < 10) {
      const saucer = cylinder(0.111, 0.099, 0.014, pillow, x - side * 0.55, 1.017, z - 0.2);
      saucer.position.z += 0.01;
      books.add(box(0.38, 0.018, 0.27, bookColors[0], x - side * 0.2, 1.031, z + 0.18, 0.006));
    }
    scene.add(books);
    if (side > 0) tableStacks.push(books);
    if (z > 3 && z < 10) point(review ? '#ffdab0' : '#ffc27d',
      review ? 6.5 : 8, 2.6, lampX, 1.28, z);
  }
  return tableStacks;
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

function buildScenery(kit) {
  const layers = [];
  const skyColor = new T.Color('#d3cce6');
  scene.background.copy(skyColor);
  scene.fog = new T.FogExp2(skyColor, 0.006);
  const sky = new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    uniforms: {
      horizon: { value: new T.Color('#f4c7c9') },
      zenith: { value: new T.Color('#86a8ee') },
      cloudColor: { value: new T.Color('#ffe0de') }
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

  const pasture = new T.MeshStandardMaterial({
    color: '#b6d482', emissive: '#718b47', emissiveIntensity: 0.26, vertexColors: true, side: T.DoubleSide
  });
  pasture.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec2 meadowPoint;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>', '#include <begin_vertex>\nmeadowPoint = position.xz;');
    shader.fragmentShader = `
      varying vec2 meadowPoint;
      float meadowHash(vec2 cell) {
        cell.y = mod(cell.y, 96.0);
        return fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
      }
      float meadowNoise(vec2 p) {
        vec2 cell = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(meadowHash(cell), meadowHash(cell + vec2(1.0, 0.0)), f.x),
          mix(meadowHash(cell + vec2(0.0, 1.0)), meadowHash(cell + vec2(1.0, 1.0)), f.x), f.y);
      }
    ` + shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      vec2 p = meadowPoint;
      float variation = 0.67 * meadowNoise(p * 2.0) + 0.24 * meadowNoise(p * 8.0)
        + 0.09 * meadowNoise(p * 24.0);
      float turf = smoothstep(0.12, 0.86, variation);
      diffuseColor.rgb *= mix(vec3(0.56, 0.72, 0.47), vec3(1.05, 1.09, 0.91), turf);
    `);
  };
  const breeze = { value: 0 };

  const waterLevel = -0.62;
  const riverMaterial = new T.MeshStandardMaterial({
    color: '#91d9d2', emissive: '#2a647d', emissiveIntensity: 0.22,
    vertexColors: true, roughness: 0.31, side: T.DoubleSide
  });
  riverMaterial.onBeforeCompile = shader => {
    shader.uniforms.riverTime = breeze;
    shader.vertexShader = 'varying vec2 riverPosition;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>', '#include <begin_vertex>\nriverPosition = (modelMatrix * vec4(position, 1.0)).xz;');
    shader.fragmentShader = 'uniform float riverTime;\nvarying vec2 riverPosition;\n' +
      shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        vec2 p = riverPosition;
        float wave = sin(p.x * 10.0 + p.y * 1.2 + riverTime * 1.7 + sin(p.y * 1.8));
        float chop = sin(p.x * 28.0 - p.y * 1.15 - riverTime * 1.9);
        float sparkle = smoothstep(0.72, 1.0, wave * 0.69 + chop * 0.31);
        float streak = smoothstep(0.15, 0.95, sin(p.y * 3.5 + sin(p.x * 0.8)));
        diffuseColor.rgb *= 0.98 + 0.067 * wave;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.91, 1.0), sparkle * streak * 0.26);
      `);
  };
  const pebble = new T.IcosahedronGeometry(1, 0);
  const stone = material('#b2a9a1');
  const glint = new T.MeshBasicMaterial({ color: '#e1fbf1', transparent: true, opacity: 0.44, depthWrite: false });
  function riverCenter(z, length, side) {
    const phase = z / length * Math.PI * 2;
    return 19.6 + Math.sin(phase + side * 0.42) * 4.7 + Math.sin(phase * 2 - 0.3) * 1.25;
  }

  const riverFarBank = 2.75;
  function riverBankDistance(x, z, length, side) {
    const offset = x - riverCenter(z, length, side);
    return offset <= 0 ? -offset : Math.max(0, offset - riverFarBank);
  }

  function terrain(x, z, length, side, distant) {
    const phase = z / length * Math.PI * 2;
    const slope = -0.39 + Math.min((x - 4) * 0.018, 0.73);
    const terrace = T.MathUtils.smoothstep(x, 30, 54) * (1.75 + Math.sin(phase * 2 + side * 0.8) * 0.26);
    const meadow = slope + 0.155 * Math.sin(phase * 2 + x * 0.13) + terrace;
    if (distant) return meadow - 0.11;
    const fromRiver = riverBankDistance(x, z, length, side);
    return T.MathUtils.lerp(waterLevel - 0.52, meadow, T.MathUtils.smoothstep(fromRiver, 3.55, 5.6));
  }

  function field(length, minX, maxX, distant) {
    const tint = new T.Color();
    for (const side of [-1, 1]) {
      const ground = new T.PlaneGeometry(length, maxX - minX, 84, distant ? 12 : 52);
      const nodes = ground.attributes.position;
      const colors = [];
      const low = new T.Color('#8cad73');
      const high = new T.Color('#e3ebad');
      for (let i = 0; i < nodes.count; i++) {
        const z = nodes.getX(i);
        const x = minX + nodes.getY(i) + (maxX - minX) / 2;
        nodes.setXYZ(i, side * x, terrain(x, z, length, side, distant), z);
        tint.copy(low).lerp(high, 0.52 + Math.sin(x * 0.25 + z * Math.PI * 4 / length) * 0.23);
        colors.push(tint.r, tint.g, tint.b);
      }
      ground.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
      ground.computeVertexNormals();
      mesh(ground, pasture, 0, 0, 0);

      if (distant) continue;
      const columns = 6, segments = 86;
      const vertices = [];
      const bankFactors = [];
      for (let row = 0; row <= segments; row++) {
        for (let col = 0; col <= columns; col++) {
          const edge = col === 0 || col === columns;
          const seam = row === 0 || row === segments;
          const z = -length / 2 + row * length / segments +
            (seam ? 0 : Math.sin(row * 11.47 + col * 4.6) * 0.43);
          const offset = (col / columns - 0.5) * 7.5 +
            (edge || seam ? 0 : Math.sin(col * 8.1 + row * 7.3) * 0.52);
          const lift = edge || seam ? 0 : Math.sin(row * 5.9 - col * 3.7) * 0.035;
          const widened = offset > 0 ? offset * (1 + riverFarBank / 3.75) : offset;
          vertices.push([side * (riverCenter(z, length, side) + widened), waterLevel + lift, z]);
          bankFactors.push(T.MathUtils.smoothstep(Math.abs(offset), 1.20, 3.75));
        }
      }
      const points = [];
      const shades = [];
      const edgeColor = new T.Color('#8fe1d0');
      const streamColor = new T.Color('#3897bc');
      const deep = new T.Color('#255f98');
      function face(a, b, c, row) {
        const bank = (bankFactors[a] + bankFactors[b] + bankFactors[c]) / 3;
        const shade = 0.52 + Math.sin(a * 5.82 + b * 1.34 + c * 3.13) * 0.26 + Math.sin(row * 0.3) * 0.14;
        tint.copy(deep).lerp(streamColor, shade).lerp(edgeColor, bank * 0.63);
        for (const i of [a, b, c]) {
          points.push(...vertices[i]);
          shades.push(tint.r, tint.g, tint.b);
        }
      }
      for (let row = 0; row < segments; row++) {
        for (let col = 0; col < columns; col++) {
          const a = row * (columns + 1) + col;
          const b = a + 1, c = a + columns + 1, d = c + 1;
          if ((row + col) % 2 === 0) {
            face(a, c, d, row);
            face(a, d, b, row);
          } else {
            face(a, c, b, row);
            face(b, c, d, row);
          }
        }
      }
      const ribbon = new T.BufferGeometry();
      ribbon.setAttribute('position', new T.Float32BufferAttribute(points, 3));
      ribbon.setAttribute('color', new T.Float32BufferAttribute(shades, 3));
      ribbon.computeVertexNormals();
      mesh(ribbon, riverMaterial, 0, 0, 0);
      for (let i = 0; i < 26; i++) {
        const z = (random() - 0.5) * length;
        const bankSide = i % 2 === 0 ? -1 : 1;
        const x = riverCenter(z, length, side) + bankSide * (4.1 + random() * 0.83)
          + (bankSide > 0 ? riverFarBank : 0);
        const size = 0.14 + random() * 0.37;
        mesh(pebble, stone, side * x, terrain(x, z, length, side, false) + size * 0.25, z)
          .scale.set(size, size * 0.51, size * 1.08);
        const sparkle = oval(glint, side * (riverCenter(z, length, side) + (random() - 0.5) * 5.3),
          waterLevel + 0.012, z + 0.28, 0.26 + random() * 0.46, 0.006, 0.05 + random() * 0.12);
        sparkle.rotation.y = 0.18;
      }



    }
  }

  loop(96, 6.9, 2, length => field(length, 4, 57, false));
  loop(112, 4.15, 2, length => field(length, 56, 76, true));

  const petal = new T.Shape();
  petal.moveTo(0, -0.082);
  petal.quadraticCurveTo(-0.105, -0.01, -0.061, 0.075);
  petal.quadraticCurveTo(-0.027, 0.105, 0, 0.071);
  petal.quadraticCurveTo(0.041, 0.12, 0.069, 0.059);
  petal.quadraticCurveTo(0.086, -0.016, 0, -0.082);
  const drifting = new T.InstancedMesh(new T.ShapeGeometry(petal, 4),
    new T.MeshBasicMaterial({ color: '#f7a7cc', side: T.DoubleSide }), 104);
  drifting.frustumCulled = false;
  const petalPose = new T.Object3D();
  const petalSeeds = Array.from({ length: drifting.count }, () => [random(), random(), random(), random()]);
  for (let i = 0; i < petalSeeds.length; i++) {
    drifting.setColorAt(i, new T.Color().lerpColors(new T.Color('#eda5b7'), new T.Color('#fff1f5'), petalSeeds[i][3]));
  }
  scene.add(drifting);
  function driftPetals(time) {
    breeze.value = time;
    for (let i = 0; i < petalSeeds.length; i++) {
      const [a, b, c, d] = petalSeeds[i];
      const side = i % 2 === 0 ? -1 : 1;
      const flutter = time * (0.63 + d * 0.76) + a * 40;
      const z = -35 + (b * 73 + time * (2.6 + d * 1.45)) % 73;
      const y = 0.15 + ((c * 4.1 + time * (0.36 + a * 0.21)) % 4.1);
      petalPose.position.set(side * (4.72 + a * 8.2 + Math.sin(flutter) * 0.57), 4.5 - y, z);
      petalPose.rotation.set(flutter, flutter * 0.77, flutter * 1.23);
      petalPose.scale.setScalar(0.74 + d * 0.65);
      petalPose.updateMatrix();
      drifting.setMatrixAt(i, petalPose.matrix);
    }
    drifting.instanceMatrix.needsUpdate = true;
  }
  driftPetals(0);

  const ridgeMaterials = ['#8fac77', '#a8bd88', '#b4c991'].map(color => material(color, 1));
  const roundedHill = new T.SphereGeometry(1, 18, 9);
  loop(120, 0.8, 2, length => {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 8; i++) {
        const z = -length / 2 + (i + 0.5) * length / 8;
        mesh(roundedHill, ridgeMaterials[i % 3], side * (80 + random() * 20), -1.75, z)
          .scale.set(22 + random() * 9, 4.5 + random() * 5.5, 14 + random() * 12);

      }
    }
  });
  const near = layers[0];
  const { tile: studyTile, skyClouds } = plantExteriorStudy(scene, kit,
    (x, z) => terrain(Math.abs(x), z, near.length, Math.sign(x), Math.abs(x) > 57),
    near.length, (side, z) => riverCenter(z, near.length, side) + riverFarBank + 4.95);
  for (const tile of near.strip.children) tile.add(studyTile.clone());
  scene.remove(studyTile);
  function animateAmbient(time) {
    driftPetals(time);
    skyClouds.position.z = Math.sin(time * 0.028) * 19;
    skyClouds.position.x = Math.sin(time * 0.019) * 2.8;
  }
  return { layers, animateAmbient };
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

const mascotColors = {
  peach: ['#f5a0a3', '#db6269'],
  cream: ['#ffd0aa', '#d88668'],
  lilac: ['#cba7e6', '#aa77bc'],
  sky: ['#9bcbef', '#689dc5'],
  mint: ['#a7d8b6', '#6dac90'],
};
const mascotDefaults = { color: 'peach', accessory: 'plain', expression: 'gentle' };
const mascotStorageKey = 'lofi-train-avatar-v1';

// Superellipsoid with a broader lower face and a slightly tilted crown.
const mochiHeadY = 0.724;
const mochiHeadScale = 0.8;
const mochiHeadHeightScale = 0.72;
const mochiHipY = 0.149;
const mochiPower = 3.85;
const mochiYRadius = 0.433;
function mochiHeadProfile(y) {
  const height = y / mochiYRadius;
  return {
    width: 0.489 * (1 - 0.037 * height - 0.018 * height ** 2),
    depth: 0.362 * (1 - 0.045 * height),
    center: 0.009 * height,
  };
}
function mochiFaceDepth(x, y) {
  const { width, depth, center } = mochiHeadProfile(y);
  const surface = 1 - Math.abs((x - center) / width) ** mochiPower
    - Math.abs(y / mochiYRadius) ** mochiPower;
  return -depth * Math.max(0, surface) ** (1 / mochiPower);
}
function makeMochiHead() {
  const shape = new T.SphereGeometry(1, 80, 56);
  const vertices = shape.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const y = vertices.getY(i);
    const z = vertices.getZ(i);
    const radius = (Math.abs(x) ** mochiPower + Math.abs(y) ** mochiPower
      + Math.abs(z) ** mochiPower) ** (1 / mochiPower);
    const height = y / radius * mochiYRadius;
    const { width, depth, center } = mochiHeadProfile(height);
    vertices.setXYZ(i, center + x / radius * width, height, z / radius * depth);
  }
  shape.computeVertexNormals();
  // Smooth the duplicated vertices at the longitude seam and the two poles.
  const normals = shape.attributes.normal;
  const smooth = (from, to) => {
    const normal = new T.Vector3();
    for (const index of from) {
      normal.x += normals.getX(index);
      normal.y += normals.getY(index);
      normal.z += normals.getZ(index);
    }
    normal.normalize();
    for (const index of to) normals.setXYZ(index, normal.x, normal.y, normal.z);
  };
  for (let row = 1; row < 56; row++) {
    const pair = [row * 81, row * 81 + 80];
    smooth(pair, pair);
  }
  for (const row of [0, 56]) {
    const ring = Array.from({ length: 81 }, (_, col) => row * 81 + col);
    smooth(ring, ring);
  }
  return shape;
}
function mochiFacePatch() {
  const patch = new T.PlaneGeometry(0.82, 0.46, 36, 24).rotateY(Math.PI);
  const points = patch.attributes.position;
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i);
    const y = points.getY(i) - 0.105;
    points.setXYZ(i, x, y, mochiFaceDepth(x, y) - 0.0018);
  }
  patch.computeVertexNormals();
  return patch;
}
function mochiFaceTexture(expression) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#472323';
  ctx.strokeStyle = '#472323';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const ellipse = (x, y, w, h) => {
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  if (expression === 'blush') {
    for (const x of [82, 430]) {
      ctx.save();
      ctx.translate(x, 173);
      ctx.scale(1, 0.55);
      const color = ctx.createRadialGradient(0, 0, 0, 0, 0, 54);
      color.addColorStop(0, 'rgba(255,255,255,.52)');
      color.addColorStop(0.44, 'rgba(255,255,255,.34)');
      color.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = color;
      ellipse(0, 0, 54, 54);
      ctx.restore();
    }
  } else {
    for (const x of [154, 358]) {
      if (expression === 'happy' || expression === 'sleepy' || expression === 'blink' || expression === 'yawn') {
        const curve = expression === 'happy' ? -19 : 13;
        ctx.beginPath();
        ctx.moveTo(x - 17, 115);
        ctx.quadraticCurveTo(x, 115 + curve, x + 17, 115);
        ctx.stroke();
      } else {
        ellipse(x, 115, 20, 39);
        ctx.fillStyle = '#a7635b';
        ellipse(x - 4, 101, 3, 5);
        ctx.fillStyle = '#472323';
      }
    }
    if (expression === 'happy') {
      ellipse(256, 158, 20, 13);
      ctx.fillStyle = '#ee8688';
      ellipse(256, 164, 11, 5);
    } else if (expression === 'yawn') {
      ellipse(256, 156, 14, 19);
    } else if (expression === 'surprised') {
      ellipse(256, 154, 9, 10);
    } else if (expression === 'sleepy') {
      ctx.strokeStyle = '#9d5654';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(250, 151);
      ctx.quadraticCurveTo(256, 155, 262, 151);
      ctx.stroke();
    }
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

function buildMochiBody(surface) {
  const shape = new T.SphereGeometry(1, 40, 28);
  const positions = shape.attributes.position;
  const power = 3.16;
  const tones = [];
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const radius = (Math.abs(x) ** power + Math.abs(y) ** power
      + Math.abs(z) ** power) ** (1 / power);
    const height = y / radius;
    const width = 0.23 * (1 - 0.048 * height);
    positions.setXYZ(i, x / radius * width, height * 0.171, z / radius * 0.151);
    const side = T.MathUtils.smoothstep(Math.abs(x / radius), 0.60, 1);
    const underside = 1 - T.MathUtils.smoothstep(height, -0.94, -0.58);
    const shade = 0.075 * side + 0.030 * underside;
    tones.push(1 - shade * 0.65, 1 - shade, 1 - shade * 0.91);
  }
  shape.computeVertexNormals();
  shape.setAttribute('color', new T.Float32BufferAttribute(tones, 3));
  const shadedSurface = surface.clone();
  shadedSurface.vertexColors = true;
  const body = mesh(shape, shadedSurface, 0, 0.272, 0.012);
  const feet = [];
  const arms = [];
  for (const side of [-1, 1]) {
    // Each limb has its own joint, recessed into the body at its attachment.
    const shoulder = new T.Group();
    shoulder.position.set(side * 0.18, 0.433, 0.012);
    const arm = oval(surface, side * 0.075, -0.112, -0.006, 0.077, 0.123, 0.082);
    arm.rotation.z = side * 0.29;
    shoulder.add(arm);
    scene.add(shoulder);
    arms.push(shoulder);

    const hip = new T.Group();
    hip.position.set(side * 0.109, mochiHipY, -0.021);
    // The heel extends into the hip, leaving a small rounded toe below the body.
    const footShape = new T.SphereGeometry(1, 32, 24);
    const footPoints = footShape.attributes.position;
    const footPower = 2.45;
    for (let i = 0; i < footPoints.count; i++) {
      const x = footPoints.getX(i);
      const y = footPoints.getY(i);
      const z = footPoints.getZ(i);
      const radius = (Math.abs(x) ** footPower + Math.abs(y) ** footPower
        + Math.abs(z) ** footPower) ** (1 / footPower);
      const height = y / radius;
      footPoints.setXYZ(i, x / radius * (0.083 - height * 0.009),
        height * 0.093, z / radius * 0.082 + height * 0.016);
    }
    footShape.computeVertexNormals();
    const foot = mesh(footShape, surface, -side * 0.005, -0.047, 0.012);
    foot.rotation.y = -side * 0.08;
    hip.add(foot);
    scene.add(hip);
    feet.push(hip);
  }
  return { body, feet, arms };
}

function buildFocusProps() {
  const props = new T.Group();
  const paper = material('#fce6bd', 0.85);
  const pageEdge = material('#ccb18d', 0.88);
  const print = material('#937e6a', 0.88);
  const cover = material('#536346', 0.79);
  const laptop = material('#706365', 0.48, 0.22);
  const keys = material('#3b2f32', 0.74);
  const screen = new T.MeshStandardMaterial({
    color: '#607b83', emissive: '#3b5a68', emissiveIntensity: 0.65, roughness: 0.65,
  });
  const variants = {};
  function collect(name, build) {
    const first = scene.children.length;
    build();
    const model = new T.Group();
    model.add(...scene.children.slice(first));
    model.visible = false;
    variants[name] = model;
    props.add(model);
    return model;
  }

  const book = collect('read', () => {
    box(0.42, 0.024, 0.282, cover, 0, 0, 0, 0.009);
    for (const side of [-1, 1]) {
      box(0.191, 0.029, 0.257, pageEdge, side * 0.101, 0.024, 0, 0.008);
      box(0.189, 0.009, 0.253, paper, side * 0.101, 0.041, 0, 0.004);
      for (let line = 0; line < 6; line++) {
        box(line === 5 ? 0.088 : 0.137, 0.0016, 0.003, print,
          side * 0.102, 0.046, -0.085 + line * 0.031);
      }
    }
  });
  book.position.set(0, 0.409, -0.421);
  book.rotation.set(0.23, -0.14, 0);

  const notebook = collect('write', () => {
    box(0.29, 0.015, 0.28, cover, 0, 0, 0, 0.005);
    box(0.273, 0.018, 0.26, paper, 0, 0.014, 0, 0.006);
    for (let line = 0; line < 7; line++) {
      box(0.217, 0.0015, 0.0025, print, 0, 0.024, -0.098 + line * 0.031);
    }
  });
  notebook.position.set(0.092, 0.374, -0.410);
  notebook.rotation.y = -0.16;

  const computer = collect('work', () => {
    box(0.425, 0.025, 0.27, laptop, 0, 0, 0, 0.009);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 9; col++) {
        box(0.031, 0.004, 0.024, keys, (col - 4) * 0.039, 0.015, -0.026 + row * 0.031, 0.002);
      }
    }
    box(0.1, 0.002, 0.054, keys, 0, 0.014, 0.102, 0.003);
    const first = scene.children.length;
    box(0.425, 0.282, 0.024, laptop, 0, 0.141, 0, 0.012);
    box(0.377, 0.231, 0.006, screen, 0, 0.146, 0.013, 0.004);
    const lid = new T.Group();
    lid.add(...scene.children.slice(first));
    lid.position.set(0, 0.009, -0.126);
    lid.rotation.x = -0.19;
    scene.add(lid);
  });
  computer.position.set(0, 0.378, -0.414);

  const checklist = collect('plan', () => {
    box(0.27, 0.023, 0.32, leather, 0, 0, 0, 0.014);
    box(0.247, 0.01, 0.289, paper, 0, 0.017, 0, 0.008);
    box(0.076, 0.018, 0.031, bronze, 0, 0.027, -0.132, 0.007);
    for (let row = 0; row < 4; row++) {
      const z = -0.082 + row * 0.054;
      box(0.029, 0.002, 0.029, print, -0.083, 0.023, z, 0.002);
      box(0.021, 0.002, 0.021, paper, -0.083, 0.025, z, 0.001);
      box(row % 2 ? 0.102 : 0.129, 0.002, 0.004, print, 0.022, 0.024, z, 0.001);
    }
    box(0.012, 0.004, 0.022, cover, -0.086, 0.029, -0.079, 0.002).rotation.y = 0.52;
    box(0.012, 0.004, 0.035, cover, -0.074, 0.029, -0.089, 0.002).rotation.y = -0.51;
  });
  checklist.position.set(0.045, 0.395, -0.445);
  checklist.rotation.set(0.14, -0.13, 0);

  const porcelain = material('#ebd5b5', 0.39);
  const teaGold = material('#ae8051', 0.43, 0.30);
  const tea = collect('tea', () => {
    const profile = [[0, 0], [0.063, 0], [0.083, 0.008], [0.088, 0.016],
      [0.084, 0.019], [0.062, 0.013], [0.044, 0.009], [0, 0.009]];
    mesh(new T.LatheGeometry(profile.map(([r, y]) => new T.Vector2(r, y)), 32),
      porcelain, 0.148, 0.364, -0.394);
    mesh(new T.TorusGeometry(0.077, 0.0014, 6, 32), teaGold,
      0.148, 0.380, -0.394).rotation.x = Math.PI / 2;
  });
  const cup = new T.Group();
  const cupProfile = [[0, 0], [0.032, 0], [0.043, 0.007], [0.052, 0.023],
    [0.055, 0.051], [0.055, 0.062], [0.051, 0.062], [0.048, 0.024], [0, 0.020]];
  cup.add(mesh(new T.LatheGeometry(cupProfile.map(([r, y]) => new T.Vector2(r, y)), 32),
    porcelain, 0, 0, 0));
  cup.add(cylinder(0.049, 0.049, 0.003, material('#aa672f', 0.38), 0, 0.049, 0));
  cup.add(mesh(new T.TorusGeometry(0.053, 0.0016, 7, 32), teaGold,
    0, 0.061, 0));
  cup.children.at(-1).rotation.x = Math.PI / 2;
  const handle = mesh(new T.TorusGeometry(0.021, 0.0057, 8, 24), porcelain, 0.060, 0.033, 0);
  handle.scale.y = 0.88;
  cup.add(handle);
  tea.add(cup);

  const pencil = new T.Group();
  pencil.add(cylinder(0.008, 0.008, 0.122, bronze, 0, 0.061, 0));
  pencil.add(cylinder(0.008, 0.001, 0.023, darkWood, 0, -0.0115, 0));
  notebook.add(pencil);
  scene.add(props);
  return { props, variants, pencil, checklist, cup };
}

function createMochiAnimator(mascot, pose, upper, head, arms, feet, showFace) {
  // Clip channels hold pose offsets. Locomotion can blend these without writing over the clips.
  const channels = new T.Group();
  const offsets = new T.Object3D();
  offsets.name = 'bodyCue';
  const aim = new T.Object3D();
  aim.name = 'headCue';
  const hands = new T.Object3D();
  hands.name = 'handCue';
  channels.add(offsets, aim, hands);
  const mixer = new T.AnimationMixer(channels);
  function clip(name, times, body, scale, headAngles, armAngles) {
    const track = (path, values) => new T.VectorKeyframeTrack(path, times, values.flat(), T.InterpolateSmooth);
    return new T.AnimationClip(name, times.at(-1), [
      track('bodyCue.position', body),
      track('bodyCue.scale', scale),
      track('headCue.position', headAngles),
      track('handCue.position', armAngles),
    ]);
  }

  const still = [0, 0, 0];
  const neutral = [1, 1, 1];
  const idle = mixer.clipAction(clip('Idle', [0, 1.2, 2.4, 3.6, 4.8],
    [still, [-0.010, 0.005, -0.021], still, [0.010, 0.004, 0.019], still],
    [neutral, [0.996, 1.014, 0.997], neutral, [0.997, 1.012, 0.997], neutral],
    [still, [-0.012, 0.028, 0.018], still, [-0.010, -0.024, -0.015], still],
    [still, [0.028, -0.015, 0], still, [-0.014, 0.025, 0], still]));
  idle.play();
  const gestures = {
    happy: mixer.clipAction(clip('Happy', [0, .18, .34, .50, .68, .82, 1.04],
      [still, [0, -.038, 0], [0, .115, 0], [0, .218, 0], [0, .112, 0], [0, -.021, 0], still],
      [neutral, [1.075, .87, 1.065], [.94, 1.135, .95], neutral, [.975, 1.04, .978],
        [1.056, .91, 1.05], neutral],
      [still, [-.095, 0, 0], [.105, 0, -.07], [.080, 0, .075], [-.095, 0, .03], [-.09, 0, 0], still],
      [still, [-.16, -.16, .04], [1.08, 1.08, .71], [1.25, 1.25, .88], [.80, .80, .61],
        [.20, .20, .12], still])),
    sleepy: mixer.clipAction(clip('Sleepy', [0, .28, .57, .95, 1.26, 1.51, 1.7, 1.89, 2.12, 2.42],
      [still, still, [0, .01, 0], [0, .01, 0], [0, -.012, -.03], [-.018, -.012, -.02],
        [-.022, -.014, -.036], [-.018, -.012, -.02], [-.01, -.01, 0], still],
      [neutral, neutral, [.995, 1.045, 1], [.995, 1.04, 1], [1.014, .968, 1.01], neutral, neutral,
        neutral, [1.01, .985, 1], neutral],
      [still, [-.08, 0, .05], [.16, 0, .05], [.15, 0, .035], [-.075, .07, -.055], [-.14, .16, -.09],
        [-.12, .11, -.12], [-.14, .16, -.09], [-.095, .03, -.045], still],
      [still, [.08, 0, 0], [1.9, 0, .24], [1.76, 0, .20], [.4, 0, 0], [2.15, 0, .15],
        [2.24, 0, .25], [2.15, 0, .15], [.38, 0, .06], still])),
  };
  for (const action of Object.values(gestures)) {
    action.setLoop(T.LoopOnce, 1);
    action.clampWhenFinished = true;
  }

  const { lerp, damp, clamp, smoothstep, euclideanModulo } = T.MathUtils;
  const shortAngle = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
  const contacts = feet.map(foot => ({ x: 0, z: 0, restX: foot.position.x, planted: false }));
  const restZ = feet[0].position.z;
  let phase = 0;
  let strideWeight = 0;
  let runWeight = 0;
  let gaitYaw = 0;
  let headYaw = 0;
  let gesture;
  let gestureName;
  let gestureTime = 0;
  let gestureWeight = 0;

  function cue(name) {
    gesture?.stop();
    gesture = gestures[name];
    gestureName = name;
    gestureTime = 0;
    gestureWeight = 0;
    gesture?.reset().setEffectiveWeight(0).play();
  }

  function reset() {
    phase = 0;
    strideWeight = 0;
    runWeight = 0;
    gaitYaw = headYaw = 0;
    cue(null);
    idle.setEffectiveWeight(1);
    pose.position.set(0, 0, 0);
    pose.scale.set(1, 1, 1);
    upper.position.set(0, 0, 0);
    upper.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    feet.forEach((foot, index) => {
      contacts[index].planted = false;
      foot.position.set(contacts[index].restX, mochiHipY, restZ);
    });
  }

  function update(dt, dx, dz, sprint, time, reduceMotion) {
    const distance = Math.hypot(dx, dz);
    if (distance > 0.0001) gaitYaw = Math.atan2(-dx, -dz);
    mascot.rotation.y += shortAngle(gaitYaw - mascot.rotation.y) * (1 - Math.exp(-dt * 14));
    headYaw += shortAngle(mascot.rotation.y - headYaw) * (1 - Math.exp(-dt * 9));
    const speed = dt > 0 ? distance / dt : 0;
    strideWeight = damp(strideWeight, smoothstep(speed, 0.035, 1.15), distance > 0.0001 ? 12 : 11, dt);
    runWeight = damp(runWeight, sprint ? smoothstep(speed, 1.3, 3.9) : 0, 9, dt);

    const cycle = lerp(.66, .84, runWeight);
    const stance = lerp(.55, .39, runWeight);
    const reach = cycle * stance * .5;
    phase = euclideanModulo(phase + distance / cycle, 1);
    const sin = Math.sin(mascot.rotation.y);
    const cos = Math.cos(mascot.rotation.y);
    for (const [index, foot] of feet.entries()) {
      const contact = contacts[index];
      const tick = euclideanModulo(phase + index * .5, 1);
      const grounded = tick < stance;
      const swing = clamp((tick - stance) / (1 - stance), 0, 1);
      const support = clamp(tick / stance, 0, 1);
      const step = grounded ? lerp(-reach, reach, support)
        : lerp(reach, -reach, smoothstep(swing, 0, 1));
      let localX = contact.restX;
      let localZ = restZ + step;
      if (grounded) {
        if (!contact.planted) {
          const touchdown = restZ + lerp(-reach, reach, tick / stance);
          contact.x = mascot.position.x + cos * localX + sin * touchdown;
          contact.z = mascot.position.z - sin * localX + cos * touchdown;
        }
        const x = contact.x - mascot.position.x;
        const z = contact.z - mascot.position.z;
        // Ease the contact correction in and out so turns and phase changes never snap a foot.
        const lock = smoothstep(support, 0, .2) * (1 - smoothstep(support, .78, 1));
        localX = lerp(localX, clamp(cos * x - sin * z, contact.restX - .042, contact.restX + .042), lock);
        localZ = lerp(localZ, clamp(sin * x + cos * z, restZ - .23, restZ + .23), lock);
      }
      contact.planted = grounded;
      const lift = grounded ? 0 : Math.sin(Math.PI * swing) ** 2;
      foot.position.set(lerp(contact.restX, localX, strideWeight), mochiHipY
        + (reduceMotion ? .035 : lerp(.032, .058, runWeight)) * lift * strideWeight,
      lerp(restZ, localZ, strideWeight));
      foot.rotation.x = reduceMotion ? 0 : Math.sin(Math.PI * 2 * swing) * lift * .21 * strideWeight;
      arms[index].rotation.x = -Math.cos(Math.PI * 2 * tick) * lerp(.23, .36, runWeight) * strideWeight;
      arms[index].rotation.z = 0;
    }

    if (reduceMotion) return strideWeight > .01;
    if (gesture) {
      gestureTime += dt;
      const duration = gesture.getClip().duration;
      const envelope = smoothstep(gestureTime, 0, .14) * (1 - smoothstep(gestureTime, duration - .17, duration));
      gestureWeight = damp(gestureWeight, envelope * (1 - smoothstep(strideWeight, .1, .55)), 20, dt);
      gesture.setEffectiveWeight(gestureWeight);
      if (gestureTime > duration + .16) cue(null);
    }
    idle.setEffectiveWeight(1 - gestureWeight);
    mixer.update(dt);

    const idleWeight = 1 - strideWeight;
    const bounce = -Math.cos(phase * Math.PI * 4);
    pose.position.y = Math.max(0, offsets.position.y) * idleWeight;
    pose.scale.copy(offsets.scale).lerp(neutralScale, strideWeight);
    upper.position.set(offsets.position.x * idleWeight, Math.min(0, offsets.position.y) * idleWeight +
      bounce * lerp(.0045, .0095, runWeight) * strideWeight, 0);
    upper.rotation.set(-lerp(.035, .16, runWeight) * strideWeight, 0,
      offsets.position.z * idleWeight + Math.sin(phase * Math.PI * 2) * lerp(.013, .017, runWeight) * strideWeight);
    head.rotation.set(aim.position.x * idleWeight + .038 * runWeight,
      aim.position.y * idleWeight + clamp(shortAngle(headYaw - mascot.rotation.y), -.28, .28),
      aim.position.z * idleWeight);
    arms[0].rotation.x += hands.position.x * idleWeight;
    arms[1].rotation.x += hands.position.y * idleWeight;
    arms[0].rotation.z += hands.position.z * idleWeight;
    arms[1].rotation.z -= hands.position.z * idleWeight;
    const yawning = gestureName === 'sleepy' && gestureWeight > .3 && gestureTime > .43 && gestureTime < 1.07;
    showFace(yawning ? 'yawn' : null, time);
    return strideWeight > .01 || Boolean(gesture);
  }
  const neutralScale = new T.Vector3(1, 1, 1);
  return { update, reset, cue };
}

function buildMascot() {
  const start = scene.children.length;
  const skin = material('#f5a0a3', 0.78);
  const ink = material('#432320', 0.47);
  const capLeather = material('#683825', 0.73);
  const trim = material('#af7040', 0.61);
  const brass = material('#de9d4e', 0.34, 0.36);
  const glass = material('#756881', 0.28, 0.14);
  const scarfRed = material('#943a31', 0.82);
  const scarfShade = material('#782723', 0.85);
  const mascot = new T.Group();
  const group = build => {
    const first = scene.children.length;
    build();
    const result = new T.Group();
    result.add(...scene.children.slice(first));
    mascot.add(result);
    return result;
  };

  const shadow = oval(new T.MeshBasicMaterial({ color: '#32151a', transparent: true, opacity: 0.22, depthWrite: false }),
    0, 0.017, 0, 0.37, 0.007, 0.33);
  const { body, feet, arms } = buildMochiBody(skin);
  const head = mesh(makeMochiHead(), skin, 0, mochiHeadY, 0);
  head.scale.set(mochiHeadScale, mochiHeadHeightScale, mochiHeadScale);

  const patch = mochiFacePatch();
  // Surface decals keep the soft blush and features flush with the curved head.
  const blush = new T.MeshBasicMaterial({
    color: '#db6269', map: mochiFaceTexture('blush'), transparent: true, depthWrite: false,
  });
  const cheekDecal = mesh(patch, blush, 0, mochiHeadY, 0);
  cheekDecal.scale.copy(head.scale);
  cheekDecal.renderOrder = 1;
  const expressions = Object.fromEntries(['gentle', 'happy', 'sleepy', 'surprised', 'blink', 'yawn'].map(name => {
    const surface = new T.MeshBasicMaterial({
      map: mochiFaceTexture(name), transparent: true, depthWrite: false,
    });
    const face = mesh(patch, surface, 0, mochiHeadY, 0);
    face.scale.copy(head.scale);
    face.renderOrder = 2;
    return [name, face];
  }));
  let selectedExpression = 'gentle';

  const scarf = group(() => {
    oval(scarfShade, 0, 0.726, -0.103, 0.364, 0.087, 0.265);
    oval(scarfRed, 0, 0.785, -0.091, 0.389, 0.074, 0.284);
    box(0.14, 0.31, 0.08, scarfRed, -0.208, 0.655, 0.207, 0.038).rotation.z = -0.17;
    for (const x of [-0.268, -0.236, -0.204, -0.172]) {
      box(0.015, 0.072, 0.038, scarfShade, x, 0.499, 0.217, 0.007).rotation.z = -0.17;
    }
  });
  const accessories = {
    pilot: group(() => {
      const shell = new T.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, 1);
      const rim = [];
      const capPoint = (angle, fraction) => {
        const back = (1 + Math.sin(angle)) * 0.5;
        const polar = (1.115 + back * 0.915) * fraction;
        return new T.Vector3(-0.545 * Math.cos(angle) * Math.sin(polar),
          1.173 + 0.458 * Math.cos(polar), 0.02 + 0.535 * Math.sin(angle) * Math.sin(polar));
      };
      const points = shell.attributes.position;
      for (let row = 0; row <= 24; row++) {
        for (let col = 0; col <= 48; col++) {
          const point = capPoint(col * Math.PI / 24, row / 24);
          points.setXYZ(row * 49 + col, point.x, point.y, point.z);
          if (row === 24 && col < 48) rim.push(point);
        }
      }
      shell.computeVertexNormals();
      mesh(shell, capLeather, 0, 0, 0);
      mesh(new T.TubeGeometry(new T.CatmullRomCurve3(rim, true), 64, 0.026, 8, true), trim, 0, 0, 0);
      for (const side of [-1, 1]) {
        oval(capLeather, side * 0.465, 1.157, 0.033, 0.085, 0.181, 0.167).rotation.x = -0.24;
        oval(brass, side * 0.536, 1.14, -0.025, 0.026, 0.061, 0.06);
        const lens = new T.Group();
        const first = scene.children.length;
        const bezel = mesh(new T.TorusGeometry(0.112, 0.025, 10, 28), brass, 0, 0, -0.021);
        bezel.scale.x = 1.18;
        oval(glass, 0, 0, -0.017, 0.126, 0.105, 0.037);
        oval(material('#e6b9ac'), -0.037, 0.039, -0.051, 0.04, 0.009, 0.004).rotation.z = 0.18;
        lens.add(...scene.children.slice(first));
        lens.position.set(side * 0.174, 1.495, -0.37);
        lens.rotation.set(0.42, -side * 0.17, side * 0.13);
        scene.add(lens);
      }
      box(0.14, 0.056, 0.066, trim, 0, 1.49, -0.371, 0.026);
    }),
    satchel: group(() => {
      box(0.067, 0.4, 0.048, trim, 0.07, 0.592, -0.23, 0.023).rotation.z = 0.83;
      box(0.27, 0.208, 0.106, leather, 0.157, 0.447, -0.224, 0.047);
      box(0.27, 0.086, 0.038, trim, 0.157, 0.507, -0.282, 0.023);
      box(0.052, 0.058, 0.016, brass, 0.157, 0.48, -0.306, 0.012);
    }),
    headphones: group(() => {
      const arc = mesh(new T.TorusGeometry(0.485, 0.037, 10, 32, Math.PI), capLeather, 0, 1.12, 0);
      arc.scale.y = 1.02;
      for (const side of [-1, 1]) {
        oval(ink, side * 0.478, 1.115, 0, 0.064, 0.169, 0.14);
        oval(brass, side * 0.53, 1.115, 0, 0.061, 0.151, 0.128);
        oval(trim, side * 0.585, 1.115, 0, 0.016, 0.092, 0.082);
      }
    }),
  };
  for (const headwear of [accessories.pilot, accessories.headphones]) {
    headwear.scale.copy(head.scale);
    headwear.position.y = mochiHeadY - 1.077 * mochiHeadHeightScale;
  }
  scarf.scale.set(0.79, 0.78, 0.83);
  scarf.position.y = -0.165;
  accessories.satchel.scale.set(0.78, 0.73, 0.78);
  accessories.satchel.position.y = -0.027;
  mascot.add(...scene.children.slice(start));
  const headPivot = new T.Group();
  headPivot.position.y = mochiHeadY;
  for (const part of [head, cheekDecal, ...Object.values(expressions), accessories.pilot, accessories.headphones]) {
    part.position.y -= mochiHeadY;
    headPivot.add(part);
  }
  const pose = new T.Group();
  const upper = new T.Group();
  upper.add(body, headPivot, scarf, accessories.satchel, ...arms);
  pose.add(upper, ...feet);
  mascot.add(shadow, pose);
  mascot.position.z = 5.95;
  scene.add(mascot);
  function applyStyle({ color, accessory, expression }) {
    skin.color.set(mascotColors[color][0]);
    skin.emissive.copy(skin.color);
    skin.emissiveIntensity = 0.105;
    body.material.color.copy(skin.color);
    body.material.emissive.copy(skin.emissive);
    body.material.emissiveIntensity = skin.emissiveIntensity;
    blush.color.set(mascotColors[color][1]);
    accessories.pilot.visible = accessory === 'pilot' || accessory === 'cap';
    accessories.satchel.visible = accessory === 'pilot' || accessory === 'satchel';
    accessories.headphones.visible = accessory === 'headphones';
    selectedExpression = expression;
    showFace(null, 0);
    scarf.visible = accessory === 'pilot' || accessory === 'scarf';
  }
  let visibleExpression;
  function showFace(override, time) {
    const blink = (time + 3.2) % 4.4 < 0.115;
    const name = override ?? (selectedExpression === 'gentle' && blink ? 'blink' : selectedExpression);
    if (visibleExpression === name) return;
    for (const [key, item] of Object.entries(expressions)) item.visible = key === name;
    visibleExpression = name;
  }
  const animator = createMochiAnimator(mascot, pose, upper, headPivot, arms, feet, showFace);
  const { props, variants, pencil, checklist, cup } = buildFocusProps();
  // Each target is authored in the prop's own coordinates, so a moving prop carries its grip.
  const contactPoint = new T.Vector3();
  const armDirection = new T.Vector3();
  const armDown = new T.Vector3(0, -1, 0);
  const armRest = arms.map(({ children: [arm] }) => ({
    position: arm.position.clone(), rotation: arm.quaternion.clone(), length: arm.scale.y,
  }));

  function reach(index, target, x, y, z) {
    const shoulder = arms[index];
    const arm = shoulder.children[0];
    contactPoint.set(x, y, z);
    target.localToWorld(contactPoint);
    shoulder.worldToLocal(contactPoint);
    // Keep the shoulder planted and aim the rounded end at the contact point.
    armDirection.copy(contactPoint).normalize();
    arm.position.copy(contactPoint).multiplyScalar(0.48);
    arm.quaternion.setFromUnitVectors(armDown, armDirection);
    arm.scale.y = contactPoint.length() * 0.54;
  }

  function setActivity(activity) {
    headPivot.rotation.set(0, 0, 0);
    arms.forEach((shoulder, index) => {
      const arm = shoulder.children[0];
      const rest = armRest[index];
      shoulder.rotation.set(0, 0, 0);
      arm.position.copy(rest.position);
      arm.quaternion.copy(rest.rotation);
      arm.scale.y = rest.length;
    });
    props.position.copy(mascot.position);
    props.visible = Boolean(variants[activity]);
    for (const [name, item] of Object.entries(variants)) item.visible = name === activity;
  }

  function animateActivity(activity, time) {
    const wave = Math.sin(time * 2.2);
    headPivot.rotation.x = activity === 'work' ? -0.08 : -0.18 + wave * 0.018;
    if (activity === 'read') {
      reach(0, variants.read, -0.174, 0.029, 0.122 + wave * 0.004);
      reach(1, variants.read, 0.173, 0.029, 0.119 - wave * 0.004);
    } else if (activity === 'write') {
      pencil.position.set(0.065 + Math.sin(time * 7.2) * 0.028, 0.045,
        0.088 + wave * 0.019);
      pencil.rotation.set(0.33 + wave * 0.07, 0.10, -0.39);
      reach(0, variants.write, -0.132, 0.026, 0.107);
      reach(1, pencil, 0.004, 0.043, 0);
    } else if (activity === 'plan') {
      reach(0, checklist, -0.123, 0.020, 0.124);
      reach(1, checklist, 0.083 + wave * 0.016, 0.024, 0.080 + wave * 0.023);
    } else if (activity === 'think') {
      headPivot.rotation.set(0.045 + wave * 0.045, 0.15 + wave * 0.09, -0.075);
      reach(1, headPivot, 0.188, -0.207 + wave * 0.006, -0.261);
    } else if (activity === 'tea') {
      const phase = time % 9.2;
      const ease = T.MathUtils.smootherstep;
      const lift = ease(phase, 0.45, 1.85) * (1 - ease(phase, 3.10, 4.65));
      const sip = ease(phase, 1.90, 2.42) * (1 - ease(phase, 2.70, 3.18));
      headPivot.rotation.x = -0.06 - lift * 0.065 - sip * 0.04;
      headPivot.rotation.z = -0.045 * lift;
      cup.position.set(0.148 - lift * 0.077, 0.375 + lift * 0.154,
        -0.394 + lift * 0.034 + sip * 0.004);
      cup.rotation.set(sip * 0.19, -0.14 * lift, -0.05 * lift);
      reach(1, cup, 0.079, 0.034, 0.002);
    } else if (activity === 'work') {
      const keyboard = variants.work;
      for (const index of [0, 1]) {
        const tap = Math.sin(time * (index ? 9.8 : 8.9) + index * 1.7);
        const lift = Math.max(0, tap) ** 2 * 0.018;
        reach(index, keyboard, (index ? 1 : -1) * 0.118,
          0.016 + lift, 0.060 + tap * 0.009);
      }
    }
  }
  setActivity('idle');
  return { mascot, feet, arms, props, applyStyle, setActivity, animateActivity, animator,
    cueExpression: () => animator.cue(selectedExpression), showFace };
}

function setupMascotCustomizer(avatar, renderer, onChange, onOpen) {
  const button = document.querySelector('#avatar-toggle');
  const panel = document.querySelector('#avatar-panel');
  const controls = Array.from(panel.querySelectorAll('select'));
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(mascotStorageKey)) ?? {}; } catch {}
  for (const control of controls) {
    const value = saved[control.name];
    control.value = Array.from(control.options).some(option => option.value === value)
      ? value : mascotDefaults[control.name];
  }

  let preview;
  function drawPreview() {
    if (!preview) {
      const display = new T.WebGLRenderer({ antialias: true, alpha: true });
      display.toneMapping = renderer.toneMapping;
      display.toneMappingExposure = renderer.toneMappingExposure;
      display.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      display.setSize(252, 208, false);
      panel.querySelector('.avatar-preview').append(display.domElement);
      const studio = new T.Scene();
      studio.add(new T.HemisphereLight('#ffe5e1', '#aa8194', 2.3));
      const key = new T.DirectionalLight('#ffe9d3', 2.0);
      key.position.set(-3, 4, -4);
      studio.add(key);
      const camera = new T.PerspectiveCamera(36, 252 / 208, 0.05, 15);
      camera.position.set(0, 0.87, -2.32);
      camera.lookAt(0, 0.55, 0);
      const turntable = new T.Group();
      studio.add(turntable);
      preview = { display, studio, camera, turntable };
    }
    const { display, studio, camera, turntable } = preview;
    const model = avatar.mascot.clone();
    model.position.set(0, 0, 0);
    model.rotation.set(0, -0.22, 0);
    model.visible = true;
    turntable.clear();
    turntable.add(model);
    display.render(studio, camera);
  }
  function apply(save = false) {
    const style = Object.fromEntries(controls.map(control => [control.name, control.value]));
    avatar.applyStyle(style);
    onChange();
    if (save) {
      try { localStorage.setItem(mascotStorageKey, JSON.stringify(style)); } catch {}
    }
    if (panel.open) {
      try { drawPreview(); } catch { panel.querySelector('.avatar-preview').hidden = true; }
    }
  }
  panel.addEventListener('change', () => apply(true));
  button.addEventListener('click', () => {
    onOpen();
    panel.showModal();
    apply();
  });
  button.disabled = false;
  apply();
  return panel;
}

export async function start({ buildExterior } = {}) {
  const kit = buildExterior ? null : await loadExteriorStudy();
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
  const firstCabinObject = scene.children.length;
  buildShell();
  const tableStacks = buildBooths();
  buildBulkhead(-17.33, false);
  buildBulkhead(13.42, true);
  const cabinObjects = scene.children.slice(firstCabinObject);
  const scenery = buildExterior ? buildExterior(scene) : buildScenery(kit);
  const cabin = scenery.trainSpeed ? new T.Group() : null;
  if (cabin) {
    cabin.add(...cabinObjects);
    batchScenery(cabin);
    scene.add(cabin);
  } else {
    batchScenery();
  }
  const avatar = buildMascot();
  cabin?.add(avatar.mascot, avatar.props);
  play(renderer, avatar, scenery, cabin, tableStacks);
  status.remove();
}

function play(renderer, avatar,
  { layers, animateAmbient, sceneryFrameLimit = 0.08, trainSpeed = 0 }, cabin, tableStacks) {
  const { mascot, feet, arms } = avatar;
  const motionButton = document.querySelector('#motion-toggle');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let trainMoving = !reduceMotion;
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
  const activityPicker = document.querySelector('#activity-picker');
  const panel = document.querySelector('#focus-panel');
  const timer = document.querySelector('#focus-clock');
  const timerButton = document.querySelector('#timer-start');
  const duration = 25 * 60 * 1000;
  let remaining = duration;
  let deadline = null;
  let firstPerson = false;
  let seated = false;
  let currentStack;
  let activity = 'idle';
  let activityTime = 0;
  let yaw = 0;
  let pitch = 0;
  let drag = null;
  let distance = 4.85;
  let needsRender = true;
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
      currentStack = tableStacks[booth];
      // Center on the bench and leave room for the head in front of the backrest.
      mascot.position.set(boothCenter, 0.665, -13.3 + booth * 3.6 + 0.735);
      mascot.rotation.y = 0;
    } else {
      mascot.position.set(aisleLimit - 0.18, 0, mascot.position.z);
      mascot.rotation.y = 0;
      activity = 'idle';
      currentStack.visible = true;
      currentStack = undefined;
      activityPicker.value = activity;
      avatar.setActivity(activity);
    }
    follow.copy(mascot.position);
    avatar.animator.reset();
    avatar.showFace(null, 0);
    feet.forEach((foot, index) => {
      foot.position.y = seated ? 0.107 : mochiHipY;
      foot.position.z = seated ? -0.119 : -0.021;
      foot.rotation.x = seated ? 0.9 : 0;
      arms[index].rotation.x = seated ? 0.10 : 0;
    });
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
  activityPicker.value = activity;
  activityPicker.disabled = false;
  activityPicker.addEventListener('change', () => {
    activity = activityPicker.value;
    if (activity !== 'idle' && !seated) toggleSeat();
    activityTime = 0;
    avatar.setActivity(activity);
    if (currentStack) currentStack.visible = !['read', 'write', 'work', 'plan'].includes(activity);
    if (activity === 'idle') {
      for (const arm of arms) arm.rotation.x = seated ? 0.10 : 0;
    }
    needsRender = true;
  });
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

  const avatarPanel = setupMascotCustomizer(avatar, renderer,
    () => { needsRender = true; },
    () => { keys.clear(); velocity.set(0, 0); });

  avatarPanel.addEventListener('close', () => {
    if (!seated && !reduceMotion) avatar.cueExpression();
  });

  const movement = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ShiftLeft', 'ShiftRight']);
  window.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || avatarPanel.open || event.target === activityPicker) return;
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
  let ambientTime = 0;

  renderer.setAnimationLoop(now => {
    const elapsed = (now - lastFrame) / 1000;
    const dt = clamp(elapsed, 0, 0.08);
    const sceneryDt = clamp(elapsed, 0, sceneryFrameLimit);
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
    const dxMoved = position.x - oldX;
    const dzMoved = position.z - oldZ;
    if (!seated && avatar.animator.update(dt, dxMoved, dzMoved, sprint, ambientTime, reduceMotion)) {
      needsRender = true;
    }
    if (Math.abs(dxMoved) + Math.abs(dzMoved) > 0.0001) needsRender = true;

    const cameraMoving = follow.distanceToSquared(position) > 0.000002;
    if (firstPerson) follow.copy(position);
    else follow.lerp(position, 1 - Math.exp(-dt * 15));
    updateTimer();
    ambientTime += dt;
    const working = seated && activity !== 'idle';
    if (working && !reduceMotion) activityTime += dt;
    if (trainMoving) {
      if (cabin) cabin.position.z -= sceneryDt * trainSpeed;
      for (const { strip, speed, length } of layers) {
        strip.position.z = (strip.position.z + sceneryDt * speed) % length;
      }
    }
    if (!needsRender && !cameraMoving && (!animateAmbient || now - lastSceneryRender < 1000 / 30)) return;
    lastSceneryRender = now;
    const trainZ = cabin?.position.z ?? 0;
    animateAmbient?.(ambientTime, trainZ);
    if (working) avatar.animateActivity(activity, activityTime);
    needsRender = false;

    const { x, y, z } = follow;
    const sinYaw = Math.sin(yaw);
    const cosYaw = Math.cos(yaw);
    mascot.visible = !firstPerson;
    if (seated && !reduceMotion) avatar.showFace(null, ambientTime);
    if (firstPerson) {
      const eyeHeight = y + (seated ? 0.72 : 1.45);
      camera.position.set(x, eyeHeight, z);
      look.set(x + sinYaw * Math.cos(pitch), eyeHeight + Math.sin(pitch), z - cosYaw * Math.cos(pitch));
    } else if (seated) {
      const reach = clamp(distance * (working ? 0.51 : 0.57), 1.65, 2.85);
      camera.position.set(clamp(0.65 - sinYaw * 1.05, -1.15, 1.47),
        clamp(y + 1.37 - pitch * 0.9, 1.55, 2.8),
        clamp(z - reach + (1 - cosYaw) * 1.24, -16.8, 12.95));
      look.set(x, y + 0.59, z);
    } else {
      const pivotX = clamp(x, -cameraAisleLimit + 0.08, cameraAisleLimit - 0.08);
      const elevation = clamp(0.14 - pitch, -0.33, 0.72);
      const orbitX = -sinYaw * Math.cos(elevation);
      const orbitZ = cosYaw * Math.cos(elevation);
      const toSide = orbitX > 0 ? cameraAisleLimit - pivotX : cameraAisleLimit + pivotX;
      const toEnd = orbitZ > 0 ? 12.95 - z : z + 16.8;
      const radius = Math.min(distance, toSide / Math.max(Math.abs(orbitX), 0.001),
        toEnd / Math.max(Math.abs(orbitZ), 0.001));
      const sideView = T.MathUtils.smoothstep(Math.abs(sinYaw), 0.48, 0.99);
      const lift = 0.40 * (1 - clamp(radius / 1.6, 0, 1));
      const shoulderOffset = sideView * (2.55 + 0.48 * clamp((distance - 2.2) / 3.6, 0, 1));
      camera.position.set(pivotX + orbitX * radius,
        clamp(y + 1.38 + Math.sin(elevation) * radius + lift + sideView * 0.13, 1.42, 2.98),
        clamp(z + orbitZ * radius + shoulderOffset, -16.8, 12.95));
      look.set(pivotX + sinYaw * (0.42 + sideView * 1.42),
        y + 1.17 + sideView * (0.10 + Math.sin(pitch) * 0.86),
        z - cosYaw * 0.42 + sideView * 0.15);
    }
    camera.position.z += trainZ;
    look.z += trainZ;
    camera.lookAt(look);
    renderer.render(scene, camera);
  });
}
