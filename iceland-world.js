import * as T from './vendor/three-r164/three.module.min.js';
import { mergeGeometries } from './vendor/three-r164/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const tint = hex => new T.Color(hex);
const matte = (hex, emissiveIntensity = 0.23) => new T.MeshStandardMaterial({
  color: hex, emissive: hex, emissiveIntensity, roughness: 0.87, fog: false
});

const skyFunctions = `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  vec3 ribbons(vec3 ray, float time) {
    float az = atan(ray.z, max(abs(ray.x), 0.0001));
    float e = asin(clamp(ray.y, -1.0, 1.0));
    vec3 glow = vec3(0.0);
    for (int i=0; i<3; i++) {
      float n = float(i);
      float sway = sin(az * 3.3 + n * 1.5 + time * 0.20) * 0.053
        + sin(az * 7.5 + n + time * 0.13) * 0.026;
      float base = 0.16 + n * 0.122 + az * 0.09 + sway;
      float d = e - base;
      float folds = 0.52 + 0.31 * sin(az * 36.0 + n * 6.0 + sin(az * 12.0) * 2.4 + time * 0.52)
        + 0.14 * sin(az * 83.0 - time * 0.31);
      float curtain = smoothstep(-0.017, 0.006, d) * exp(-max(d, 0.0) * (13.2 - 6.0 * folds));
      float lower = exp(-abs(d) * 67.0);
      float extent = smoothstep(-1.52, -0.72 + n * 0.12, az) * (1.0 - smoothstep(0.73 - n * 0.11, 1.46, az));
      vec3 emerald = vec3(0.013, 0.37, 0.16);
      vec3 violet = vec3(0.22, 0.015, 0.45);
      vec3 stripe = mix(emerald, violet, clamp(d * 8.1 + n * 0.26 + 0.17 * sin(az * 8.0 + n), 0.0, 1.0));
      glow += extent * (stripe * curtain * (0.15 + 0.87 * folds) + stripe * lower * 0.37);
    }
    return glow;
  }
`;
const worldVertex = `
  varying vec3 worldPoint;
  void main() {
    worldPoint = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(worldPoint, 1.0);
  }
`;

function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const object = new T.Mesh(geometry, material);
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}

function box(parent, material, x, y, z, width, height, depth) {
  return mesh(parent, new T.BoxGeometry(width, height, depth), material, x, y, z);
}

function heightfield(parent, length, rows, bands, sample, material) {
  const positions = [], colors = [], indices = [];
  for (let j = 0; j <= bands; j++) for (let i = 0; i <= rows; i++) {
    const [x, y, value] = sample(j / bands, i / rows);
    positions.push(x, y, (i / rows - 0.5) * length);
    colors.push(value.r, value.g, value.b);
    if (j === bands || i === rows) continue;
    const a = j * (rows + 1) + i, b = a + rows + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return mesh(parent, geometry, material);
}

function atmosphere(scene, clock) {
  const sky = new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, uniforms: { clock },
    vertexShader: worldVertex,
    fragmentShader: `
      uniform float clock;
      varying vec3 worldPoint;
      ${skyFunctions}
      void main() {
        vec3 ray = normalize(worldPoint - cameraPosition);
        vec3 base = mix(vec3(0.009,0.017,0.065), vec3(0.0015,0.0026,0.017), smoothstep(-0.04,0.77,ray.y));
        vec2 uv = vec2(atan(ray.z, ray.x), asin(clamp(ray.y,-1.0,1.0))) * vec2(250.0,160.0);
        vec2 cell = floor(uv);
        float id = hash(cell);
        vec2 point = vec2(hash(cell+3.7),hash(cell-8.2))*0.62+0.19;
        float stars = (1.0-smoothstep(0.027,0.115,distance(fract(uv),point)))
          * smoothstep(0.93,1.0,id) * smoothstep(0.015,0.19,ray.y);
        gl_FragColor = vec4(base + stars * vec3(0.47,0.61,0.91) + ribbons(ray,clock),1.0);
        #include <colorspace_fragment>
      }`
  });
  mesh(scene, new T.SphereGeometry(132, 36, 18), sky, 0, 2, 0).renderOrder = -10;

  const water = new T.ShaderMaterial({
    side: T.DoubleSide, uniforms: { clock }, vertexShader: worldVertex,
    fragmentShader: `
      uniform float clock;
      varying vec3 worldPoint;
      ${skyFunctions}
      void main() {
        vec3 incoming = normalize(worldPoint-cameraPosition);
        vec3 ray = vec3(incoming.x,-incoming.y,incoming.z);
        float wave = sin(worldPoint.x*2.1 + worldPoint.z*0.42 + clock*0.91);
        float chop = sin(worldPoint.x*0.94 - worldPoint.z*0.71 - clock*0.45);
        ray.z += wave*0.032 + chop*0.020;
        ray.y += 0.077 + wave*0.018;
        vec3 reflection = ribbons(normalize(ray),clock);
        float shimmer = 0.72 + wave*0.18 + chop*0.10;
        float edge = smoothstep(4.0,32.0,length(worldPoint.xz-cameraPosition.xz));
        vec3 base = mix(vec3(0.008,0.030,0.062),vec3(0.040,0.078,0.161),edge);
        gl_FragColor = vec4(base + reflection*shimmer*0.38 + wave*0.004,1.0);
        #include <colorspace_fragment>
      }`
  });
  mesh(scene, new T.PlaneGeometry(214, 260), water, 0, -0.43, 0).rotation.x = -Math.PI / 2;
}

