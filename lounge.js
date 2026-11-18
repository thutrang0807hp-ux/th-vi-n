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
  const ground = material('#394947');
  const lake = material('#4e6486', 0.29, 0.20);
  lake.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 lakePosition;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nlakePosition = (modelMatrix * vec4(position, 1.0)).xyz;'
    );
    shader.fragmentShader = 'varying vec3 lakePosition;\n' + shader.fragmentShader.replace(
      '#include <opaque_fragment>', `
        vec3 delta = lakePosition - cameraPosition;
        float x = abs(delta.x);
        float sideways = delta.z + x * 0.25;
        float drift = 0.36 * sin(lakePosition.x * 0.57 + lakePosition.z * 0.30);
        float width = mix(0.65, 1.9, smoothstep(12.0, 44.0, x));
        float plume = exp(-pow(abs(sideways + drift) / width, 2.0));
        float glow = exp(-abs(sideways) * 0.27);
        float fade = smoothstep(12.0, 23.0, x) * (1.0 - smoothstep(35.0, 47.0, x));
        float broken = smoothstep(-0.48, 0.9,
          sin(lakePosition.x * 1.34 + lakePosition.z * 0.81)
          + 0.64 * cos(lakePosition.x * 2.14 - lakePosition.z * 1.33));
        outgoingLight += vec3(0.56, 0.37, 0.32) * fade * (0.12 * glow + plume * (0.10 + 0.18 * broken));
        #include <opaque_fragment>
      `
    );
  };
  const siding = ['#896b60', '#a78670', '#715c63'].map(color => material(color));
  const roof = material('#4a3f55');
  const timber = material('#4e3a39');
  const windowLight = new T.MeshBasicMaterial({ color: '#ffcf85' });
  const lanternReflection = new T.MeshBasicMaterial({ color: '#b58f97' });
  const autumn = ['#805261', '#a86163', '#704657'].map(color => material(color));
  const crownGeometry = new T.IcosahedronGeometry(1, 1);
  const trunks = material('#554639');
  const gravel = material('#7e7769');
  const grass = material('#606d54');
  const ochre = material('#b19a66');
  const shrub = material('#59794b');
  const pines = ['#234c49', '#355b48', '#557253'].map(color => material(color));
  const conifer = new T.ConeGeometry(1, 1, 7);
  const ripple = new T.MeshBasicMaterial({ color: '#7084a4' });

  scene.fog.color.set('#a397bb');
  const sky = new T.ShaderMaterial({
    side: T.BackSide,
    uniforms: {
      horizon: { value: new T.Color('#e7adbc') },
      zenith: { value: new T.Color('#6c75b6') }
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
      varying vec3 direction;
      void main() {
        float height = smoothstep(-0.04, 0.42, normalize(direction).y);
        vec3 ray = normalize(direction);
        float bands = sin(ray.x * 10.0 + ray.z * 4.0 + ray.y * 42.0)
          + 0.55 * sin(ray.z * 17.0 + ray.y * 71.0);
        float cloud = smoothstep(0.65, 1.4, bands) * smoothstep(0.07, 0.2, ray.y)
          * (1.0 - smoothstep(0.36, 0.66, ray.y));
        vec3 skyColor = mix(horizon, zenith, height);
        skyColor = mix(skyColor, horizon * 1.14, cloud * 0.27);
        vec3 moonDirection = normalize(vec3(1.0, 0.22, -0.25));
        float angle = distance(vec3(abs(ray.x), ray.yz), moonDirection);
        float halo = 0.16 * (1.0 - smoothstep(0.025, 0.145, angle));
        float moon = 1.0 - smoothstep(0.020, 0.023, angle);
        vec3 moonColor = vec3(1.0, 0.84, 0.67);
        gl_FragColor = vec4(mix(skyColor, moonColor, max(halo, moon)), 1.0);
        #include <colorspace_fragment>
      }
    `
  });
  mesh(new T.SphereGeometry(142, 32, 16), sky, 0, 0, -2);
  box(220, 0.15, 300, ground, 0, -2.48, 0);
  for (const side of [-1, 1]) {
    box(35, 0.12, 300, lake, side * 28.5, -2.36, 0);
  }

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

  function grove(x, z, height, variety) {
    const trunk = mesh(conifer, trunks, x, -2.39 + height * 0.22, z);
    trunk.scale.set(0.115, height * 0.44, 0.115);
    for (let level = 0; level < 4; level++) {
      const branch = mesh(conifer, pines[(variety + Number(level === 3)) % pines.length], x,
        -2.39 + height * (0.34 + level * 0.166), z);
      const width = height * (0.22 - level * 0.043);
      branch.scale.set(width, height * (0.47 - level * 0.043), width);
      branch.rotation.y = variety + level * 0.53;
    }
  }

  function maple(x, y, z, scale, color) {
    const trunk = mesh(conifer, trunks, x, y + scale * 0.61, z);
    trunk.scale.set(scale * 0.095, scale * 1.22, scale * 0.095);
    for (const [dx, height, dz, width] of [[0, 1.3, 0, 0.65], [0.36, 1.13, 0.22, 0.48], [-0.31, 1.23, -0.23, 0.50]]) {
      const crown = mesh(crownGeometry, autumn[color], x + dx * scale, y + height * scale, z + dz * scale);
      crown.scale.set(width * scale, width * scale * 0.79, width * scale);
      crown.rotation.y = 0.8 + dx;
    }
  }

  function cottage(side, x, z, size, groundLevel, finish) {
    const walls = siding[finish];
    const facade = x - side * size * 0.54;
    const eave = groundLevel + size * 0.65;
    box(size * 1.07, size * 0.69, size * 1.32, walls, x, groundLevel + size * 0.34, z);
    for (const sign of [-1, 1]) {
      const slope = box(size * 1.21, size * 0.084, size * 0.81, roof,
        x, eave + size * 0.18, z + sign * size * 0.35);
      slope.rotation.x = sign * 0.46;
      const windowZ = z + sign * size * 0.36;
      box(0.055, size * 0.35, size * 0.35, timber, facade, groundLevel + size * 0.39, windowZ);
      box(0.058, size * 0.26, size * 0.27, windowLight,
        facade - side * 0.026, groundLevel + size * 0.39, windowZ);
      box(0.061, size * 0.26, size * 0.025, timber,
        facade - side * 0.049, groundLevel + size * 0.39, windowZ);
    }
    const gable = new T.Shape();
    gable.moveTo(-size * 0.66, 0);
    gable.lineTo(size * 0.66, 0);
    gable.lineTo(0, size * 0.35);
    gable.closePath();
    const wall = mesh(new T.ExtrudeGeometry(gable, { depth: size * 1.05, bevelEnabled: false }),
      walls, x - size * 0.525, eave, z);
    wall.rotation.y = Math.PI / 2;
    box(size * 0.19, size * 0.40, size * 0.18, timber, x + size * 0.24, eave + size * 0.30, z + size * 0.28);
    box(0.065, size * 0.45, size * 0.28, timber, facade - side * 0.03,
      groundLevel + size * 0.23, z);
  }

  loop(74, 9.2, 3, length => {
    for (const side of [-1, 1]) {
      const geometry = new T.PlaneGeometry(length, 1, 60, 10);
      const vertices = geometry.attributes.position;
      function bank(z) {
        const phase = z / length * Math.PI * 2;
        return 13.2 + 2.15 * Math.sin(phase * 2 + side) + 1.45 * Math.cos(phase * 3);
      }
      for (let i = 0; i < vertices.count; i++) {
        const z = vertices.getX(i);
        const t = vertices.getY(i) + 0.5;
        const edge = bank(z);
        const slope = Math.sin(t * Math.PI) ** 1.25;
        const y = -2.45 + slope * (0.73 + 0.29 * Math.cos(z / length * Math.PI * 6 + side));
        vertices.setXYZ(i, side * (4.4 + t * (edge - 4.4)), y, z);
      }
      if (side === -1) {
        const indices = geometry.index.array;
        for (let i = 0; i < indices.length; i += 3) {
          [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
        }
      }
      geometry.computeVertexNormals();
      grass.side = T.DoubleSide;
      mesh(geometry, grass, 0, 0, 0);
      for (let cluster = 0; cluster < 5; cluster++) {
        const center = -length / 2 + 6 + cluster * 14 + random() * 5;
        const count = 1 + Math.floor(random() * 3);
        for (let i = 0; i < count; i++) {
          const z = center + (random() - 0.5) * 7;
          const x = 6.8 + random() * Math.max(1, bank(z) - 8);
          if (cluster % 2 === 0) maple(side * x, -2.05, z, 0.85 + random() * 0.78, cluster % 3);
          else grove(side * x, z, 1.6 + random() * 2.6, i % 3);
        }
      }
      for (let i = 0; i < 26; i++) {
        const z = (random() - 0.5) * length;
        const x = side * (6 + random() * (bank(z) - 5));
        const size = 0.13 + random() * 0.45;
        const mound = oval([gravel, shrub, ochre][i % 3], x, -2.02, z, size, size * 0.39, size * 1.35);
        mound.rotation.y = random() * Math.PI;
      }
    }
  });

  loop(98, 3.25, 2, length => {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 27; i++) {
        const glint = box(0.05 + random() * 0.17, 0.007, 0.45 + random() * 3.4, ripple,
          side * (14 + random() * 29), -2.293, (random() - 0.5) * length);
        glint.rotation.y = (random() - 0.5) * 0.4;
      }
      for (let i = 0; i < 9; i++) {
        const z = -44 + i * 11;
        oval(grass, side * (48 + random() * 2), -2.53, z, 7.1 + random() * 2.4, 1.45, 8.5);
        for (let n = 0; n < 3; n++) {
          grove(side * (48 + random() * 5), z + (random() - 0.5) * 9, 2.1 + random() * 3.2, n % 3);
        }
      }
      const villageZ = -24 + side * 4;
      const homes = [[0, 0, 2.85, -1.55], [6.5, 4.0, 1.65, -0.72], [9.4, 0.8, 2.2, -1.47], [25.5, 6.4, 2.42, -0.52]];
      for (const [i, [along, inland, size, terrace]] of homes.entries()) {
        const z = villageZ + along;
        const x = side * (42.5 + inland);
        oval(grass, x + side * 0.9, -2.36, z, 3.1 + size, terrace + 2.36, 3.2 + size);
        cottage(side, x, z, size, terrace, i % siding.length);
        if (i !== 1) maple(x + side * 0.9, terrace - 0.12, z - 2.15 - (i % 2), 1.25 + size * 0.27, i % autumn.length);
        for (let gleam = 0; gleam < 3; gleam++) {
          const gap = 1.1 + random() * 3;
          box(0.18 + random() * 0.33, 0.006, 0.13 + random() * 0.4, lanternReflection,
            side * (Math.abs(x) - 5.6 - gap), -2.292, z + (random() - 0.5) * 1.1);
        }
      }
    }
  });

  const ridge = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.98, flatShading: true, side: T.DoubleSide });
  const warmRock = new T.Color('#697698');
  const highRock = new T.Color('#8994b5');
  const snow = new T.Color('#efe8f0');
  const tint = new T.Color();
  loop(116, 0.65, 2, length => {
    for (const side of [-1, 1]) {
      for (let row = 0; row < 2; row++) {
        const geometry = new T.PlaneGeometry(length, 32, 48, 12);
        const vertices = geometry.attributes.position;
        const colors = [];
        for (let i = 0; i < vertices.count; i++) {
          const z = vertices.getX(i);
          const slope = vertices.getY(i) / 32 + 0.5;
          const angle = z / length * Math.PI * 2;
          const jagged = 0.46 * Math.sin(angle * 5 + side) + 0.28 * Math.cos(angle * 11 + row);
          const rolling = 0.65 + 0.35 * Math.cos(angle * 2 - row * 1.6 + side);
          const peak = 4 + 6 * row + 7.4 * rolling * Math.sin(angle * (2 + row) + row * 1.4) ** 2
            + jagged * (1.25 + row * 1.2);
          const height = Math.sin(slope * Math.PI) ** 1.4 * peak + Math.sin(angle * 17 + slope * 17)
            * Math.sin(slope * Math.PI) * 0.60;
          vertices.setXYZ(i, side * (52 + row * 28 + slope * 32), -2.45 + height, z);
          tint.copy(warmRock).lerp(highRock, T.MathUtils.smoothstep(height, 4, 19));
          tint.lerp(snow, T.MathUtils.smoothstep(height + jagged * 5, 19 + row * 3, 26 + row * 3));
          colors.push(tint.r, tint.g, tint.b);
        }
        geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
        geometry.computeVertexNormals();
        mesh(geometry, ridge, 0, 0, 0);
      }
    }
  });
  return layers;
}

function batchScenery(root = scene, useSections = true) {
  const batches = new Map();
  for (const object of root.children) {
    if (!object.isMesh || object.material.transparent) continue;
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

function play(renderer, { mascot, feet }, scenery) {
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
      for (const { strip, speed, length } of scenery) {
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
