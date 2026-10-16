import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';
import { terrainHeight, seededRandom, makeMaterial, addTree, addPumpkin, addBox, addCylinder, addVine } from './WorldTools.js';
import { createNoxhaven } from './Ort_Noxhaven.js';
import { createNexora } from './Ort_Nexora.js';
import { createKravent } from './Ort_Kravent.js';
import { createDravikPort } from './Ort_DravikPort.js';
import { createCryndor } from './Ort_Cryndor.js';
import { createAvelorn } from './Ort_Avelorn.js';
import { createZarkora } from './Ort_Zarkora.js';
import { createMyrvessa } from './Ort_Myrvessa.js';
import { createMarivex } from './Ort_Marivex.js';
import { createSidePOI } from './Ort_Nebenorte.js';

export function biomeAt(x,z) {
  if (z < -350 && x > 280) return 'snow';
  if (x > 430 && z > 300) return 'desert';
  if (x > 480 && z > -420 && z < 300) return 'industry';
  if (x < -390 && z < 180) return 'forest';
  if (x < -390 && z > 180) return 'fields';
  if (Math.abs(x) < 370 && z < 100) return 'city';
  if (z > 800 || (x < -420 && z < -650)) return 'coast';
  return 'plains';
}

function biomeColor(biome) {
  switch (biome) {
    case 'snow': return new THREE.Color(0xa6bdc7);
    case 'desert': return new THREE.Color(0xb68a54);
    case 'industry': return new THREE.Color(0x74715f);
    case 'forest': return new THREE.Color(0x294a36);
    case 'fields': return new THREE.Color(0x8c8950);
    case 'city': return new THREE.Color(0x5b655f);
    case 'coast': return new THREE.Color(0x8d9f88);
    default: return new THREE.Color(0x587b4a);
  }
}

function createTerrain(scene) {
  const segments = GAME_CONFIG.terrainSegments, half = GAME_CONFIG.mapSize / 2, step = GAME_CONFIG.mapSize / segments;
  const positions = [], colors = [], indices = [];
  const rows = segments + 1;
  for (let iz=0; iz<=segments; iz++) {
    const z = -half + iz*step;
    for (let ix=0; ix<=segments; ix++) {
      const x = -half + ix*step;
      const r = Math.sqrt((x/1450)**2 + (z/1420)**2);
      const a = Math.atan2(z,x);
      const rough = 1 + Math.sin(a*6.5)*.035 + Math.cos(a*10.5)*.025 + Math.sin(a*17)*.012;
      const inside = r < rough;
      const y = terrainHeight(x,z) + (inside ? 0 : -5);
      positions.push(x,y,z);
      const c = biomeColor(biomeAt(x,z));
      const shade = .9 + .08*Math.sin(x*.033+z*.025);
      c.multiplyScalar(shade);
      colors.push(c.r,c.g,c.b);
    }
  }
  for (let iz=0; iz<segments; iz++) for (let ix=0; ix<segments; ix++) {
    const a=iz*rows+ix,b=a+1,c=a+rows,d=c+1;
    const cx=(-half+(ix+.5)*step), cz=(-half+(iz+.5)*step);
    const r=Math.sqrt((cx/1450)**2+(cz/1420)**2), ang=Math.atan2(cz,cx), rough=1+Math.sin(ang*6.5)*.035+Math.cos(ang*10.5)*.025+Math.sin(ang*17)*.012;
    if(r<rough){indices.push(a,c,b,b,c,d);}
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3)); geo.setIndex(indices); geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color:0xffffff, vertexColors:true, roughness:1, metalness:0, side:THREE.DoubleSide });
  const terrain = new THREE.Mesh(geo,mat); terrain.name='Island_Terrain'; terrain.receiveShadow=true; scene.add(terrain);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(7000,7000), new THREE.MeshStandardMaterial({color:0x102c43,roughness:.28,metalness:.2,transparent:false})); water.rotation.x=-Math.PI/2; water.position.y=-9; water.name='Ocean'; scene.add(water);
  // Remote texture URL: visible when it loads; vertex-colored ground is the fallback.
  const texLoader = new THREE.TextureLoader();
  texLoader.load(GAME_CONFIG.externalTextures.grass, texture => {
    texture.colorSpace=THREE.SRGBColorSpace; texture.wrapS=texture.wrapT=THREE.RepeatWrapping; texture.repeat.set(45,45); mat.map=texture; mat.needsUpdate=true;
  }, undefined, () => console.info('Externe Grastextur nicht erreichbar – nutze integrierte Biome-Farben.'));
  return terrain;
}

