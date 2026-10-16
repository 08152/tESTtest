import * as THREE from 'three';

const mat = (color, roughness=.65, metalness=.25, extra={}) => new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
const MAT = {
  gun:mat(0x252a30,.43,.68), dark:mat(0x11161c,.5,.58), steel:mat(0x707b86,.33,.82), black:mat(0x080c11,.48,.52),
  grip:mat(0x343b40,.9,.02), bone:mat(0xe2d6b9,.82,.02), boneDark:mat(0x978b72,.88,.01), brass:mat(0xb78c48,.38,.75), wood:mat(0x6f472b,.83,.05), woodLight:mat(0xa5784d,.75,.03),
  cloth:mat(0x384351,.97,.01), glove:mat(0x1a2029,.98,.01), skin:mat(0x9b7b62,.9,.01), spectral:mat(0xc8fbff,.25,.2,{emissive:0x3c9da6,emissiveIntensity:.8}), red:mat(0xff312c,.3,.2,{emissive:0xaa0907,emissiveIntensity:1.6})
};
function box(parent,w,h,d,material,x=0,y=0,z=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cyl(parent,r1,r2,len,material,x=0,y=0,z=0,radial=8){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,len,radial),material);m.rotation.x=Math.PI/2;m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
function sphere(parent,r,material,x=0,y=0,z=0,scale=[1,1,1]){const m=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),material);m.position.set(x,y,z);m.scale.set(...scale);parent.add(m);return m;}
function rail(parent,x,y,z,len=0.65){box(parent,.045,.045,len,MAT.steel,x,y,z);for(let i=0;i<7;i++)box(parent,.05,.015,.045,MAT.dark,x,y+.025,z-len*.4+i*len*.13);}
function addGunCore(root, length=.86){
  box(root,.33,.2,length,MAT.gun,0,0,0);
  box(root,.35,.07,length*.45,MAT.dark,0,.11,-.05);
  box(root,.16,.11,.18,MAT.grip,0,-.16,.22);
  cyl(root,.055,.055,.32,MAT.steel,0,.015,-length*.63,10);
  cyl(root,.036,.036,.08,MAT.black,0,.015,-length*.81,10);
  box(root,.065,.12,.09,MAT.dark,0,.16,-.2);
  rail(root,0,.15,-.02,.58);
  // Small visible screws/rivets.
  for(const x of [-.14,.14]) for(const z of [-.28,.25]) sphere(root,.018,MAT.steel,x,.045,z,[1,1,.7]);
}

