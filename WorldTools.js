import * as THREE from 'three';

export function terrainHeight(x, z) {
  const mountain = Math.max(0, (-z - 350) / 1100) * (x > 250 ? 78 : 42);
  return Math.sin(x * 0.009) * 2.2 + Math.cos(z * 0.011) * 2.6 + Math.sin((x + z) * 0.018) * 1.2 + mountain + Math.max(0, Math.sin(x * 0.002) * Math.cos(z * 0.002)) * 5;
}

export function seededRandom(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function makeMaterial(color, roughness = 0.9, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.04, ...extra });
}

export function addBox(group, x, y, z, w, h, d, color, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), opts.material || makeMaterial(color, opts.roughness ?? 0.9, { metalness: opts.metalness ?? 0.02 }));
  mesh.position.set(x, y + h / 2, z);
  if (opts.rotationY) mesh.rotation.y = opts.rotationY;
  mesh.castShadow = h < 12 ? false : true;
  mesh.receiveShadow = true;
  if (opts.name) mesh.name = opts.name;
  group.add(mesh);
  return mesh;
}

export function addCylinder(group, x, y, z, radiusTop, radiusBottom, height, color, segments = 8, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), opts.material || makeMaterial(color, opts.roughness ?? 0.88, { metalness: opts.metalness ?? 0.02 }));
  mesh.position.set(x, y + height / 2, z);
  if (opts.rotationZ) mesh.rotation.z = opts.rotationZ;
  group.add(mesh);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function addPumpkin(group, x, y, z, scale = 1) {
  const pumpkin = new THREE.Group();
  pumpkin.position.set(x, y, z);
  pumpkin.scale.setScalar(scale);
  const orange = makeMaterial(0xe76f21, 0.88);
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.72, 9, 7), orange);
  center.scale.set(1.0, 0.74, 0.9); center.castShadow = true; pumpkin.add(center);
  for (let i = 0; i < 7; i++) {
    const a = i * Math.PI * 2 / 7;
    const rib = new THREE.Mesh(new THREE.SphereGeometry(0.3, 7, 6), orange);
    rib.position.set(Math.cos(a) * 0.48, 0, Math.sin(a) * 0.43); rib.scale.set(0.66, 0.9, 0.72); pumpkin.add(rib);
  }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.25, 5), makeMaterial(0x39532e)); stem.position.y = 0.58; stem.rotation.z = -0.18; pumpkin.add(stem);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffc65d })); glow.position.set(0, 0.03, 0.55); pumpkin.add(glow);
  group.add(pumpkin); return pumpkin;
}

export function addTree(group, x, z, height = 9, type = 'forest', rnd = Math.random) {
  const tree = new THREE.Group(); tree.position.set(x, terrainHeight(x, z), z);
  const trunkH = height * 0.38;
  addCylinder(tree, 0, 0, 0, height * 0.055, height * 0.075, trunkH, type === 'snow' ? 0x6b655c : 0x59402c, 6);
  if (type === 'snow') {
    addCylinder(tree, 0, trunkH * 0.7, 0, height * 0.35, 0, height * 0.62, 0xb5d4e8, 7);
    addCylinder(tree, 0, trunkH + height * 0.22, 0, height * 0.26, 0, height * 0.5, 0xe4f2fa, 7);
  } else if (type === 'dead') {
    addCylinder(tree, 0, trunkH * 0.35, 0, height * 0.3, height * 0.02, height * 0.85, 0x3a302d, 6, { rotationZ: 0.15 });
    for (let i=0;i<3;i++) addCylinder(tree, (i-1)*height*.13, trunkH+height*.18, 0, height*.13, 0, height*.35, 0x493532, 5, { rotationZ:(i-1)*-.24 });
  } else {
    const colors = type === 'autumn' ? [0x8d4b2f,0xb05e27,0x6b6334] : type === 'desert' ? [0x657347,0x8b8f4a] : [0x204d3a,0x286246,0x37724a];
    const c1 = colors[Math.floor(rnd()*colors.length)];
    const cone = new THREE.Mesh(new THREE.ConeGeometry(height*0.38, height*0.72, 7), makeMaterial(c1)); cone.position.y = trunkH+height*0.29; cone.castShadow = true; tree.add(cone);
    if (type === 'autumn') { const tip = new THREE.Mesh(new THREE.ConeGeometry(height*.24,height*.5,7),makeMaterial(colors[Math.floor(rnd()*colors.length)])); tip.position.y=trunkH+height*.62; tree.add(tip); }
  }
  group.add(tree); return tree;
}

