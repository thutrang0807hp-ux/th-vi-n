import * as T from './vendor/three-r164/three.module.min.js';

const span = 128;
const tau = Math.PI * 2;
const waterline = -0.52;

function randomSource(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const auroraShader = `
  uniform float time;
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), w = fract(p);
    w = w*w*(3.0-2.0*w);
    return mix(mix(hash(i),hash(i+vec2(1,0)),w.x),
      mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),w.x),w.y);
  }
  vec3 curtain(vec3 ray, float offset, float height, float width, vec3 low, vec3 high) {
    float a = atan(ray.z, abs(ray.x)) + offset;
    float t = time * 0.026;
    float fold = sin(a*4.8+t)*0.064 + sin(a*9.1-t*0.38)*0.022 + sin(a*17.0+t*0.42)*0.009;
    float h = ray.y - height - fold - a*0.048;
    float strands = noise(vec2(a*41.0+t*0.40,0.75))*0.52
      + noise(vec2(a*112.0+t*0.64,3.1))*0.16;
    float layer = exp(-pow((h-0.011)/width,2.0))*0.39
      + smoothstep(-0.015,0.014,h)*exp(-max(h,0.0)/(width*2.2))*0.73;
    float rim = exp(-pow(h/(width*0.37),2.0))*0.34;
    float envelope = 0.47 + 0.53*smoothstep(0.22,0.88,noise(vec2(a*2.6+7.0,t*0.25)));
    return mix(low,high,smoothstep(0.012,width*2.2,h))*(layer+rim)*(0.35+strands)*envelope;
  }
  vec3 ribbons(vec3 ray) {
    return curtain(ray, 0.25, 0.238, 0.030, vec3(0.05,0.76,0.45), vec3(0.38,0.032,0.78))
      + curtain(ray,-0.94,0.154,0.016,vec3(0.22,0.22,0.62),vec3(0.41,0.032,0.76))*0.69;
  }
`;

function sky(time) {
  const material = new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, uniforms: { time },
    vertexShader: `
      varying vec3 ray;
      void main() {
        ray = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: auroraShader + `
      varying vec3 ray;
      void main() {
        vec3 r = normalize(ray);
        vec3 color = mix(vec3(0.050,0.084,0.191), vec3(0.008,0.008,0.042),
          smoothstep(-0.03,0.52,r.y));
        color += vec3(0.033,0.016,0.066) * exp(-abs(r.y-0.045)*9.0);
        vec2 uv = vec2(atan(r.z,r.x),asin(r.y));
        vec2 st = uv * vec2(108.0,115.0), id = floor(st);
        float pick = hash(id);
        vec2 p = fract(st) - vec2(0.25+hash(id+4.0)*0.5,0.25+hash(id+9.0)*0.5);
        float star = (1.0-smoothstep(0.016,0.106,length(p))) * step(0.928,pick);
        color += vec3(0.48,0.54,0.86)*star*smoothstep(0.01,0.20,r.y)*(0.25+0.75*pick);
        color += ribbons(r)*smoothstep(0.03,0.12,r.y);
        float drift = time * 0.009;
        vec2 cloudUv = vec2(uv.x * 6.0 + drift, r.y * 35.0);
        float wisps = noise(cloudUv) * 0.73 + noise(cloudUv * 2.03 + 7.0) * 0.27;
        float cloudBand = smoothstep(.035,.082,r.y) * (1.0-smoothstep(.13,.19,r.y));
        float cloud = smoothstep(.57,.87,wisps) * cloudBand;
        color = mix(color,vec3(.076,.087,.17),cloud*.63);
        gl_FragColor = vec4(color,1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const dome = new T.Mesh(new T.SphereGeometry(143, 40, 20), material);
  dome.renderOrder = -3;
  return dome;
}

function lake(time) {
  const mesh = new T.Mesh(new T.PlaneGeometry(145, span).rotateX(-Math.PI / 2),
    new T.ShaderMaterial({
      side: T.DoubleSide, uniforms: { time },
      vertexShader: `
        varying vec3 point;
        void main() {
          vec4 w = modelMatrix * vec4(position,1.0);
          point = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: auroraShader + `
        varying vec3 point;
        void main() {
          vec2 p = point.xz;
          vec3 ray = normalize(point - cameraPosition);
          vec2 wave = vec2(sin(p.x*3.5 + p.y*0.78 + time*0.74),
            sin(p.x*5.7 - p.y*1.4 - time*0.69));
          vec3 mirror = normalize(vec3(ray.x+wave.x*0.037, abs(ray.y)*2.1+wave.y*0.027+0.042,
            ray.z+wave.y*0.018));
          float shimmer = noise(vec2(p.x*5.8 + time*0.28,p.y*1.8))
            * noise(vec2(p.x*2.5 - time*0.27,p.y*0.42));
          float deep = smoothstep(3.0,55.0,abs(p.x));
          vec3 color = mix(vec3(0.012,0.037,0.073),vec3(0.023,0.055,0.111),deep);
          color += ribbons(mirror)*(0.22+shimmer*0.27)*(1.0-deep*0.29);
          color += vec3(0.052,0.085,0.152)*smoothstep(0.20,0.80,shimmer)*0.49;
          gl_FragColor = vec4(color,1.0);
          #include <colorspace_fragment>
        }
      `,
    }));
  mesh.position.y = waterline;
  return mesh;
}

const colored = new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide, fog: false });
function facets(vertices, colors) {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  return geometry;
}
function mountain(side, range, salt) {
  const rand = randomSource(522 + salt);
  const steps = 56;
  const rows = 5;
  const ridges = [0, 0.38, 1, 0.51, 0];
  const palette = [
    ['#182440', '#3b5585', '#9eaed5'],
    ['#253c62', '#536f9d', '#a6bee6'],
    ['#2c4064', '#5a72a2', '#b0c1e5'],
  ][range];
  const shades = palette.map(color => new T.Color(color));
  const vertices = [];
  const colors = [];
  const points = [];
  const distance = [63, 84, 111][range];
  const elevation = [8.4, 14.7, 21.6][range];
  const crest = z => {
    const a = z / span * tau;
    const profile = 0.46 + 0.22 * Math.sin(a * (range + 2) + salt)
      + 0.17 * Math.sin(a * (range + 5) + salt * 2.4);
    return elevation * (profile + 0.29 * Math.max(0, Math.sin(a * 3 - salt) ** 5));
  };
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < steps; j++) {
      const z = -span / 2 + j * span / steps + (j ? (rand() - .5) * 1.1 : 0);
      const y = crest(z) * ridges[i] * (0.83 + rand() * 0.34) - 0.43;
      row.push([side * (distance + (i - 2) * 5.5 + (rand() - .5) * 3.2), y, z]);
    }
    row.push([row[0][0], row[0][1], span / 2]);
    points.push(row);
  }
  function add(a,b,c) {
    vertices.push(...a,...b,...c);
    const height = (a[1]+b[1]+c[1])/3/elevation;
    const snow = T.MathUtils.smoothstep(height + (rand() - 0.5) * .28, .38, .69);
    const shade = shades[0].clone().lerp(shades[1], T.MathUtils.clamp(height * 1.15 + rand()*.37, 0, 1))
      .lerp(shades[2], snow).multiplyScalar(.74 + rand() * .39);
    for (let i = 0; i < 3; i++) colors.push(shade.r, shade.g, shade.b);
  }
  for (let i = 0; i < rows - 1; i++) for (let j = 0; j < steps; j++) {
    add(points[i][j],points[i+1][j],points[i][j+1]);
    add(points[i][j+1],points[i+1][j],points[i+1][j+1]);
  }
  return new T.Mesh(facets(vertices, colors), colored);
}

function shore(side, far) {
  const rand = randomSource(931 + side + Number(far)*31);
  const count = 65;
  const rows = [];
  const vertices = [];
  const colors = [];
  for (let i = 0; i < count; i++) {
    const z = -span/2 + i*span/(count-1);
    const wave = Math.cos(z/span*tau*4)*.83 + Math.sin(z/span*tau*7)*.34;
    const bank = far ? 46 + wave : 8.6 + wave;
    rows.push([[side*(far ? 52 : 4.12),0.10,z],
      [side*bank,(i === count-1 ? rows[0][1][1] : rand()*.19-.13),z],
      [side*(bank+(far ? -0.65 : 0.85)),waterline-.025,z]]);
  }
  function triangle(a,b,c,edge) {
    vertices.push(...a,...b,...c);
    const color = new T.Color(edge ? '#374f71' : (rand() > .20 ? '#9ab3dc' : '#56729d'));
    color.multiplyScalar(.76+rand()*.25);
    for(let i=0;i<3;i++) colors.push(color.r,color.g,color.b);
  }
  for(let i=0;i<count-1;i++) for(let j=0;j<2;j++) {
    triangle(rows[i][j],rows[i+1][j],rows[i][j+1],j);
    triangle(rows[i][j+1],rows[i+1][j],rows[i+1][j+1],j);
  }
  return new T.Mesh(facets(vertices,colors),colored);
}

function iceShape(seed, rock = false) {
  const rand = randomSource(seed);
  const points = 8 + seed%5;
  const rings = [[],[],[]];
  for(let i=0;i<points;i++){
    const a = tau*i/points + (rand()-.5)*.28;
    const radius = .72 + rand()*.33;
    const x = Math.cos(a)*radius, z = Math.sin(a)*radius;
    rings[0].push([x*.8,-.2,z*.83]);
    rings[1].push([x,.025+rand()*.05,z]);
    rings[2].push([x*.85,(rock?.27:.13)+rand()*(rock?.32:.07),z*.85]);
  }
  const vertices = [];
  const colors = [];
  function add(a,b,c, index) {
    vertices.push(...a,...b,...c);
    const shade = new T.Color((rock ? ['#252c43','#425776','#849bc2']
      : ['#245a88','#527fae','#a6c5e3'])[index]).multiplyScalar(.80+rand()*.27);
    for(let j=0;j<3;j++) colors.push(shade.r,shade.g,shade.b);
  }
  for(let i=0;i<points;i++){
    const n=(i+1)%points;
    for(let row=0;row<2;row++){
      add(rings[row][i],rings[row][n],rings[row+1][i],row);
      add(rings[row+1][i],rings[row][n],rings[row+1][n],row);
    }
    add(rings[2][i],rings[2][n],[0,rock?.51:.19,0],2);
  }
  return facets(vertices,colors);
}

function scatter(side, rock) {
  const group = new T.Group();
  const rand = randomSource((rock ? 125 : 259) + side*9);
  for(let shape=0;shape<4;shape++){
    const count = rock ? 17 : 10;
    const mesh = new T.InstancedMesh(iceShape(67+shape,rock), colored, count);
    const pose = new T.Object3D();
    for(let i=0;i<count;i++){
      const scale = rock ? .25 + rand()**2*1.04 : .36 + rand()**2*1.75;
      pose.position.set(side*(rock ? 6.5 + rand()*1.5 : 12 + rand()*30),
        rock ? -.06 : waterline, -63 + rand()*126);
      pose.scale.set(scale,scale*(rock ? 1 : .85),scale*(.63+rand()*.51));
      pose.rotation.y = rand()*tau;
      pose.updateMatrix();
      mesh.setMatrixAt(i,pose.matrix);
    }
    if (!rock) mesh.name = ['IceDrift', 'IceBob', 'IceStill', 'IceDrift'][shape];
    group.add(mesh);
  }
  return group;
}

function tundra(side) {
  const rand = randomSource(874 + side);
  const points = [];
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * .032;
    const height = .12 + rand() * .19;
    points.push(x - .008,0,0, x + .008,0,0, x * 2.8,height,(rand()-.5)*.09);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
  const grass = new T.InstancedMesh(geometry,
    new T.MeshBasicMaterial({color:'#a48979',side:T.DoubleSide,fog:false}),48);
  const pose = new T.Object3D();
  for (let i=0;i<grass.count;i++) {
    pose.position.set(side*(7.15 + rand()*.65),0.02,-63+rand()*126);
    pose.rotation.y=rand()*tau;
    pose.scale.setScalar(.55+rand()*.48);
    pose.updateMatrix();
    grass.setMatrixAt(i,pose.matrix);
  }
  return grass;
}

function town(side,time) {
  const rand = randomSource(28092+side*311);
  const group = new T.Group();
  const walls = new T.BoxGeometry(1,1,1);
  const roof = new T.BufferGeometry();
  const l=[-.5,0,-.5], r=[-.5,0,.5], tip=[-.5,1,0];
  const a=[.5,0,-.5], b=[.5,0,.5], ridge=[.5,1,0];
  roof.setAttribute('position', new T.Float32BufferAttribute([
    ...l,...r,...tip,...a,...ridge,...b,
    ...l,...tip,...a,...a,...tip,...ridge,...r,...b,...tip,...b,...ridge,...tip,
  ],3));
  const lampGeometry = new T.PlaneGeometry(1,1).rotateY(Math.PI/2);
  const watercolor = new T.ShaderMaterial({
    transparent: true, depthWrite: false, side: T.DoubleSide, uniforms:{time},
    vertexShader:`
      varying vec2 vUv;
      void main(){
        vUv=uv;
        gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);
      }
    `,
    fragmentShader: auroraShader + `
      varying vec2 vUv;
      void main(){
        float trail=(1.0-abs(vUv.x*2.0-1.0))*(1.0-abs(vUv.y*2.0-1.0));
        float broken=0.27+0.73*smoothstep(.22,.83,noise(vec2(vUv.y*41.0+time*.76,vUv.x*2.2)));
        gl_FragColor=vec4(.93,.32,.085,pow(max(trail,0.0),1.55)*broken*.51);
        #include <colorspace_fragment>
      }
    `,
  });
  const houseCount = 27;
  const basic = new T.MeshBasicMaterial({color:'#ffffff',side:T.DoubleSide,fog:false});
  const houses = new T.InstancedMesh(walls,basic,houseCount);
  const roofs = new T.InstancedMesh(roof,basic,houseCount);
  const windows = new T.InstancedMesh(lampGeometry,basic,houseCount*3);
  const reflections = new T.InstancedMesh(new T.PlaneGeometry(1,1).rotateX(-Math.PI/2),watercolor,houseCount);
  const pose = new T.Object3D();
  function stamp(mesh,index,x,y,z,sx,sy,sz,color) {
    pose.position.set(x,y,z); pose.rotation.set(0,0,0); pose.scale.set(sx,sy,sz);
    pose.updateMatrix(); mesh.setMatrixAt(index,pose.matrix);
    if(color) mesh.setColorAt(index,new T.Color(color));
  }
  const clusters = [-52,-34,-7,13,36,50];
  for(let i=0;i<houseCount;i++){
    const z = clusters[i%clusters.length]+(rand()-.5)*9.5;
    const x = side*(47.25+rand()*1.5);
    const h=.50+rand()*.49, w=.72+rand()*.74, d=.55+rand()*.37;
    stamp(houses,i,x,h*.5,z,d,h,w,['#763f55','#4b566e','#805875','#63506c'][i%4]);
    stamp(roofs,i,x,h+.17,z,d*1.15,.39,w*1.08,i%3?'#6f86a9':'#b2bdd9');
    for(let j=0;j<3;j++){
      stamp(windows,i*3+j,x-side*(d*.5+.006),h*.59,z+(j-1)*w*.25,1,.15+rand()*.06,.138,
        j%2?'#ffaf64':'#ffe2a0');
    }
    stamp(reflections,i,side*(42.4+rand()*2.0),waterline+.009,z,3.1+rand()*2.6,1,.57+rand()*.46);
  }
  group.add(houses,roofs,windows,reflections);
  return group;
}

export function buildIcelandAurora(scene) {
  const time = {value:0};
  const dome = sky(time);
  const terrain = new T.Group();
  const tile = new T.Group();
  const floating = [];
  tile.add(lake(time));
  for(const side of [-1,1]){
    for(let range=0;range<3;range++) tile.add(mountain(side,range,range+side*7));
    tile.add(shore(side,false),shore(side,true),scatter(side,true),tundra(side),town(side,time));
    const ice = scatter(side,false);
    ice.name = 'Băng trôi'; tile.add(ice);
  }
  for(let index=-1;index<=2;index++){
    const copy=tile.clone();
    copy.position.z=index*span;
    copy.children.filter(child=>child.name==='Băng trôi').forEach((ice,side)=>{
      ice.children.forEach((mesh,index)=>{
        if (mesh.name !== 'IceStill') floating.push({mesh,phase:side*2+index});
      });
    });
    terrain.add(copy);
  }
  scene.add(dome,terrain);
  return {
    layers: [], trainSpeed: 6.9, sceneryFrameLimit: .16,
    animateAmbient(seconds,trainZ) {
      time.value=seconds;
      dome.position.z=trainZ;
      terrain.position.z=Math.floor(trainZ/span)*span;
      for(const {mesh,phase} of floating){
        if (mesh.name === 'IceDrift') {
          mesh.position.x=Math.sin(seconds*.09+phase)*.31;
          mesh.position.z=Math.sin(seconds*.073+phase)*.58;
        } else {
          mesh.position.y=Math.sin(seconds*.58+phase)*.018;
        }
      }
    },
  };
}