const ridgeSurface = new T.MeshStandardMaterial({
  color: '#ffffff', vertexColors: true, flatShading: true, side: T.DoubleSide,
  roughness: 1, fog: false, emissive: '#435eae', emissiveIntensity: 0.27
});
const slate = tint('#263864'), snowy = tint('#6685c0'), rose = tint('#b080b8');
function ridges(group, length) {
  for (const side of [-1, 1]) for (let band = 0; band < 2; band++) {
    heightfield(group, length, 62, 14, (u, v) => {
      const a = TAU * v;
      const peak = 7 + band * 4 + 8 * (0.5 + Math.sin(a * (3 + band) + side * 0.51) * 0.5)
        + 4 * Math.sin(a * 7 + band) ** 2;
      const spine = Math.sin(Math.PI * u) ** 1.6;
      const y = -0.69 + spine * (peak + Math.sin(u * 17 + a * 12) * 1.7);
      const face = T.MathUtils.smoothstep(y + Math.cos(a * 19 + u * 8) * 2, 3.3, 12.4 + band * 1.4);
      const hue = slate.clone().lerp(snowy, face * 0.94).lerp(rose, band * 0.14 + 0.10 * Math.sin(a + 1) ** 2);
      return [side * (56 + band * 18 + u * 28), y, hue];
    }, ridgeSurface);
  }
}

function rng() {
  let seed = 947;
  return () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
}

const warmWindow = new T.MeshBasicMaterial({ color: '#ffbb68', fog: false, toneMapped: false });
const roof = matte('#6f82b5', 0.34);
const trim = matte('#524f6c');
const houseColors = ['#8a5269', '#8f7594', '#ae856b'].map(hex => matte(hex));
const shoreMaterial = new T.MeshStandardMaterial({
  color: '#ffffff', vertexColors: true, side: T.DoubleSide, fog: false,
  emissive: '#667bb0', emissiveIntensity: 0.19, roughness: 0.94
});