function createMountainRidges(scene) {
  const rockMat = makeMaterial(0x5b6874,1), snowMat=makeMaterial(0xc7dce3,.9);
  for(let i=0;i<17;i++){
    const x=450+i*40,z=-980-(i%4)*55,h=75+(i%5)*17;
    const ridge = new THREE.Mesh(new THREE.ConeGeometry(35+(i%4)*8,h,6), (i%3===0?snowMat:rockMat)); ridge.position.set(x,terrainHeight(x,z)+h/2-2,z); ridge.rotation.z=(i%4-1.5)*.13; ridge.castShadow=true; scene.add(ridge);
  }
  const dunes=makeMaterial(0xc69b63,.99);
  for(let i=0;i<10;i++){const x=450+i*58,z=610+(i%3)*48;const dune=new THREE.Mesh(new THREE.SphereGeometry(55,8,5),dunes);dune.scale.set(1,.22,.63);dune.position.set(x,terrainHeight(x,z)-1,z);scene.add(dune);}
}

function createRoadNetwork(scene) {
  const roadMat = makeMaterial(0x34383b,.98);
  const lines = [
    [0, 80, 24, 1770, 0], [-350,260,18,1280,.26], [260,-170,17,1080,-.3],
    [-510,-790,22,660,-.65], [620,-210,20,660,.22], [-720,490,18,520,-.18], [700,670,20,600,.35]
  ];
  for(const [x,z,w,l,rot] of lines){const m=new THREE.Mesh(new THREE.BoxGeometry(w,.26,l),roadMat);m.position.set(x,terrainHeight(x,z)+.18,z);m.rotation.y=rot;m.receiveShadow=true;scene.add(m);}
  const lineMat=makeMaterial(0xd1b66c,.8);
  for(const [x,z,w,l,rot] of lines){for(let t=-l/2+10;t<l/2;t+=36){const dash=new THREE.Mesh(new THREE.BoxGeometry(.42,.28,13),lineMat);dash.position.set(x+Math.sin(rot)*t,terrainHeight(x,z)+.36,z+Math.cos(rot)*t);dash.rotation.y=rot;scene.add(dash);}}
}