export function createWeaponModel(id, { world=false, withHands=false }={}) {
  const root=new THREE.Group(); root.name=`Model_${id}`;
  const parts={bones:[],barrels:[],belt:[],magazine:null,hatch:null,hook:null,chain:[],handLeft:null,handRight:null,ghostBlade:null};
  const size=world?.76:1;
  const bodyScale = world ? .82 : 1;
  if(['boneSMG','heavyAR','stakeRifle'].includes(id)) addGunCore(root, id==='heavyAR'?1.02:.86);
  if(id==='boneSMG'){
    // The main barrels remain metal; the small bone charms sit on top and on the magazine.
    for(let i=0;i<8;i++){
      const b=sphere(root,.075,MAT.bone,-.11+(i%2)*.06,.17,-.35+i*.09,[.6,1.45,.65]); b.rotation.z=(i%2?-.42:.42); parts.bones.push(b);
    }
    const mag=new THREE.Group(); mag.position.set(0,-.26,.05); root.add(mag); parts.magazine=mag;
    box(mag,.17,.38,.22,MAT.dark,0,-.01,0); box(mag,.19,.23,.235,MAT.grip,0,-.11,0);
    for(let i=0;i<7;i++){const b=sphere(mag,.055,MAT.bone,(i%2?-.07:.07),-.02-i*.042,.118,[.7,1.15,.7]);parts.bones.push(b);}
    box(root,.06,.09,.15,MAT.dark,-.17,-.045,.18); box(root,.055,.09,.15,MAT.dark,.17,-.045,.18);
    box(root,.09,.025,.15,MAT.steel,0,.24,-.12);
  }
  if(id==='hadesHook'){
    box(root,.16,.16,.3,MAT.dark,0,-.08,.2); cyl(root,.055,.05,.68,MAT.steel,0,.02,-.18,7);
    const point=new THREE.Group();point.position.set(0,.02,-.58);root.add(point);parts.hook=point;
    cyl(point,.03,.10,.27,MAT.steel,0,0,-.09,6); const p=sphere(point,.09,MAT.steel,0,0,-.24,[.45,.55,1.8]);p.rotation.x=.22;
    const barb1=new THREE.Mesh(new THREE.ConeGeometry(.065,.23,5),MAT.steel);barb1.position.set(.09,0,-.16);barb1.rotation.z=-Math.PI/2;point.add(barb1);
    const barb2=new THREE.Mesh(new THREE.ConeGeometry(.065,.23,5),MAT.steel);barb2.position.set(-.09,0,-.16);barb2.rotation.z=Math.PI/2;point.add(barb2);
    for(let i=0;i<14;i++){const link=sphere(root,.026,MAT.steel,(i%2?-.022:.022),.01,-.32-i*.035,[1,1,1.5]);parts.chain.push(link);}
    box(root,.22,.12,.18,MAT.grip,0,-.14,.37);
  }
  if(id==='stakeRifle'){
    // Wood-clad fantasy long-range rifle with hinged loading hatch and a five-stake bundle.
    box(root,.18,.15,.6,MAT.wood,0,.02,-.16); box(root,.2,.18,.19,MAT.woodLight,0,.025,.24);
    cyl(root,.065,.075,.65,MAT.woodLight,0,.04,-.62,8);cyl(root,.043,.05,.12,MAT.dark,0,.04,-.99,8);
    const hatch=new THREE.Group();hatch.position.set(0,.13,-.05);root.add(hatch);parts.hatch=hatch;box(hatch,.25,.045,.33,MAT.woodLight,0,.015,0);box(hatch,.06,.04,.1,MAT.steel,0,.045,.12);
    const stakeBundle=new THREE.Group();stakeBundle.position.set(0,.23,-.08);root.add(stakeBundle);parts.stakeBundle=stakeBundle;
    for(let i=0;i<5;i++){const stake=cyl(stakeBundle,.028,.038,.43,MAT.wood,((i%3)-1)*.065,((i/3)|0)*.035, -.04+(i%2)*.025,5);const tip=new THREE.Mesh(new THREE.ConeGeometry(.034,.11,5),MAT.woodLight);tip.rotation.x=Math.PI/2;tip.position.set(((i%3)-1)*.065,((i/3)|0)*.035,-.3);stakeBundle.add(tip);}
    box(root,.12,.13,.25,MAT.dark,0,-.1,.23);
  }
  if(id==='boneGatling'){
    // Five normal steel barrels. Bones only decorate the side housing; special bone shots are projectiles.
    box(root,.48,.31,.5,MAT.gun,0,0,0); box(root,.4,.18,.22,MAT.dark,0,.06,-.25);
    const ring=new THREE.Group();ring.position.set(0,.02,-.27);root.add(ring);parts.barrelRotor=ring;
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const b=cyl(ring,.047,.047,.65,MAT.steel,Math.cos(a)*.14,Math.sin(a)*.14,-.42,8);parts.barrels.push(b);}
    cyl(root,.23,.23,.13,MAT.dark,0,.02,-.74,12);
    const belt=new THREE.Group();belt.position.set(.31,.02,.1);root.add(belt);parts.beltGroup=belt;
    for(let i=0;i<12;i++){const link=new THREE.Group();link.position.set((i%6)*.045,Math.floor(i/6)*-.055,.0);belt.add(link);cyl(link,.022,.022,.14,MAT.brass,0,0,0,6);sphere(link,.018,MAT.bone,0,.032,-.035,[.7,.7,1.4]);parts.belt.push(link);}
    for(let i=0;i<7;i++){const b=sphere(root,.065,MAT.bone,-.26,.14,-.22+i*.07,[.55,1.25,.65]);b.rotation.z=.4;parts.bones.push(b);}
    box(root,.12,.22,.18,MAT.grip,0,-.22,.16);
  }
  if(id==='heavyAR'){
    const mag=new THREE.Group();mag.position.set(0,-.22,.12);root.add(mag);parts.magazine=mag;
    box(mag,.18,.36,.22,MAT.dark,0,0,0);for(let i=0;i<4;i++)box(mag,.19,.025,.225,MAT.grip,0,-.1+i*.065,0);
    // Red dot housing and lens, placed in the sight line.
    box(root,.17,.16,.21,MAT.dark,0,.22,-.21);box(root,.13,.025,.15,MAT.steel,0,.29,-.21);
    const lens=new THREE.Mesh(new THREE.CircleGeometry(.055,12),MAT.red);lens.position.set(0,.303,-.255);root.add(lens);parts.redDot=lens;
    box(root,.05,.06,.09,MAT.steel,0,.15,-.6);
  }
  if(id==='ghostBlade'){
    const handle=new THREE.Group();handle.position.set(0,-.1,.18);root.add(handle);box(handle,.09,.13,.29,MAT.dark,0,0,.03);for(let i=0;i<4;i++)box(handle,.11,.028,.12,MAT.bone,0,-.02,-.05+i*.055);
    const blade=new THREE.Mesh(new THREE.BufferGeometry(),MAT.spectral);
    const shape=new THREE.Shape();shape.moveTo(-.04,0);shape.lineTo(-.19,-.07);shape.lineTo(-.16,-.55);shape.lineTo(-.02,-.87);shape.lineTo(.055,-.68);shape.lineTo(.09,-.19);shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:.06,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.02,bevelThickness:.02});blade.geometry=geo;blade.rotation.x=0;blade.position.set(0,.04,-.05);root.add(blade);parts.ghostBlade=blade;
    box(root,.22,.045,.1,MAT.bone,0,-.08,.1);
  }
  if(withHands){
    const arms=new THREE.Group();arms.name='FirstPersonHands';root.add(arms);
    // Sleeves, palms, and simplified blocky fingers: intentionally readable, not realistic anatomy.
    const lSleeve=box(arms,.16,.17,.38,MAT.cloth,-.25,-.22,.25);lSleeve.rotation.z=-.25;
    const rSleeve=box(arms,.17,.18,.38,MAT.cloth,.27,-.27,.35);rSleeve.rotation.z=.2;
    const lPalm=box(arms,.14,.105,.16,MAT.glove,-.18,-.17,.02);lPalm.rotation.z=-.15;
    const rPalm=box(arms,.14,.105,.16,MAT.glove,.2,-.18,.12);rPalm.rotation.z=.1;
    for(let i=0;i<4;i++){
      const f1=box(arms,.025,.05,.09,MAT.glove,-.225+i*.028,-.19,-.07);f1.rotation.x=.15;
      const f2=box(arms,.025,.05,.09,MAT.glove,.16+i*.028,-.2,.02);f2.rotation.x=.12;
    }
    parts.hands=arms;parts.leftSleeve=lSleeve;parts.rightSleeve=rSleeve;parts.leftPalm=lPalm;parts.rightPalm=rPalm;
  }
  if(world){
    root.scale.setScalar(size);
    root.rotation.y=-Math.PI/2;
    root.position.y=.5;
  }
  root.userData.parts=parts;root.userData.weaponId=id;
  return root;
}