function village(group, length) {
  const bank = tint('#647398'), bankSnow = tint('#a8b8de');
  const glimmer = new T.MeshBasicMaterial({ color: '#ffad65', transparent: true, opacity: 0.64, toneMapped: false, depthWrite: false, fog: false });
  for (const side of [-1, 1]) {
    heightfield(group, length, 46, 5, (u, v) => {
      const z = v * TAU;
      return [side * (37.7 + 2.1 * Math.sin(z * 2 + side) + u * 13),
        -0.9 + Math.sin(Math.PI * u) * 1.5, bank.clone().lerp(bankSnow, u)];
    }, shoreMaterial);
    const offsets = [-39,-35,-31,-28,-24,-18,-9,-6,-2,2,5,8,12,19,30,34,37,42,45];
    for (const [i, z] of offsets.entries()) {
      const x = side * (42 + Math.sin(i * 2.17) * 1.66);
      const w = 1.44 + (i % 4) * 0.26, h = 0.89 + (i % 3) * 0.26, d = 1.15 + (i % 3) * 0.21;
      const home = new T.Group();
      home.position.set(x, 0.0, z + side * 5.2);
      home.rotation.y = -side * Math.PI / 2 + Math.sin(i) * 0.19;
      group.add(home);
      box(home, houseColors[i % houseColors.length], 0, h / 2, 0, w, h, d);
      const gable = new T.Shape();
      gable.moveTo(-w / 2, 0); gable.lineTo(w / 2, 0); gable.lineTo(0, w * 0.33); gable.closePath();
      mesh(home, new T.ExtrudeGeometry(gable, { depth: d, bevelEnabled: false }), houseColors[i % houseColors.length],
        0, h, -d / 2);
      for (const dir of [-1, 1]) {
        const r = box(home, roof, dir * w * 0.25, h + w * 0.16, 0, w * 0.68, 0.10, d + 0.16);
        r.rotation.z = -dir * 0.58;
        box(home, trim, dir * w * 0.28, h * 0.57, d / 2 + 0.019, 0.30, 0.31, 0.045);
        box(home, warmWindow, dir * w * 0.28, h * 0.57, d / 2 + 0.049, 0.24, 0.24, 0.04);
      }
      if (i === 7) {
        box(home, houseColors[1], 0, 1.44, -0.08, 0.50, 2.6, 0.50);
        mesh(home, new T.ConeGeometry(0.43, 0.93, 4), roof, 0, 3.08, -0.08).rotation.y = Math.PI / 4;
        box(home, warmWindow, 0, 2.23, 0.183, 0.19, 0.33, 0.025);
      }
      for (let j = 0; j < 8; j++) {
        const light = mesh(group, new T.PlaneGeometry(0.81 + j * 0.36, 0.12 + j * 0.07), glimmer,
          side * (37.9 - j * (0.94 + (i % 3) * 0.26)), -0.414, z + side * 5.2 + Math.sin(i + j * 2) * 0.34);
        light.rotation.x = -Math.PI / 2;
        light.renderOrder = 3;
      }
    }
  }
}

const iceTop = matte('#a2d6ec', 0.35);
const iceSide = matte('#558dbd', 0.38);
const darkRock = matte('#465375', 0.31);
const shoreSnow = matte('#a6bcec', 0.37);
const frozenGrass = matte('#b79091');
function brokenIce(parent, x, z, size, seed) {
  const chunk = new T.Group();
  chunk.name = 'iceberg';
  chunk.position.set(x, -0.405, z);
  chunk.rotation.y = seed * 4.31;
  const profile = new T.Shape();
  for (let corner = 0; corner < 8; corner++) {
    const angle = corner / 8 * TAU;
    const radius = 0.74 + Math.sin(corner * 2.3 + seed * 7.9) * 0.15;
    const xx = Math.cos(angle) * radius, zz = Math.sin(angle) * radius;
    if (corner === 0) profile.moveTo(xx, zz);
    else profile.lineTo(xx, zz);
  }
  profile.closePath();
  const geometry = new T.ExtrudeGeometry(profile, {
    depth: 0.24, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.085, bevelSegments: 1
  });
  geometry.rotateX(-Math.PI / 2);
  mesh(chunk, geometry, [iceTop, iceSide]).scale.set(size, size * 0.80, size * 1.12);
  parent.add(chunk);
}