function createHalloweenScenery(scene) {
  const rnd=seededRandom(88025), nature=new THREE.Group(); nature.name='Halloween_Foliage'; scene.add(nature);
  for(let i=0;i<310;i++){
    const x=(rnd()-.5)*2770,z=(rnd()-.5)*2700;
    const r=Math.sqrt((x/1450)**2+(z/1420)**2); if(r>.96) continue;
    const b=biomeAt(x,z); if(['city','industry'].includes(b) && rnd()<.83) continue;
    if(['forest','fields','plains','snow'].includes(b)) addTree(nature,x,z,b==='snow'?10+rnd()*12:7+rnd()*15,b==='snow'?'snow':(b==='fields'?'autumn':'forest'),rnd);
    else if(b==='desert'){
      const ht=2+rnd()*6; addCylinder(nature,x,terrainHeight(x,z),z,.42,.7,ht,0x527346,5);
      if(i%4===0){addCylinder(nature,x+1,terrainHeight(x,z)+ht*.35,z,.24,.28,3,0x527346,5,{rotationZ:Math.PI/2});}
    }
  }
  // Pumpkin trail across roads and the POIs; every pumpkin is a small 3-D model.
  for(let i=0;i<150;i++){
    const x=(rnd()-.5)*2450,z=(rnd()-.5)*2350; if(Math.sqrt((x/1450)**2+(z/1420)**2)>.91) continue;
    const b=biomeAt(x,z); if(b==='snow' && i%3!==0) continue;
    addPumpkin(nature,x,terrainHeight(x,z)+.22,z,.42+rnd()*.53);
  }
  // Tall grave-vines/rankens around the haunted areas; these are deliberately lightweight.
  for(const p of GAME_CONFIG.pois){
    const count=p.id==='Noxhaven'?34:10;
    for(let i=0;i<count;i++){
      const a=rnd()*Math.PI*2, radius=(p.size||120)*(.35+rnd()*.72), x=p.x+Math.cos(a)*radius,z=p.z+Math.sin(a)*radius;
      const h=4+rnd()*8; addVine(nature,x,terrainHeight(x,z),z,h,rnd()<.5?'x':'z');
    }
  }
  // Halloween landmark objects around the island.
  for(let i=0;i<11;i++){
    const x=-1200+i*220,z=900+Math.sin(i*1.2)*45;
    addBox(nature,x,terrainHeight(x,z),z,1.2,5.5,1.2,0x514a4d);
    addPumpkin(nature,x,terrainHeight(x,z)+5.4,z,.9);
  }
}

export function createWorld(scene) {
  scene.background = new THREE.Color(0x08111f);
  scene.fog = new THREE.FogExp2(0x08111f,0.00047);
  createTerrain(scene);
  createRoadNetwork(scene);
  createMountainRidges(scene);
  const factories = {
    Noxhaven:createNoxhaven,Nexora:createNexora,Kravent:createKravent,DravikPort:createDravikPort,
    Cryndor:createCryndor,Avelorn:createAvelorn,Zarkora:createZarkora,Myrvessa:createMyrvessa,Marivex:createMarivex
  };
  const districts=[];
  for(const poi of GAME_CONFIG.pois){
    const builder=factories[poi.id]||createSidePOI;
    const group=builder(scene,poi); districts.push({ ...poi, group });
  }
  createHalloweenScenery(scene);
  // Moon and stars establish permanent Halloween-night lighting.
  const moonMat=new THREE.MeshBasicMaterial({color:0xe5edfa});
  const moon=new THREE.Mesh(new THREE.SphereGeometry(57,20,16),moonMat); moon.position.set(-950,760,-1080); scene.add(moon);
  const moonGlow=new THREE.PointLight(0x8eb8ff,900,2500,2); moonGlow.position.copy(moon.position); scene.add(moonGlow);
  const halo=new THREE.Mesh(new THREE.SphereGeometry(70,14,12),new THREE.MeshBasicMaterial({color:0x7e9ec8,transparent:true,opacity:.08,side:THREE.BackSide})); halo.position.copy(moon.position);scene.add(halo);
  const stars=new THREE.Group(); scene.add(stars);
  const starRnd=seededRandom(43);
  for(let i=0;i<180;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(.8+starRnd()*1.2,4,3),new THREE.MeshBasicMaterial({color:0xaec9ed}));s.position.set((starRnd()-.5)*4600,500+starRnd()*1300,(starRnd()-.5)*4600);stars.add(s);}
  // Sparse Halloween grave markers around Noxhaven.
  const graves=new THREE.Group(); graves.position.set(-330,terrainHeight(-330,250),250); scene.add(graves);
  const graveMat=makeMaterial(0x62636a,.95); const crossMat=makeMaterial(0x8a8587,.9);
  const rr=seededRandom(92); for(let i=0;i<19;i++){const x=(rr()-.5)*115,z=(rr()-.5)*115;addBox(graves,x,0,z,1.5,3.5,1.1,0x4a4549);addBox(graves,x,2.1,z,3.6,.7,1.1,0x4a4549);}
  return { districts, terrain: scene.getObjectByName('Island_Terrain'), biomeAt, terrainHeight };
}
