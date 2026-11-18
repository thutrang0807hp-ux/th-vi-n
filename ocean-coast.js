import * as T from './vendor/three-r164/three.module.min.js';

const tint = hex => new T.Color(hex);
const daylight = new T.Vector3(0.95, 0.18, 0.57).normalize();

function sky() {
  const skyDome = new T.Mesh(new T.SphereGeometry(145, 44, 24), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false,
    uniforms: {
      sun: { value: daylight },
      horizon: { value: tint('#afd9ff') },
      blue: { value: tint('#2188ec') },
      seaMist: { value: tint('#4799d1') },
    },
    vertexShader: `
      varying vec3 direction;
      void main() {
        direction = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 direction;
      uniform vec3 sun, horizon, blue, seaMist;
      void main() {
        vec3 ray = normalize(direction);
        vec3 color = mix(horizon, blue, pow(smoothstep(0.0, 0.36, ray.y), 0.64));
        if (ray.y < 0.0) color = mix(seaMist, horizon, smoothstep(-0.028, 0.0, ray.y) * 0.35);
        vec3 lightRay = normalize(vec3(abs(ray.x), ray.yz));
        float angle = length(lightRay - sun);
        float sunEdge = max(0.002, fwidth(angle));
        float disk = 1.0 - smoothstep(0.018 - sunEdge, 0.018 + sunEdge, angle);
        color += vec3(0.74, 0.43, 0.22) * exp(-angle * 8.4) * 0.68;
        color = mix(color, vec3(1.0, 0.91, 0.72), disk * 0.98);
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
  }));
  skyDome.renderOrder = -1;
  return skyDome;
}

const shoreMath = `
  uniform float waveTime;
  float shore(float z) {
    return 8.6 + 1.18 * sin(z * 0.077 + 0.35) + 0.49 * sin(z * 0.19 + 1.11);
  }
  float wavePhase(float depth, float z) {
    return depth * 1.48 + waveTime * 1.12 + 0.76 * sin(z * 0.23 + depth * 0.18 + waveTime * 0.16)
      + 0.31 * sin(z * 0.57 - depth * 0.19 - waveTime * 0.12);
  }
`;

function coastalSurface(cloudDrift, waveTime) {
  const material = new T.ShaderMaterial({
    side: T.DoubleSide,
    uniforms: {
      sun: { value: daylight },
      drySand: { value: tint('#f3c899') },
      wetSand: { value: tint('#bda189') },
      lagoon: { value: tint('#36cfd5') },
      shelf: { value: tint('#08a4ce') },
      blueWater: { value: tint('#167bb5') },
      hazyWater: { value: tint('#4799d1') },
      foamTint: { value: tint('#f6fcf6') },
      cloudDrift, waveTime,
    },
    vertexShader: shoreMath + `
      varying vec3 surfPoint;
      void main() {
        vec3 p = position;
        float depth = abs(p.x) - shore(p.z);
        float swell = pow(0.5 + 0.5 * sin(wavePhase(depth, p.z)), 6.0);
        float breaks = smoothstep(0.0, 1.1, depth) * (1.0 - smoothstep(16.0, 30.0, depth));
        breaks *= 0.78 + 0.22 * sin(waveTime * 0.48 + p.z * 0.08);
        p.y = -0.48 + (1.0 - smoothstep(-5.0, -0.2, depth)) * 0.17 + swell * breaks * 0.22;
        surfPoint = (modelMatrix * vec4(p, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(surfPoint, 1.0);
      }
    `,
    fragmentShader: shoreMath + `
      varying vec3 surfPoint;
      uniform vec3 sun, drySand, wetSand, lagoon, shelf, blueWater, hazyWater, foamTint;
      uniform float cloudDrift;

      float cloudShadow(vec2 point, vec3 caster, vec2 size) {
        vec2 projected = caster.xz - sun.xz * ((caster.y + 0.48) / sun.y);
        projected.y += cloudDrift;
        vec2 offset = (point - projected) / size;
        float shape = dot(offset, offset);
        return (1.0 - smoothstep(0.18, 1.55, shape)) * 0.33;
      }

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
          mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
      }
      float cells(vec2 p) {
        vec2 cell = floor(p), f = fract(p);
        float first = 8.0, second = 8.0;
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y));
            vec2 id = cell + offset;
            vec2 point = offset + vec2(hash(id), hash(id + 21.3)) - f;
            float d = dot(point, point);
            second = min(second, max(first, d));
            first = min(first, d);
          }
        }
        return second - first;
      }
      void main() {
        float z = surfPoint.z;
        float radius = abs(surfPoint.x);
        float depth = radius - shore(z);
        vec2 uv = vec2(depth, z);
        float surge = sin(waveTime * 0.94 + z * 0.11) * 0.59 + sin(waveTime * 1.41 - z * 0.09) * 0.16;
        float swash = -0.19 + 0.29 * sin(z * 0.48) + 0.14 * sin(z * 1.19 + 0.4) - surge
          + 0.16 * (noise(vec2(z * 1.3, 12.0)) - 0.5);
        float d = depth - swash;
        float grain = noise(surfPoint.xz * 4.3);
        float damp = smoothstep(-2.9, -0.31, d);
        vec3 sand = mix(drySand, wetSand, damp) * (0.93 + grain * 0.13);
        sand += vec3(0.20, 0.36, 0.50) * damp * damp * (0.09 + 0.10 * noise(uv * 0.89));
        vec3 water = mix(lagoon, shelf, smoothstep(1.4, 16.0, d));
        water = mix(water, blueWater, smoothstep(12.0, 52.0, d));
        water = mix(water, hazyWater, smoothstep(74.0, 144.5, radius) * 0.94);
        float phase = wavePhase(depth, z);
        float front = 0.5 + 0.5 * sin(phase);
        float ripple = sin(depth * 5.1 + z * 0.24 + waveTime * 1.5 + noise(uv * 0.47) * 3.4);
        float fine = 1.0 - smoothstep(24.0, 82.0, radius);
        float crest = pow(front, 10.0);
        float shoulder = 0.5 + 0.5 * sin(phase - 0.72);
        water *= 0.86 + 0.045 * shoulder + 0.17 * front * (0.48 + fine * 0.52) + ripple * fine * 0.037;
        water += vec3(0.02, 0.18, 0.17) * crest * (1.0 - smoothstep(15.0, 32.0, d));
        float clearWater = smoothstep(-0.22, 1.5, d);
        vec3 sceneColor = mix(sand, water, clearWater);
        float lace = 0.0;
        if (d < 21.0 && d > -1.0) {
          vec2 laceUV = (uv + vec2(waveTime * 0.25, 0.19 * sin(waveTime * 0.42))) * vec2(3.4, 1.92)
            + vec2(noise(uv * 1.2), noise(uv * 0.78 + 31.0));
          float edge = cells(laceUV);
          lace = 1.0 - smoothstep(0.028, 0.13 + fwidth(edge) * 0.55, edge);
          lace *= 0.22 + 0.78 * smoothstep(0.33, 0.69, noise(uv * vec2(1.26, 1.91)));
        }
        float scallops = noise(uv * vec2(1.9, 2.9)) * 0.58 + noise(uv * 6.7) * 0.42;
        float swashLine = exp(-abs(d) * 7.1);
        float breaker = smoothstep(0.88, 0.995, front + (scallops - 0.55) * 0.14);
        breaker *= smoothstep(0.7, 2.0, d) * (1.0 - smoothstep(13.0, 27.0, d));
        float residue = smoothstep(-0.78, 0.56, surge);
        float wash = lace * smoothstep(-0.65, 0.6, d) * (1.0 - smoothstep(1.8, 8.4, d)) * (0.45 + 0.55 * residue);
        wash += lace * smoothstep(0.52, 0.92, front) * smoothstep(1.0, 2.0, d)
          * (1.0 - smoothstep(13.0, 22.0, d)) * 0.52;
        float spray = breaker * smoothstep(0.17, 0.78,
          scallops + 0.10 * sin(z * 2.1 - waveTime * 1.18));
        sceneColor = mix(sceneColor, foamTint, clamp(swashLine * (0.6 + scallops * 0.3) + spray * 0.85 + wash * (0.19 + 0.22 * scallops), 0.0, 0.97));

        vec3 viewDir = normalize(surfPoint - cameraPosition);
        vec3 oceanRay = vec3(abs(viewDir.x), -viewDir.y, viewDir.z);
        float streak = exp(-pow((oceanRay.z - sun.z) / (0.084 + 0.073 * fine), 2.0));
        float glint = smoothstep(0.47, 0.88, noise(vec2(depth * 4.1 + waveTime * 1.2, z * 3.2)));
        float shadowZ = surfPoint.x >= 0.0 ? z : -z + 8.5 + cloudDrift * 2.0;
        vec2 point = vec2(radius, shadowZ);
        float shade = max(cloudShadow(point, vec3(84.0, 13.7, 35.0), vec2(11.6, 16.1)),
          cloudShadow(point, vec3(101.0, 8.1, 61.0), vec2(12.1, 13.2)));
        shade = max(shade, cloudShadow(point, vec3(87.0, 9.8, -34.0), vec2(16.0, 15.2)));
        sceneColor *= mix(vec3(1.0), vec3(0.58, 0.73, 0.88), shade);
        float shine = streak * (0.15 + 0.85 * glint) * (1.0 - shade * 0.83) * smoothstep(0.1, 4.0, d);
        shine *= 0.41 + 0.59 * (0.5 + 0.5 * sin(phase + 0.7));
        sceneColor = mix(sceneColor, vec3(1.0, 0.91, 0.72), shine * 0.73);
        gl_FragColor = vec4(sceneColor, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });

  const strips = new T.Group();
  const segments = [[4.18, 12.0, 38], [12.0, 33.0, 78], [33.0, 157.0, 35]];
  for (const side of [-1, 1]) {
    for (const [inner, outer, count] of segments) {
      const geo = new T.PlaneGeometry(outer - inner, 280, count, 90).rotateX(-Math.PI / 2);
      geo.translate(side * (outer + inner) * 0.5, 0, 0);
      strips.add(new T.Mesh(geo, material));
    }
  }
  return strips;
}