export function createDroppedPart(kind='magazine') {
  const group=new THREE.Group();
  if(kind.includes('mag')){
    box(group,.2,.36,.16,MAT.dark,0,0,0);box(group,.19,.17,.18,MAT.grip,0,-.08,0);
    if(kind==='mag-bone')for(let i=0;i<5;i++)sphere(group,.045,MAT.bone,(i%2?-.06:.06),.11-i*.045,.09,[.8,1,.8]);
  } else if(kind==='hook'){
    cyl(group,.045,.045,.45,MAT.steel,0,0,0,7);const p=new THREE.Mesh(new THREE.ConeGeometry(.08,.2,5),MAT.steel);p.position.z=-.25;group.add(p);
  } else if(kind==='belt'){
    for(let i=0;i<7;i++){cyl(group,.022,.022,.14,MAT.brass,(i-3)*.052,0,0,6);}
  } else if(kind==='stakePack'){
    for(let i=0;i<5;i++){const s=cyl(group,.035,.045,.42,MAT.wood,(i-2)*.065,0,0,5);s.rotation.z=(i-2)*.02;}
  }
  return group;
}

export function createShellCasing() {
  const m=new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,.12,6),MAT.brass);m.rotation.z=Math.PI/2;m.castShadow=true;return m;
}

export function createBoneProjectile() {
  const g=new THREE.Group();
  const b=new THREE.Mesh(new THREE.CapsuleGeometry(.055,.28,2,5),MAT.bone);b.rotation.z=Math.PI/2;g.add(b);
  for(let s of [-1,1]){const end=new THREE.Mesh(new THREE.SphereGeometry(.09,5,4),MAT.bone);end.position.x=s*.17;g.add(end);}
  return g;
}