function shoreline(group, length, random) {
  const rockShape = new T.IcosahedronGeometry(1, 1);
  const iceGroups = new T.Group();
  group.add(iceGroups);
  for (const side of [-1, 1]) {
    const stone = tint('#778ebc'), snow = tint('#bacaf2');
    heightfield(group, length, 52, 7, (u, v) => {
      const ripple = 2 + Math.sin(v * TAU * 2 + side) * 0.82 + Math.sin(v * TAU * 5) * 0.42;
      return [side * (4.17 + u * ripple), 0.02 - u * 0.77 + Math.sin(v * TAU * 3 + side) * 0.14,
        snow.clone().lerp(stone, u * 0.73)];
    }, shoreMaterial);
    for (let i = 0; i < 23; i++) {
      const z = (random() - 0.5) * length * 0.95;
      const x = side * (5.0 + random() * 1.85);
      const size = 0.34 + random() * 0.76 + (i % 6 === 0 ? 0.28 : 0);
      const rock = mesh(group, rockShape, darkRock, x, -0.22, z);
      rock.scale.set(size * 1.48, size * 0.68, size);
      rock.rotation.y = random() * TAU;
      const crust = mesh(group, rockShape, shoreSnow, x - side * size * 0.07, -0.05 + size * 0.33, z);
      crust.scale.set(size * 1.25, size * 0.29, size * 0.92);
      crust.rotation.y = rock.rotation.y;
      if (i % 4 === 0) {
        for (let j = 0; j < 4; j++) {
          const blade = box(group, frozenGrass, x + j * 0.06, 0.08, z + j * 0.07, 0.019, 0.29 + random() * 0.11, 0.022);
          blade.rotation.z = (j - 1.5) * 0.24;
        }
      }
    }
    for (let i = 0; i < 14; i++) {
      const x = side * (8 + random() * 28);
      const z = (random() - 0.5) * length * 0.96;
      brokenIce(iceGroups, x, z, 0.72 + random() * 1.81, random());
    }
  }
}

function batchStatic(template) {
  template.updateMatrixWorld(true);
  const buckets = new Map();
  const position = new T.Vector3();
  template.traverse(object => {
    if (!object.isMesh || Array.isArray(object.material) || object.parent.name === 'iceberg') return;
    object.getWorldPosition(position);
    const key = [object.material.id, object.renderOrder, Math.floor(position.z / 28),
      Boolean(object.geometry.index), Object.keys(object.geometry.attributes).sort().join()].join(':');
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(object);
  });
  for (const group of buckets.values()) {
    if (group.length < 2) continue;
    const parts = group.map(object => object.geometry.clone().applyMatrix4(object.matrixWorld));
    const geometry = mergeGeometries(parts);
    for (const part of parts) part.dispose();
    if (!geometry) continue;
    for (const object of group) object.removeFromParent();
    mesh(template, geometry, group[0].material).renderOrder = group[0].renderOrder;
  }
}

export function buildIcelandWorld(scene) {
  // Retain the cabin's existing fog and lighting settings.
  scene.background.set('#c7e5e3');
  scene.fog = new T.FogExp2('#c7e5e3', 0.0105);
  const clock = { value: 0 };
  atmosphere(scene, clock);
  const random = rng();
  const layers = [];
  const ice = [];

  function layer(length, speed, build) {
    const template = new T.Group();
    build(template, length);
    batchStatic(template);
    const strip = new T.Group();
    for (let i = -1; i <= 1; i++) {
      const copy = template.clone();
      copy.position.z = i * length;
      strip.add(copy);
      copy.traverse(object => {
        if (object.name === 'iceberg') ice.push({ object, z: object.position.z, y: object.position.y });
      });
    }
    scene.add(strip);
    layers.push({ strip, length, speed });
  }

  layer(220, 0.38, ridges);
  layer(208, 2.15, village);
  layer(168, 6.8, (group, length) => shoreline(group, length, random));

  function driftPetals(time) {
    clock.value = time;
    for (const [index, floe] of ice.entries()) {
      const phase = time * 0.65 + index * 1.31;
      floe.object.position.y = floe.y + Math.sin(phase) * 0.036;
      floe.object.position.z = floe.z + Math.sin(phase * 0.53) * 0.24;
      floe.object.rotation.z = Math.cos(phase * 0.73) * 0.014;
    }
  }
  return { layers, driftPetals };
}
