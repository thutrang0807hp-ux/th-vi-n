import * as T from './vendor/three-r164/three.module.min.js';

const span = 128;
const tau = Math.PI * 2;
const waterline = -0.52;
const villageBank = 58.4;

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
    float fold = sin(a*4.8+t)*0.072 + sin(a*9.1-t*0.38)*0.029 + sin(a*17.0+t*0.42)*0.012;
    float h = ray.y - height - fold - a*0.048;
    float strands = noise(vec2(a*42.0+t*0.40,0.75))*0.58
      + noise(vec2(a*112.0+t*0.64,3.1))*0.25;
    float layer = exp(-pow((h-0.011)/width,2.0))*0.39
      + smoothstep(-0.015,0.014,h)*exp(-max(h,0.0)/(width*2.2))*0.73;
    float rim = exp(-pow(h/(width*0.37),2.0))*0.34;
    float envelope = 0.47 + 0.53*smoothstep(0.22,0.88,noise(vec2(a*2.6+7.0,t*0.25)));
    return mix(low,high,smoothstep(0.012,width*2.2,h))*(layer+rim)*(0.35+strands)*envelope;
  }
  vec3 ribbons(vec3 ray) {
    return curtain(ray, 0.25, 0.248, 0.032, vec3(0.058,1.04,0.55), vec3(0.43,0.045,0.88))*1.15
      + curtain(ray,-0.94,0.153,0.020,vec3(0.21,0.50,0.72),vec3(0.48,0.066,1.02))*0.76
      + curtain(ray,1.41,0.407,0.027,vec3(0.27,0.045,0.64),vec3(0.32,0.024,0.63))*0.37;
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
        float star = (1.0-smoothstep(0.007,0.085,length(p))) * step(0.914,pick);
        vec3 glow = ribbons(r)*smoothstep(0.03,0.12,r.y);
        float behind = 1.0/(1.0+max(glow.g,glow.b)*6.8);
        color += vec3(0.29,0.33,0.54)*star*smoothstep(0.01,0.20,r.y)*behind*(0.28+0.58*pick);
        color += glow;
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
  const mesh = new T.Mesh(new T.PlaneGeometry(170, span).rotateX(-Math.PI / 2),
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
  const rand = randomSource(902 + salt);
  const vertices = [], colors = [];
  const rockPalette = [
    ['#172746', '#3e5684', '#6180a9'],
    ['#273b65', '#4c6796', '#7693be'],
    ['#374d77', '#627ca5', '#8ba2c8'],
  ][range].map(hex => new T.Color(hex));
  const snowPalette = [
    ['#9caed4', '#d5e6ff'],
    ['#a8bbdf', '#ebecff'],
    ['#9baed8', '#dee5ff'],
  ][range].map(hex => new T.Color(hex));

  function face(a, b, c, snowy, detail = 0) {
    vertices.push(...a, ...b, ...c);
    const normal = new T.Vector3(b[0]-a[0], b[1]-a[1], b[2]-a[2])
      .cross(new T.Vector3(c[0]-a[0], c[1]-a[1], c[2]-a[2])).normalize();
    if (normal.y < 0) normal.negate();
    const light = T.MathUtils.clamp(.48 + normal.y*.43 - normal.x*side*.17 + normal.z*.22, 0, 1);
    const shade = snowy
      ? snowPalette[0].clone().lerp(snowPalette[1], Math.min(1, light*.94 + detail*.32))
      : rockPalette[0].clone().lerp(rockPalette[1], light)
        .lerp(rockPalette[2], detail*.43);
    shade.multiplyScalar(.87 + rand()*.21);
    for (let i=0;i<3;i++) colors.push(shade.r,shade.g,shade.b);
  }

  function peak(x, z, height, width, depth) {
    const slices = 9 + Math.floor(rand()*3);
    const rings = [[],[],[]];
    const tilt = (rand()-.5)*.64;
    const angleOffset = rand()*tau;
    for (let i=0;i<slices;i++) {
      const angle = angleOffset + i*tau/slices + (rand()-.5)*.24;
      const dx = Math.cos(angle)*depth*(.82+rand()*.27);
      const dz = Math.sin(angle)*width*(.78+rand()*.31);
      const shoulder = .36+rand()*.17;
      const snowline = .53+rand()*.26;
      rings[0].push([x+dx,-.49,z+dz]);
      rings[1].push([x+dx*(.70+rand()*.12),height*shoulder-.45,z+dz*.73+width*tilt*.25]);
      rings[2].push([x+dx*(.33+rand()*.16),height*snowline-.45,z+dz*.39+width*tilt*.59]);
    }
    const tip = [x+depth*(rand()-.5)*.26,height-.45,z+width*tilt];
    for(let i=0;i<slices;i++){
      const n=(i+1)%slices;
      for(let row=0;row<2;row++){
        face(rings[row][i],rings[row][n],rings[row+1][i],false,row*.9);
        face(rings[row+1][i],rings[row][n],rings[row+1][n],false,row+.1);
      }
      face(rings[2][i],rings[2][n],tip,true,1);
    }
  }

  const distance = [77, 100, 124][range];
  const heights = [[3.4,7.3],[7.2,13.3],[10.2,17.9]][range];
  const entries = [3,4,3][range];
  for(let i=0;i<entries;i++){
    const z = -span/2 + (i+.5)*span/entries + (rand()-.5)*8;
    const x = side*(distance+(rand()-.5)*5.8);
    const height = T.MathUtils.lerp(heights[0],heights[1],rand());
    peak(x,z,height,14+rand()*6.8,9+rand()*5);
    if(i === 1 || (range === 0 && i === 3)) {
      peak(x-side*(3+rand()*2),z+(rand()<.5?-1:1)*(5+rand()*4),
        height*(.45+rand()*.19),5.5+rand()*4.0,6.0+rand()*3.0);
    }
  }
  return new T.Mesh(facets(vertices,colors),colored);
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
    const bank = far ? villageBank + wave : 6.75 + wave * 0.70;
    rows.push([[side*(far ? villageBank + 7.0 : 4.12),0.10,z],
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
      const scale = rock ? .25 + rand()**2*1.04 : .39 + rand()**2*1.96;
      pose.position.set(side*(rock ? 5.3 + rand()*1.0 : 9.9 + rand()*44),
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
    pose.position.set(side*(5.73 + rand()*.63),0.02,-63+rand()*126);
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
        gl_FragColor=vec4(.93,.32,.085,pow(max(trail,0.0),1.55)*broken*.66);
        #include <colorspace_fragment>
      }
    `,
  });
  const houseCount = 21;
  const basic = new T.MeshBasicMaterial({color:'#ffffff',side:T.DoubleSide,fog:false});
  const houses = new T.InstancedMesh(walls,basic,houseCount);
  const roofs = new T.InstancedMesh(roof,basic,houseCount);
  const logs = new T.InstancedMesh(new T.CylinderGeometry(.5,.5,1,6,1).rotateX(Math.PI/2),
    basic,houseCount*7);
  const trim = new T.InstancedMesh(walls,basic,houseCount*5);
  const windows = new T.InstancedMesh(lampGeometry,basic,houseCount*4);
  const reflections = new T.InstancedMesh(new T.PlaneGeometry(1,1).rotateX(-Math.PI/2),watercolor,houseCount);
  const pose = new T.Object3D();
  function stamp(mesh,index,x,y,z,sx,sy,sz,color) {
    pose.position.set(x,y,z); pose.rotation.set(0,0,0); pose.scale.set(sx,sy,sz);
    pose.updateMatrix(); mesh.setMatrixAt(index,pose.matrix);
    if(color) mesh.setColorAt(index,new T.Color(color));
  }
  const clusters = [-53,-36,-7,14,36,52];
  const roofColors = ['#8e514c','#785657','#3f647b','#586955','#655775'];
  for(let i=0;i<houseCount;i++){
    const z = clusters[i%clusters.length]+(rand()-.5)*8.8;
    const x = side*(villageBank+1.25+rand()*2.25);
    const h=.69+rand()*.43, w=.94+rand()*.80, d=.70+rand()*.45;
    const front = x-side*(d*.5+.07);
    stamp(houses,i,x,h*.5+.035,z,d,h,w,'#6d4b43');
    for(let row=0;row<7;row++){
      stamp(logs,i*7+row,x-side*d*.51,h*(row+.53)/7+.035,z,.118,h*.158,w*1.065,
        row%3===1?'#8b6351':'#765142');
    }
    stamp(roofs,i,x,h+.040,z,d*1.26,h*.67,w*1.17,roofColors[i%roofColors.length]);
    stamp(trim,i*5,x+side*d*.22,h*1.51,z+w*.13,d*.16,h*.45,w*.13,'#453b46');
    stamp(trim,i*5+1,front,h*.28,z-w*.255,.075,h*.50,w*.22,'#563832');
    stamp(trim,i*5+2,front-side*.04,.036,z-w*.255,.16,.071,w*.30,'#6b534c');
    stamp(trim,i*5+3,x,.032,z,d*1.06,.070,w*1.045,'#486081');
    stamp(trim,i*5+4,front,h*.595,z+w*.195,.042,h*.30,w*.31,'#4b3739');
    for(let j=0;j<4;j++){
      stamp(windows,i*4+j,front-side*.024,h*(.534+Math.floor(j/2)*.123),
        z+w*(.132+(j%2)*.127),1,h*.094,w*.101,j%2?'#ffc06e':'#ffe2a0');
    }
    stamp(reflections,i,side*(villageBank-3.1+rand()*1.2),waterline+.009,z+w*.19,3.2+rand()*1.9,1,.57+rand()*.46);
  }
  group.add(houses,roofs,logs,trim,windows,reflections);
  return group;
}

function lightSnow(time) {
  const rand = randomSource(8156);
  const points = [], phases = [];
  for (const side of [-1,1]) for (let i=0;i<210;i++) {
    const depth = 4.75 + (rand()**1.45)*23;
    points.push(side*depth,rand()*8 - .35,(rand()-.5)*54);
    phases.push(rand());
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
  geometry.setAttribute('phase',new T.Float32BufferAttribute(phases,1));
  const snow = new T.Points(geometry,new T.ShaderMaterial({
    transparent:true, depthWrite:false, uniforms:{time},
    vertexShader:`
      uniform float time;
      attribute float phase;
      varying float alpha;
      void main(){
        vec3 p=position;
        float cycle=mod(p.y+0.35-time*(0.29+phase*0.21),8.0);
        p.y=cycle-0.35;
        p.x+=sin(time*0.45+phase*14.0)*0.23;
        p.z+=sin(time*0.22+phase*21.0)*0.46;
        vec4 view=modelViewMatrix*vec4(p,1.0);
        gl_Position=projectionMatrix*view;
        gl_PointSize=clamp((21.0+phase*11.7)/max(1.0,-view.z),0.95,2.65);
        alpha=(0.28+phase*.37)*smoothstep(0.03,.7,cycle)*
          (1.0-smoothstep(7.2,8.0,cycle))*(1.0-smoothstep(25.0,43.0,-view.z));
      }
    `,
    fragmentShader:`
      varying float alpha;
      void main(){
        float shape=1.0-smoothstep(.12,.49,length(gl_PointCoord-.5));
        gl_FragColor=vec4(.64,.77,.96,alpha*shape);
        #include <colorspace_fragment>
      }
    `,
  }));
  snow.frustumCulled=false;
  return snow;
}

export function buildIcelandAurora(scene) {
  const time = {value:0};
  const dome = sky(time);
  const snow = lightSnow(time);
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
  scene.add(dome,terrain,snow);
  let seconds = 0;
  let lastFrame = null;
  return {
    layers: [], trainSpeed: 6.9, sceneryFrameLimit: .16,
    animateAmbient(_simulationTime,trainZ) {
      const now = performance.now();
      if (lastFrame !== null) seconds += Math.min((now-lastFrame)/1000,0.9);
      lastFrame = now;
      time.value=seconds;
      dome.position.z=trainZ;
      snow.position.z=trainZ;
      terrain.position.z=Math.floor(trainZ/span)*span;
      for(const {mesh,phase} of floating){
        if (mesh.name === 'IceDrift') {
          mesh.position.x=Math.sin(seconds*.12+phase+0.42)*.83;
          mesh.position.z=Math.sin(seconds*.15+phase+0.75)*1.37;
        } else {
          mesh.position.y=Math.sin(seconds*.67+phase)*.028;
        }
      }
    },
  };
}
