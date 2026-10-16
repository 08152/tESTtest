import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';
import { WEAPONS, getWeapon } from './WeaponRegistry.js';
import { createDroppedPart, createShellCasing, createBoneProjectile } from './WeaponModels.js';
import { terrainHeight } from './WorldTools.js';
import { DroppedItems } from './DroppedItems.js';

const V = (x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
export class WeaponSystem {
  constructor(scene,camera,player,audio,callbacks={}){
    this.scene=scene;this.camera=camera;this.player=player;this.audio=audio;this.callbacks=callbacks;this.enemyManager=null;
    this.slots=Array(5).fill(null);this.selected=0;this.viewRoot=null;this.viewParts=null;this.pickups=[];this.debris=new DroppedItems(scene);
    this.cooldown=0;this.reloading=false;this.reloadElapsed=0;this.reloadDuration=0;this.reloadEvents={oldDropped:false,newShown:false,finished:false};this.aiming=false;this.specialMode=false;this.firing=0;this.animationClock=0;this.shotCounter={};this.tempReloadObject=null;this.tempReloadType=null;this.isMouseDown=false;this.pointerDownTime=0;
    this.spawnInitialLoot();
  }
  setEnemyManager(manager){this.enemyManager=manager;}
  spawnInitialLoot(){
    const plan=[
      ['boneSMG','common',18,terrainHeight(18,1000)+.7,1000],
      ['heavyAR','uncommon',240,terrainHeight(240,-140)+.7,-140],
      ['hadesHook','rare',-350,terrainHeight(-350,265)+.7,265],
      ['stakeRifle','rare',-825,terrainHeight(-825,-360)+.7,-360],
      ['boneGatling','epic',670,terrainHeight(670,-195)+.7,-195],
      ['boneSMG','epic',-710,terrainHeight(-710,495)+.7,495],
      ['heavyAR','rare',-480,terrainHeight(-480,-815)+.7,-815],
      ['stakeRifle','legendary',690,terrainHeight(690,-730)+.7,-730],
      ['hadesHook','uncommon',700,terrainHeight(700,670)+.7,670]
    ];
    for(const [id,rarity,x,y,z] of plan)this.spawnWorldPickup(id,rarity,V(x,y,z));
  }
  spawnWorldPickup(id,rarity='common',position=V(0,0,0),ammoOverride=null){
    const mod=getWeapon(id);if(!mod)return null;
    const root=mod.createWorldModel();root.position.set(position.x,position.y,position.z);root.userData.pickup=true;root.userData.weaponId=id;
    const cfg=GAME_CONFIG.rarity[rarity]||GAME_CONFIG.rarity.common;
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.1,1.45,22),new THREE.MeshBasicMaterial({color:cfg.color,transparent:true,opacity:.78,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(position.x,position.y-.35,position.z);this.scene.add(ring);
    const light=new THREE.PointLight(cfg.color,7,11,2);light.position.set(position.x,position.y+1.8,position.z);this.scene.add(light);
    const item={id,rarity,ammo:ammoOverride??mod.WEAPON_DATA.magazine,reserve:mod.WEAPON_DATA.reserve,root,ring,light,baseY:position.y,phase:Math.random()*6,velocity:V(),settled:true,spin:0};
    this.scene.add(root);this.pickups.push(item);return item;
  }
  active(){return this.slots[this.selected]||null;}
  activeModule(){const s=this.active();return s?getWeapon(s.id):null;}
  equip(index){
    if(index<0||index>=this.slots.length||!this.slots[index])return false;
    this.selected=index;this.aiming=false;this.specialMode=false;this.reloading=false;this.clearTempReloadObject();
    if(this.viewRoot){this.camera.remove(this.viewRoot);this.viewRoot.traverse(o=>{o.geometry?.dispose?.();});this.viewRoot=null;this.viewParts=null;}
    const mod=getWeapon(this.slots[index].id);this.viewRoot=mod.createViewModel();this.viewParts=this.viewRoot.userData.parts;this.viewRoot.position.set(.37,-.34,-.62);this.camera.add(this.viewRoot);
    this.callbacks.inventory?.(this.slots,this.selected);this.callbacks.weapon?.(this.active(),mod?.WEAPON_DATA);return true;
  }
  pickupNearest(){
    if(this.player.phase!=='playing')return;
    const p=this.player.position;let best=null,bd=GAME_CONFIG.lootPickupRange;
    for(const item of this.pickups){const dx=item.root.position.x-p.x,dz=item.root.position.z-p.z,d=Math.hypot(dx,dz);if(d<bd){bd=d;best=item;}}
    if(!best)return false;
    let slot=this.slots.findIndex(s=>!s);
    if(slot<0){slot=this.selected;this.dropSlot(slot,true);}
    this.slots[slot]={id:best.id,rarity:best.rarity,ammo:best.ammo,reserve:best.reserve};
    this.scene.remove(best.root);this.scene.remove(best.ring);this.scene.remove(best.light);this.pickups=this.pickups.filter(x=>x!==best);
    this.equip(slot);this.audio?.play('pickup');this.callbacks.toast?.(`${getWeapon(best.id).WEAPON_DATA.name} aufgenommen · ${GAME_CONFIG.rarity[best.rarity].label}`);return true;
  }
  nearbyPickup(){const p=this.player.position;let best=null,bd=GAME_CONFIG.lootPickupRange;for(const item of this.pickups){const d=Math.hypot(item.root.position.x-p.x,item.root.position.z-p.z);if(d<bd){bd=d;best=item;}}return best;}
  dropCurrent(){if(!this.active())return false;this.dropSlot(this.selected,false);this.callbacks.inventory?.(this.slots,this.selected);this.callbacks.weapon?.(this.active(),this.activeModule()?.WEAPON_DATA);return true;}
  dropSlot(index,replace){const slot=this.slots[index];if(!slot)return;
    const f=this.player.forwardVector();const p=V(this.player.position.x+f.x*GAME_CONFIG.weaponDropDistance,this.player.position.y-.45,this.player.position.z+f.z*GAME_CONFIG.weaponDropDistance);
    this.spawnWorldPickup(slot.id,slot.rarity,p,slot.ammo);const item=this.pickups[this.pickups.length-1];item.settled=false;item.velocity.set(f.x*6,5,f.z*6);item.spin=8;
    if(!replace||index===this.selected)this.slots[index]=null;
    if(this.viewRoot&&index===this.selected){this.camera.remove(this.viewRoot);this.viewRoot.traverse(o=>{o.geometry?.dispose?.();});this.viewRoot=null;this.viewParts=null;this.aiming=false;this.reloading=false;}
    if(this.slots[this.selected])this.equip(this.selected);else{const next=this.slots.findIndex(Boolean);if(next>=0)this.equip(next);else{this.selected=index;this.callbacks.weapon?.(null,null);}}
    this.callbacks.toast?.('Waffe fallengelassen');
  }
  setAim(down){
    if(this.player.phase!=='playing')return;
    const slot=this.active(),mod=this.activeModule();if(!slot||!mod)return;
    if(mod.WEAPON_DATA.id==='ghostBlade'){
      if(down)this.enemyManager?.markNearby();return;
    }
    if(mod.WEAPON_DATA.id==='hadesHook'){this.specialMode=down;if(down)this.callbacks.toast?.('HADES-Haken: Zugmodus · Linksklick auf Gegner in 10 m');return;}
    if(mod.WEAPON_DATA.aimable)this.aiming=down;
  }
  fire(){
    if(this.player.phase!=='playing'||this.cooldown>0||this.reloading)return;
    const slot=this.active(),mod=this.activeModule();if(!slot||!mod)return;
    const data=mod.WEAPON_DATA;
    if(data.id==='ghostBlade'){
      this.cooldown=data.fireInterval;this.firing=.18;this.audio?.play('melee');const target=this.raycastEnemy(data.range);
      if(target){const damage=this.damageFor(slot,target.zone);this.enemyManager?.hurtEnemy(target.enemy,damage,target.zone,data.id);}else this.callbacks.toast?.('Nahkampfangriff verfehlt');return;
    }
    if(data.id==='hadesHook'){
      if(slot.ammo<=0){this.audio?.play('empty');this.callbacks.toast?.('Hades-Haken leer · R zum Nachladen');return;}
      this.cooldown=data.fireInterval;slot.ammo--;this.firing=.2;this.audio?.play('melee');
      const target=this.specialMode?this.enemyManager?.targetInRange(10):this.raycastEnemy(10);
      if(target){const dmg=this.damageFor(slot,target.zone);this.enemyManager?.hurtEnemy(target.enemy,dmg,target.zone,data.id);if(this.specialMode)this.enemyManager?.pullTarget(target.enemy);}
      this.drawHookLine(target);this.specialMode=false;this.callbacks.ammo?.(slot,data);return;
    }
    if(slot.ammo<=0){this.audio?.play('empty');this.callbacks.toast?.('Magazin leer · R zum Nachladen');return;}
    slot.ammo--;this.cooldown=data.fireInterval;this.firing=.11;this.audio?.play(data.id==='boneGatling'?'gatling':'shoot');this.shotCounter[data.id]=(this.shotCounter[data.id]||0)+1;
    const hit=this.raycastEnemy(data.range);
    if(hit){let damage=this.damageFor(slot,hit.zone);if(data.id==='boneSMG'&&hit.distance>100)damage*=.72;if(data.id==='boneGatling'&&hit.distance>120)damage*=.65;this.enemyManager?.hurtEnemy(hit.enemy,Math.round(damage),hit.zone,data.id);}
    this.spawnShell();
    if(data.id==='boneGatling'&&this.shotCounter[data.id]%10===0)this.spawnBoneImpact(hit);
    if(data.id==='stakeRifle')this.spawnStakeImpact(hit);
    if(data.id==='heavyAR'&&this.viewParts?.redDot)this.viewParts.redDot.material.emissiveIntensity=2.6;
    this.callbacks.ammo?.(slot,data);this.callbacks.inventory?.(this.slots,this.selected);
  }
  damageFor(slot,zone){const mod=getWeapon(slot.id);const rarity=mod.WEAPON_DATA.damage[slot.rarity]||mod.WEAPON_DATA.damage.common;return zone==='head'?rarity.head:rarity.body;}
  raycastEnemy(maxRange){if(!this.enemyManager)return null;const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),this.camera);ray.far=maxRange;const intersections=ray.intersectObjects(this.enemyManager.getHitMeshes(),false);for(const it of intersections){const enemy=it.object.userData.enemy;if(enemy?.alive)return {enemy,zone:it.object.userData.hitZone||'body',distance:it.distance,point:it.point};}return null;}
  drawHookLine(target){const start=new THREE.Vector3();if(this.viewRoot)this.viewRoot.getWorldPosition(start);else start.copy(this.camera.position);const dir=new THREE.Vector3();this.camera.getWorldDirection(dir);const end=target?.enemy?.group.position.clone().add(new THREE.Vector3(0,1.7,0))||start.clone().add(dir.multiplyScalar(10));const geo=new THREE.BufferGeometry().setFromPoints([start,end]);const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xd6e0e5,transparent:true,opacity:.9}));this.scene.add(line);setTimeout(()=>{this.scene.remove(line);geo.dispose();line.material.dispose();},260);}
  spawnShell(){if(!this.viewRoot)return;const shell=createShellCasing();const forward=this.player.forwardVector();const p=this.camera.position.clone().add(forward.clone().multiplyScalar(.6)).add(new THREE.Vector3(.35,-.34,.08));const right=new THREE.Vector3(Math.cos(this.player.yaw),0,-Math.sin(this.player.yaw));const vel=right.clone().multiplyScalar(4+Math.random()*3).add(new THREE.Vector3(0,2.3+Math.random()*2,0)).add(forward.clone().multiplyScalar(-2));this.debris.add(shell,p,vel,2.8,'casing',{shrink:true,rot:V(8,12,5)});}
  spawnBoneImpact(hit){const bone=createBoneProjectile();const f=this.player.forwardVector();const distance=hit?.distance||22;const x=this.player.position.x+f.x*Math.min(distance,30),z=this.player.position.z+f.z*Math.min(distance,30);bone.position.set(x,terrainHeight(x,z)+.32,z);bone.rotation.set(Math.random()*.4,Math.random()*Math.PI,Math.PI/2+(Math.random()-.5)*.35);this.debris.add(bone,bone.position.clone(),V(0,0,0),3.5,'bone',{shrink:true,rot:V(.1,.6,.15),settled:true});this.audio?.play('bone');}
  spawnStakeImpact(hit){const stake=createDroppedPart('stakePack');const f=this.player.forwardVector();const distance=hit?.distance||85;const x=this.player.position.x+f.x*Math.min(distance,130),z=this.player.position.z+f.z*Math.min(distance,130);stake.position.set(x,terrainHeight(x,z)+.8,z);stake.rotation.set(.18,Math.random()*6,.7);this.debris.add(stake,stake.position.clone(),V(0,1,0),3.1,'stake',{shrink:true,rot:V(1,.7,1)});for(let i=0;i<5;i++){const spark=new THREE.Mesh(new THREE.SphereGeometry(.06,4,3),new THREE.MeshBasicMaterial({color:0xffb65d}));const pos=this.camera.position.clone().add(this.player.forwardVector().multiplyScalar(2)).add(V((Math.random()-.5)*.3,-.25+(Math.random()-.5)*.2,0));this.debris.add(spark,pos,V((Math.random()-.5)*4,Math.random()*4,-Math.random()*3),.65,'spark',{shrink:true,rot:V(1,1,1)});}}
  reload(){const slot=this.active(),mod=this.activeModule();if(!slot||!mod||this.reloading||!mod.WEAPON_DATA.reloadDuration||mod.WEAPON_DATA.id==='ghostBlade')return;
    const data=mod.WEAPON_DATA;if(slot.ammo>=data.magazine||slot.reserve<=0)return;
    this.reloading=true;this.reloadElapsed=0;this.reloadDuration=data.reloadDuration;this.reloadEvents={oldDropped:false,newShown:false,finished:false};this.audio?.play('reload');this.callbacks.reload?.(true);this.callbacks.toast?.('NACHLADEN');
  }
  dropReloadPart(kind){if(!this.viewRoot)return;const obj=createDroppedPart(kind);const f=this.player.forwardVector();const pos=this.camera.position.clone().add(f.clone().multiplyScalar(.9)).add(new THREE.Vector3(.05,-.45,0));const right=new THREE.Vector3(Math.cos(this.player.yaw),0,-Math.sin(this.player.yaw));this.debris.add(obj,pos,right.clone().multiplyScalar(2.3).add(new THREE.Vector3(0,1.2,0)),3.1,'magazine',{shrink:true,rot:V(3,5,2)});}
  showTempReloadPart(kind){this.clearTempReloadObject();const p=getWeapon(this.active()?.id);const root=createDroppedPart(kind);root.scale.setScalar(.72);root.position.set(.22,-.45,-.5);this.camera.add(root);this.tempReloadObject=root;this.tempReloadType=kind;}
  clearTempReloadObject(){if(this.tempReloadObject){this.camera.remove(this.tempReloadObject);this.tempReloadObject.traverse(o=>o.geometry?.dispose?.());this.tempReloadObject=null;this.tempReloadType=null;}}
  updateReload(dt){if(!this.reloading)return;this.reloadElapsed+=dt;const t=Math.min(1,this.reloadElapsed/this.reloadDuration);const slot=this.active(),mod=this.activeModule();if(!slot||!mod){this.reloading=false;return;}const id=slot.id,parts=this.viewParts;
    // Distinct, readable animation beats for each weapon, including physical dropped parts.
    if(id==='boneSMG'){
      if(t>.22&&!this.reloadEvents.oldDropped){this.dropReloadPart('mag-bone');if(parts.magazine)parts.magazine.visible=false;this.reloadEvents.oldDropped=true;}
      if(t>.43&&!this.reloadEvents.newShown){this.showTempReloadPart('mag-bone');this.reloadEvents.newShown=true;}
      if(parts.hands)parts.hands.position.y=t>.4?-.05:0;
      if(t>.76&&parts.magazine)parts.magazine.visible=true;
    }else if(id==='heavyAR'){
      // The new magazine is the hand-held pusher: it bumps the old one clear, then seats itself.
      if(t>.18&&!this.reloadEvents.newShown){this.showTempReloadPart('mag');this.reloadEvents.newShown=true;}
      if(t>.36&&!this.reloadEvents.oldDropped){this.dropReloadPart('mag');if(parts.magazine)parts.magazine.visible=false;this.reloadEvents.oldDropped=true;}
      if(t>.72&&parts.magazine)parts.magazine.visible=true;
      if(this.tempReloadObject){this.tempReloadObject.position.x=.19+Math.max(0,.35-t)*.38;this.tempReloadObject.position.y=-.42+Math.sin(t*Math.PI)*.09;}
    }else if(id==='hadesHook'){
      if(t>.2&&!this.reloadEvents.oldDropped){this.dropReloadPart('hook');if(parts.hook)parts.hook.visible=false;this.reloadEvents.oldDropped=true;}
      if(t>.56&&!this.reloadEvents.newShown){this.showTempReloadPart('hook');this.reloadEvents.newShown=true;}
      if(t>.78&&parts.hook)parts.hook.visible=true;
    }else if(id==='boneGatling'){
      if(t>.28&&!this.reloadEvents.oldDropped){this.dropReloadPart('belt');if(parts.beltGroup)parts.beltGroup.visible=false;this.reloadEvents.oldDropped=true;}
      if(t>.48&&!this.reloadEvents.newShown){this.showTempReloadPart('belt');this.reloadEvents.newShown=true;}
      if(t>.82&&parts.beltGroup){parts.beltGroup.visible=true;parts.belt.forEach((l,i)=>l.position.x=(i%6)*.045);}
    }else if(id==='stakeRifle'){
      if(parts.hatch){const phase=t<.28?-1:t<.72?-.75:0;parts.hatch.rotation.x=phase;}
      if(t>.22&&!this.reloadEvents.oldDropped&&slot.ammo<=0){this.dropReloadPart('stakePack');this.reloadEvents.oldDropped=true;}
      if(t>.36&&!this.reloadEvents.newShown){this.showTempReloadPart('stakePack');this.reloadEvents.newShown=true;}
      if(parts.stakeBundle)parts.stakeBundle.visible=t>.4&&t<.78;
      if(parts.hands)parts.hands.position.y=t>.35&&t<.75?-.06:0;
    }
    if(t>=1&&!this.reloadEvents.finished){const amount=Math.min(data.magazine-slot.ammo,slot.reserve);slot.ammo+=amount;slot.reserve-=amount;this.reloading=false;this.reloadEvents.finished=true;this.clearTempReloadObject();if(parts?.magazine)parts.magazine.visible=true;if(parts?.hook)parts.hook.visible=true;if(parts?.beltGroup)parts.beltGroup.visible=true;if(parts?.stakeBundle)parts.stakeBundle.visible=false;if(parts?.hatch)parts.hatch.rotation.x=0;if(parts?.hands)parts.hands.position.y=0;this.callbacks.reload?.(false);this.callbacks.ammo?.(slot,data);this.callbacks.toast?.('NACHLADEN FERTIG');}
  }
  update(dt){this.cooldown=Math.max(0,this.cooldown-dt);this.firing=Math.max(0,this.firing-dt);this.animationClock+=dt;
    for(const item of this.pickups){if(!item.settled){item.velocity.y-=20*dt;item.root.position.addScaledVector(item.velocity,dt);item.root.rotation.y+=item.spin*dt;const floor=terrainHeight(item.root.position.x,item.root.position.z)+.45;if(item.root.position.y<=floor){item.root.position.y=floor;item.settled=true;item.velocity.set(0,0,0);item.root.rotation.x=0;item.root.rotation.z=0;item.baseY=floor;}}
      else item.root.position.y=item.baseY+Math.sin(this.animationClock*2+item.phase)*.15;
      item.root.rotation.y+=dt*(item.settled?.3:0);item.ring.position.y=item.root.position.y-.38;item.light.position.set(item.root.position.x,item.root.position.y+1.8,item.root.position.z);
    }
    this.debris.update(dt);this.updateReload(dt);
    if(this.viewRoot){const data=this.activeModule()?.WEAPON_DATA;const mod=this.activeModule();const hip=V(.37,-.34,-.62),ads=V(.015,-.303,-.57),target=(this.aiming&&data?.aimable)?ads:hip;this.viewRoot.position.lerp(target,Math.min(1,dt*12));const recoil=this.firing>0?Math.sin(this.firing/0.11*Math.PI)*.065:0;this.viewRoot.rotation.x+=(recoil-this.viewRoot.rotation.x)*Math.min(1,dt*18);this.viewRoot.rotation.y+=(this.specialMode?.05:0-this.viewRoot.rotation.y)*Math.min(1,dt*8);
      if(mod?.animateWeapon)mod.animateWeapon(this.viewParts,this.reloading?'reloading':this.firing>0?'firing':'idle',this.animationClock,this.firing>0);
      if(this.viewParts?.hands){this.viewParts.hands.position.y+=(this.firing>0?-.035:0-this.viewParts.hands.position.y)*Math.min(1,dt*10);}
    }
  }
  getNearbyDescription(){const p=this.nearbyPickup();if(!p)return null;const w=getWeapon(p.id)?.WEAPON_DATA;return w?`${w.name} · ${GAME_CONFIG.rarity[p.rarity].label} · [E] AUFHEBEN`:null;}
  getHUDState(){const slot=this.active(),mod=this.activeModule();return {slot,data:mod?.WEAPON_DATA||null,aiming:this.aiming,reloading:this.reloading,slots:this.slots,selected:this.selected};}
  dispose(){for(const p of this.pickups){this.scene.remove(p.root);this.scene.remove(p.ring);this.scene.remove(p.light);}this.pickups.length=0;this.debris.clear();this.clearTempReloadObject();if(this.viewRoot)this.camera.remove(this.viewRoot);}
}