function cloudMesh(lobes) {
  const padding = 0.8;
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const lobe of lobes) {
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], lobe[axis] - lobe[axis + 3] - padding);
      max[axis] = Math.max(max[axis], lobe[axis] + lobe[axis + 3] + padding);
    }
  }
  const step = 1.03;
  const [nx, ny, nz] = max.map((v, axis) => Math.ceil((v - min[axis]) / step) + 1);
  const slice = nx * ny;
  const grid = new Float32Array(slice * nz);
  function lattice(axis, x, y, z) {
    const i = x * 12.9898 + y * 78.233 + z * 37.719 + axis * 29.147;
    const jitter = Math.sin(i) * step * 0.23;
    return min[axis] + [x, y, z][axis] * step + jitter;
  }
  for (let z = 0; z < nz; z++) {
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const px = lattice(0, x, y, z), py = lattice(1, x, y, z), pz = lattice(2, x, y, z);
        let value = -100;
        for (const [cx, cy, cz, w, h, d] of lobes) {
          if (Math.abs(px - cx) > w * 1.4 || Math.abs(py - cy) > h * 1.4 || Math.abs(pz - cz) > d * 1.4) continue;
          const field = 1 - ((px - cx) / w) ** 2 - ((py - cy) / h) ** 2 - ((pz - cz) / d) ** 2;
          const blend = Math.max(0, 0.36 - Math.abs(field - value));
          value = Math.max(value, field) + blend * blend / 1.44;
        }
        grid[x + y * nx + z * slice] = value;
      }
    }
  }

  const positions = [], normals = [];
  const corners = [[0,0,0], [1,0,0], [1,1,0], [0,1,0], [0,0,1], [1,0,1], [1,1,1], [0,1,1]];
  const tets = [[0,5,1,6], [0,1,2,6], [0,2,3,6], [0,3,7,6], [0,7,4,6], [0,4,5,6]];
  const cross = new T.Vector3();
  function gradient(x, y, z) {
    const i = x + y * nx + z * slice;
    return new T.Vector3(
      grid[i - (x > 0 ? 1 : 0)] - grid[i + (x < nx - 1 ? 1 : 0)],
      grid[i - (y > 0 ? nx : 0)] - grid[i + (y < ny - 1 ? nx : 0)],
      grid[i - (z > 0 ? slice : 0)] - grid[i + (z < nz - 1 ? slice : 0)],
    ).normalize();
  }
  function triangle(a, b, c) {
    cross.subVectors(b.point, a.point).cross(c.point.clone().sub(a.point));
    if (cross.dot(a.normal) < 0) [b, c] = [c, b];
    for (const vertex of [a, b, c]) {
      positions.push(...vertex.point.toArray());
      normals.push(...vertex.normal.toArray());
    }
  }
  for (let z = 0; z < nz - 1; z++) {
    for (let y = 0; y < ny - 1; y++) {
      for (let x = 0; x < nx - 1; x++) {
        const values = corners.map(([dx, dy, dz]) => grid[x + dx + (y + dy) * nx + (z + dz) * slice]);
        if (values.every(v => v > 0) || values.every(v => v <= 0)) continue;
        const points = corners.map(([dx, dy, dz]) =>
          new T.Vector3(lattice(0, x + dx, y + dy, z + dz), lattice(1, x + dx, y + dy, z + dz),
            lattice(2, x + dx, y + dy, z + dz)));
        const gradients = corners.map(([dx, dy, dz]) => gradient(x + dx, y + dy, z + dz));
        function edge(a, b) {
          const fraction = values[a] / (values[a] - values[b]);
          return { point: points[a].clone().lerp(points[b], fraction),
            normal: gradients[a].clone().lerp(gradients[b], fraction).normalize() };
        }
        for (const tet of tets) {
          const inside = tet.filter(i => values[i] > 0), outside = tet.filter(i => values[i] <= 0);
          if (inside.length === 1) {
            triangle(...outside.map(i => edge(inside[0], i)));
          } else if (inside.length === 3) {
            triangle(...inside.map(i => edge(i, outside[0])));
          } else if (inside.length === 2) {
            const a = edge(inside[0], outside[0]), b = edge(inside[0], outside[1]);
            const c = edge(inside[1], outside[0]), d = edge(inside[1], outside[1]);
            triangle(a, b, c);
            triangle(b, d, c);
          }
        }
      }
    }
  }
  const mesh = new T.BufferGeometry();
  mesh.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  mesh.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  return mesh;
}