export function addVine(group, x, y, z, height = 12, wall = 'z') {
  const pts = [];
  const steps = 28;
  for (let i=0;i<=steps;i++) {
    const t=i/steps, sway=Math.sin(t*15)*0.38 + Math.cos(t*7)*0.22;
    pts.push(wall==='z' ? new THREE.Vector3(x+sway, y+t*height, z) : new THREE.Vector3(x, y+t*height, z+sway));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.09, 4, false), makeMaterial(0x243f2a)); group.add(tube);
  const rnd = seededRandom(Math.round(x*13+z*5+height));
  for (let i=0;i<5;i++) {
    const t = (i+0.5)/5, p=curve.getPoint(t);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2,5,4),makeMaterial(i%2?0x385d35:0x4d7137)); leaf.scale.set(1.5,.45,.7); leaf.position.copy(p); leaf.rotation.z=rnd()*.8-.4; group.add(leaf);
  }
  return tube;
}

export function addLabel(scene, text, x, y, z, color = '#f6f2e7') {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 112;
  const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,512,112); ctx.font = '800 44px system-ui, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='rgba(5,10,16,.78)'; ctx.fillRect(18,12,476,88); ctx.strokeStyle='rgba(255,255,255,.42)'; ctx.lineWidth=2; ctx.strokeRect(18,12,476,88); ctx.fillStyle=color; ctx.fillText(text,256,56,452);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map:texture, transparent:true, depthWrite:false })); sprite.position.set(x,y,z); sprite.scale.set(Math.max(22,text.length*2.6),7,1); scene.add(sprite); return sprite;
}