function cumulus() {
  const clusterGroups = [];
  let seed = 31415926;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  // The tallest updraft is on the right; the sunset-facing left bank is lower and wider.
  const banks = [
    [84, 7.2, 37, 15, 16], [101, 5.8, 61, 11.8, 6], [87, 6.6, -34, 13.5, 10.2],
    [107, 3.8, -58, 15.2, 5], [116, 2.8, -13, 15, 4.1], [117, 3.1, 11, 13, 4.0],
    [114, 3.6, 85, 12, 5.4], [118, 3.4, -79, 15, 4.6], [63, 9, -93, 11, 6.6],
  ];
  for (const side of [1, -1]) {
    for (const [x, y, z, width, height] of banks) {
      const centerZ = side > 0 ? z : (z < -90 ? z : -z + 8.5);
      const lobes = [];
      clusterGroups.push(lobes);
      const core = [];
      const foot = Math.min(3.6, height * 0.41);
      for (const [u, rise, spread] of [[-0.72, 0.04, 0.34], [-0.31, 0.11, 0.36],
        [0.12, 0.12, 0.37], [0.52, 0.09, 0.31], [0.79, 0.02, 0.25]]) {
        core.push([side * (x + (random() - 0.5) * 4.2), y + foot * rise,
          centerZ + width * u, 4.3, foot * (0.71 + random() * 0.32), width * spread]);
      }
      const tiers = height > 10 ? 6 : 4;
      for (let row = 0; row < tiers; row++) {
        const rise = row / tiers;
        const bulge = 1 - rise * 0.61;
        const radius = Math.min(width * 0.39, Math.max(2.1, height * 0.27)) * bulge;
        const lean = (0.08 + 0.12 * Math.sin(rise * 3.8)) * width * rise;
        const py = y + height * (0.13 + rise * 0.77);
        const pz = centerZ + lean + (random() - 0.5) * radius * 0.42;
        core.push([side * (x + rise * 3.0), py, pz, radius * 1.08, radius * 0.95, radius * 1.15]);
        if (row < tiers - 1) {
          const sideShift = row % 2 ? -1 : 1;
          core.push([side * (x - 2.3), py - radius * 0.21,
            pz + radius * sideShift * 0.83, radius * 0.85, radius * 0.78, radius * 0.90]);
        }
      }
      lobes.push(...core);
      for (const [cx, cy, cz, rx, ry, rz] of core) {
        const isTower = cy > y + foot * 0.57;
        for (let i = 0; i < (isTower ? 7 : 5); i++) {
          const azimuth = random() * Math.PI * 2;
          const upward = random() * 1.50 - 0.54;
          const radial = Math.sqrt(1 - upward * upward);
          const distance = 0.66 + random() * 0.23;
          const size = 0.24 + random() * 0.29;
          lobes.push([cx + Math.cos(azimuth) * radial * rx * distance,
            cy + ry * upward * distance, cz + Math.sin(azimuth) * radial * rz * distance,
            Math.min(rx, ry * 1.36) * size, ry * size * 1.03, Math.min(rz, ry * 1.43) * size]);
        }
      }
    }
  }
  const material = new T.ShaderMaterial({
    uniforms: {
      light: { value: tint('#fff6e7') },
      shadow: { value: tint('#96b0dd') },
    },
    vertexShader: `
      varying vec3 normalDirection;
      varying vec3 cloudPoint;
      void main() {
        normalDirection = normal;
        cloudPoint = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 normalDirection, cloudPoint;
      uniform vec3 light, shadow;
      void main() {
        vec3 smoothNormal = normalize(normalDirection);
        vec3 facet = normalize(cross(dFdx(cloudPoint), dFdy(cloudPoint)));
        if (dot(facet, smoothNormal) < 0.0) facet = -facet;
        vec3 n = normalize(mix(smoothNormal, facet, 0.62));
        vec3 sunNormal = normalize(vec3(-0.54 * sign(cloudPoint.x), 0.62, 0.64));
        float grain = sin(cloudPoint.y * 2.68 + sin(cloudPoint.z * 3.41)) * sin(cloudPoint.x * 3.38 + cloudPoint.z * 1.86);
        float angle = dot(n, sunNormal) + 0.14 * n.y + grain * 0.032;
        float sunlit = smoothstep(-0.58, 0.78, angle);
        sunlit = mix(sunlit, floor(sunlit * 6.0 + 0.5) / 6.0, 0.33);
        float heightFill = smoothstep(4.0, 18.0, cloudPoint.y);
        vec3 tone = mix(shadow, light, 0.09 + sunlit * 0.82 + heightFill * 0.07);
        vec3 mist = vec3(0.54, 0.73, 0.94);
        tone = mix(tone, mist, (1.0 - heightFill) * 0.21);
        gl_FragColor = vec4(tone, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const clouds = new T.Group();
  for (const lobes of clusterGroups) clouds.add(new T.Mesh(cloudMesh(lobes), material));
  return clouds;
}

export function buildOceanCoast(scene) {
  const clouds = cumulus();
  const cloudDrift = { value: 0 };
  const waveTime = { value: 0 };
  scene.add(sky(), coastalSurface(cloudDrift, waveTime), clouds);
  return {
    layers: [],
    animateAmbient(time) {
      waveTime.value = time;
      cloudDrift.value = Math.sin(time * 0.036) * 9.5;
      clouds.position.z = cloudDrift.value;
    },
  };
}