export function buildDistrict(scene, poi, profile = {}) {
  const rnd = seededRandom((poi.x*311 + poi.z*71 + poi.name.length*977)|0);
  const group = new THREE.Group(); group.name = `POI_${poi.id}`; group.position.set(poi.x, terrainHeight(poi.x, poi.z), poi.z); scene.add(group);
  const size = poi.size || 120;
  const roadColor = profile.road ?? 0x343941;
  addBox(group, 0, -0.25, 0, size*1.45, 0.4, 11, roadColor);
  addBox(group, 0, -0.22, 0, 11, 0.42, size*1.35, roadColor);
  const buildingCount = profile.count ?? 13;
  const palette = profile.palette ?? [0x56606e,0x444f5d,0x6a6b71,0x85847c];
  const grid = Math.ceil(Math.sqrt(buildingCount));
  const spacing = size * 0.34;
  for (let i=0;i<buildingCount;i++) {
    const row=Math.floor(i/grid), col=i%grid;
    let bx=(col-(grid-1)/2)*spacing + (rnd()-.5)*12;
    let bz=(row-(grid-1)/2)*spacing + (rnd()-.5)*12;
    if (Math.abs(bx)<16) bx += bx<0?-20:20;
    if (Math.abs(bz)<16) bz += bz<0?-20:20;
    const w=(profile.minWidth??12)+rnd()*(profile.maxWidth??20), d=(profile.minDepth??12)+rnd()*(profile.maxDepth??19), h=(profile.minHeight??9)+rnd()*(profile.maxHeight??32);
    const c=palette[Math.floor(rnd()*palette.length)];
    const building = new THREE.Group(); building.position.set(bx,0,bz); group.add(building);
    addBox(building,0,0,0,w,h,d,c,{roughness:.95});
    if (h > 16 && profile.roofs !== false) addBox(building,0,h,0,w*1.04,1.2,d*1.04,profile.roofColor??0x303845);
    const floors=Math.max(2,Math.floor(h/4.2));
    const winColor = profile.glow ? 0xffb46c : (profile.windowColor??0x78a6b3);
    for(let f=0;f<floors;f++) {
      const yy=2+f*3.7;
      for(let side of [-1,1]) {
        addBox(building,side*(w/2+.04),yy,0,0.12,1.45,d*.65,winColor,{roughness:.4,metalness:.1});
      }
      addBox(building,0,yy,-d/2-.04,w*.62,1.35,.11,winColor,{roughness:.4,metalness:.1});
    }
    if (profile.decor === 'industrial') {
      addCylinder(building,w*.36,h+0.5,d*.2,1.5,1.5,7,0x8d969c,8,{metalness:.5});
      addBox(building,-w*.28,h*.55,d*.55,2.2,2,d*.2,0x9b6337);
    } else if (profile.decor === 'haunted') {
      addBox(building,0,h+.6,0,w*.25,.7,d*.3,0x1b1920);
      addCylinder(building,-w*.2,h+1,-d*.2,.18,.18,3,0x231f27,5);
    }
    if (profile.vines && i%2===0) addVine(building, (rnd()-.5)*w*.55, 0, d/2+.08, Math.min(h,12), 'z');
    if (profile.crates && i%3===0) {
      addBox(building,w*.75,0,d*.7,2.5,2.5,2.5,0x705033);
      addBox(building,w*.75,2.5,d*.7,2.5,.18,2.5,0x9a744c);
    }
  }
  if (profile.tower) {
    addCylinder(group, size*.44, 0, -size*.27, 2.8, 4, size*.7, 0x535d67, 8, { metalness:.45 });
    addCylinder(group, size*.44, size*.7, -size*.27, 8, 0, 1.2, 0x6b7880, 8, { metalness:.55 });
  }
  if (profile.ship) {
    const ship=new THREE.Group(); ship.position.set(-size*.55,0,size*.65); group.add(ship);
    addBox(ship,0,0,0,14,4,38,0x2c424a); addBox(ship,0,4,-5,8,6,8,0x526872); addCylinder(ship,0,4,10,1.5,1.5,13,0x89949a,7,{rotationZ:Math.PI/2,metalness:.55});
  }
  if (profile.farm) {
    for(let i=0;i<8;i++) addBox(group,-size*.55+i*size*.15,-.1,size*.52,5,.45,30,0xb99751);
    addCylinder(group,size*.5,0,-size*.45,3,2,17,0x79563b,8);
    for(let i=0;i<4;i++) addBox(group,size*.5,10,-size*.45,14,.8,1.2,0xb5a58b,{rotationY:i*Math.PI/2});
  }
  if (profile.crystals) {
    for(let i=0;i<12;i++) {const x=(rnd()-.5)*size*1.1,z=(rnd()-.5)*size*1.1; const m=new THREE.Mesh(new THREE.OctahedronGeometry(2+rnd()*4,0),makeMaterial(i%2?0xcfeaff:0x8cc6ec,.45,{metalness:.2}));m.position.set(x,terrainHeight(poi.x+x,poi.z+z)-group.position.y,z);group.add(m);}
  }
  if(profile.palms) {
    for(let i=0;i<8;i++){let tx=(rnd()-.5)*size*1.4,tz=(rnd()-.5)*size*1.3;addCylinder(group,tx,0,tz,.45,.7,8,0x8c6c45,6);for(let j=0;j<5;j++){let a=j*Math.PI*2/5;const leaf=addBox(group,tx+Math.cos(a)*2.7,7,tz+Math.sin(a)*2.7,5,.25,1.2,0x326d50,{rotationY:-a});leaf.rotation.z=-.32;}}
  }
  addLabel(scene, poi.name.toUpperCase(), poi.x, terrainHeight(poi.x,poi.z)+Math.max(42,size*.55), poi.z, profile.labelColor||'#f5f1e9');
  return group;
}
