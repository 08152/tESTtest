import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';
import { terrainHeight, makeMaterial, addBox } from './WorldTools.js';
import { getWeapon } from './WeaponRegistry.js';

const mk=(color,roughness=.9,metalness=.02,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
function createEnemyVisual(scene,x,z,boss=false){
  const group=new THREE.Group();group.name=boss?'Ghostface_Robot':'Island_Guard';group.position.set(x,terrainHeight(x,z),z);scene.add(group);
  const dark=mk(boss?0x14151c:0x29333d,.85,.18),black=mk(0x05070b,.65,.1),metal=mk(boss?0x424953:0x5e6c75,.45,.55),maskMat=mk(boss?0xe3e6e8:0x8a969f,.44,.25),red=mk(0xc5232d,.3,.3,{emissive:0x57060b,emissiveIntensity:1.3});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(boss?1.05:.72,boss?2.1:1.4,4,8),dark);body.position.y=boss?1.9:1.45;body.scale.set(boss?1.15:1,.98,.8);body.castShadow=true;group.add(body);body.userData.hitZone='body';
  const belt=new THREE.Mesh(new THREE.BoxGeometry(boss?1.25:.95,.19,.73),metal);belt.position.set(0,boss?1.5:1.1,0);group.add(belt);belt.userData.hitZone='body';
  for(const s of [-1,1]){
    const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.21,.78,3,6),dark);arm.position.set(s*(boss?1.05:.78),boss?1.9:1.45,-.03);arm.rotation.z=s*.25;group.add(arm);arm.userData.hitZone='body';
    const forearm=new THREE.Mesh(new THREE.CylinderGeometry(.12,.19,.55,6),metal);forearm.position.set(s*(boss?1.16:.88),boss?1.27:1.0,-.06);forearm.rotation.z=s*.18;group.add(forearm);forearm.userData.hitZone='body';
  }
  const head=new THREE.Group();head.position.set(0,boss?3.55:2.7,0);group.add(head);
  const hood=new THREE.Mesh(new THREE.SphereGeometry(boss?1.04:.68,10,8),black);hood.scale.set(1.02,1.15,.8);hood.position.y=.02;head.add(hood);
  const face=new THREE.Mesh(new THREE.SphereGeometry(boss?.69:.48,12,9),maskMat);face.scale.set(.8,1.12,.56);face.position.set(0,-.05,-.32);head.add(face);face.userData.hitZone='head';
  const eyeGeo=new THREE.SphereGeometry(.16,7,5);
  for(const s of [-1,1]){const eye=new THREE.Mesh(eyeGeo,black);eye.scale.set(.65,1.55,.25);eye.position.set(s*(boss?.23:.16),.06,-.61);head.add(eye);eye.userData.hitZone='head';}
  const mouth=new THREE.Mesh(new THREE.BoxGeometry(.21,.29,.04),black);mouth.position.set(0,-.3,-.6);head.add(mouth);mouth.userData.hitZone='head';
  const scar=new THREE.Mesh(new THREE.BoxGeometry(.03,.42,.035),red);scar.position.set(.31,-.24,-.61);head.add(scar);
  const blade=new THREE.Group();blade.position.set(.98,1.1,-.22);group.add(blade);addBox(blade,0,0,0,.13,.18,.22,0x22252a);const bladePart=new THREE.Mesh(new THREE.ConeGeometry(.11,.84,5),mk(0xdce5e7,.3,.25,{emissive:0x182d35,emissiveIntensity:.4}));bladePart.position.set(0,-.25,-.32);bladePart.rotation.x=-Math.PI/2;blade.add(bladePart);
  if(boss){for(let i=-2;i<=2;i++){const spike=new THREE.Mesh(new THREE.ConeGeometry(.14,.7,5),metal);spike.position.set(i*.31,1.65,.25);spike.rotation.z=(i%2)*.12;group.add(spike);spike.userData.hitZone='body';}}
  const ring=new THREE.Mesh(new THREE.RingGeometry(boss?1.7:1.1,boss?1.95:1.27,28),new THREE.MeshBasicMaterial({color:0xffd45d,transparent:true,opacity:.88,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.18;ring.visible=false;group.add(ring);
  const meshes=[];group.traverse(o=>{if(o.isMesh&&o.userData.hitZone)meshes.push(o);});
  return {group,meshes,head,ring,blade};
}

function makeTracer(scene,a,b,color=0xff7354,life=.12){const geom=new THREE.BufferGeometry().setFromPoints([a,b]);const line=new THREE.Line(geom,new THREE.LineBasicMaterial({color,transparent:true,opacity:.85}));scene.add(line);setTimeout(()=>{scene.remove(line);geom.dispose();line.material.dispose();},Math.max(20,life*1000));}

export class EnemyManager {
  constructor(scene,player,audio,weaponSystem,callbacks={}){
    this.scene=scene;this.player=player;this.audio=audio;this.weaponSystem=weaponSystem;this.callbacks=callbacks;this.enemies=[];this.clock=0;this.projectiles=[];
    this.createEnemy('bot',260,-140,100);this.createEnemy('bot',685,-180,115);this.createEnemy('bot',720,-725,115);this.createEnemy('bot',-700,495,100);
    this.boss=this.createEnemy('boss',-330,260,GAME_CONFIG.ghostfaceHealth);
  }
  createEnemy(kind,x,z,hp){const boss=kind==='boss',v=createEnemyVisual(this.scene,x,z,boss);const enemy={id:boss?'ghostface':`guard_${this.enemies.length}`,kind,boss,group:v.group,meshes:v.meshes,head:v.head,ring:v.ring,blade:v.blade,maxHealth:hp,health:hp,alive:true,alert:false,markedUntil:0,attackTimer:0,shotTimer:0,patrolAngle:Math.random()*Math.PI*2,baseX:x,baseZ:z,aiState:'patrol',pulling:false,hitFlash:0};for(const mesh of v.meshes)mesh.userData.enemy=enemy;this.enemies.push(enemy);return enemy;}
  getHitMeshes(){const out=[];for(const e of this.enemies)if(e.alive)out.push(...e.meshes);return out;}
  getAlive(){return this.enemies.filter(e=>e.alive);}
  hurtEnemy(enemy,damage,zone='body',weaponId=''){
    if(!enemy||!enemy.alive)return;enemy.health=Math.max(0,enemy.health-damage);enemy.hitFlash=.12;enemy.alert=true;enemy.aiState='chase';
    if(enemy.boss&&this.callbacks.bossBar)this.callbacks.bossBar(true,enemy.health,enemy.maxHealth);
    if(this.audio)this.audio.play('hit');
    if(this.callbacks.toast)this.callbacks.toast(`${enemy.boss?'GHOSTFACE':'GEGNER'}: ${Math.round(damage)} ${zone==='head'?'KOPFTREFFER':'SCHADEN'}`);
    if(enemy.health<=0)this.defeat(enemy);
  }
  defeat(enemy){enemy.alive=false;this.scene.remove(enemy.group);if(enemy.boss){if(this.callbacks.bossBar)this.callbacks.bossBar(false,0,enemy.maxHealth);if(this.callbacks.toast)this.callbacks.toast('GHOSTFACE BESIEGT · LEGENDÄRE GHOSTFACE-KLINGE GEDROPPT');this.weaponSystem?.spawnWorldPickup('ghostBlade','legendary',new THREE.Vector3(enemy.group.position.x,terrainHeight(enemy.group.position.x,enemy.group.position.z)+.6,enemy.group.position.z));}
    else if(this.callbacks.toast)this.callbacks.toast('GEGNER BESIEGT');
  }
  markNearby(){const p=this.player.position;let n=0;for(const e of this.enemies){if(!e.alive)continue;const d=e.group.position.distanceTo(new THREE.Vector3(p.x,terrainHeight(p.x,p.z),p.z));if(d<=GAME_CONFIG.ghostfaceMarkRange){e.markedUntil=3.5;e.ring.visible=true;n++;}}if(this.audio)this.audio.play('mark');if(this.callbacks.toast)this.callbacks.toast(n?`${n} GEGNER MARKIERT · 10 M`:'KEINE GEGNER IM UMKREIS VON 10 M');}
  targetInRange(maxDistance=10){const p=this.player.position;let best=null,bd=maxDistance;for(const e of this.enemies){if(!e.alive)continue;const d=e.group.position.distanceTo(p);if(d<bd){bd=d;best=e;}}return best;}
  pullTarget(enemy){if(enemy&&enemy.alive){enemy.pulling=true;enemy.pullRemaining=1.2;}}
  update(dt){this.clock+=dt;const p=this.player.position;for(const e of this.enemies){if(!e.alive)continue;
      const dx=p.x-e.group.position.x,dz=p.z-e.group.position.z,dist=Math.hypot(dx,dz);e.attackTimer=Math.max(0,e.attackTimer-dt);e.shotTimer=Math.max(0,e.shotTimer-dt);e.hitFlash=Math.max(0,e.hitFlash-dt);e.markedUntil=Math.max(0,e.markedUntil-dt);e.ring.visible=e.markedUntil>0;
      if(e.pulling){const len=Math.max(.001,Math.hypot(dx,dz));const travel=Math.min(28*dt,len-1.8);if(travel>0){e.group.position.x+=dx/len*travel;e.group.position.z+=dz/len*travel;}e.pullRemaining-=dt;if(e.pullRemaining<=0||dist<2)e.pulling=false;}
      else if(e.boss){
        if(!e.alert&&dist<66){e.alert=true;e.aiState='chase';if(this.audio)this.audio.play('alert');if(this.callbacks.toast)this.callbacks.toast('GHOSTFACE HAT DICH ENTDECKT!');if(this.callbacks.bossBar)this.callbacks.bossBar(true,e.health,e.maxHealth);}
        if(e.alert&&dist>1.8){const move=Math.min(17*dt,dist-1.8);e.group.position.x+=dx/dist*move;e.group.position.z+=dz/dist*move;}
        else if(!e.alert){e.patrolAngle+=dt*.3;e.group.position.x=e.baseX+Math.sin(e.patrolAngle)*13;e.group.position.z=e.baseZ+Math.cos(e.patrolAngle)*13;}
        if(e.alert&&dist<3.1&&e.attackTimer<=0){e.attackTimer=1.05;this.player.takeDamage(GAME_CONFIG.ghostfaceBladeDamageToPlayer);if(this.callbacks.toast)this.callbacks.toast('GHOSTFACE TRIFFT DICH · 15 SCHADEN');if(this.audio)this.audio.play('melee');}
      }else{
        if(dist<100&&dist>16){e.alert=true;e.aiState='chase';if(e.shotTimer<=0){e.shotTimer=1.45;const eye=new THREE.Vector3(e.group.position.x,e.group.position.y+2.2,e.group.position.z);const target=new THREE.Vector3(p.x,p.y-0.4,p.z);makeTracer(this.scene,eye,target,0xc34d54,.13);if(Math.random()<.72){this.player.takeDamage(3+Math.random()*3);}}}
        if(e.alert&&dist>10&&dist<100){const move=Math.min(6.8*dt,dist-8);e.group.position.x+=dx/dist*move;e.group.position.z+=dz/dist*move;}
        else if(dist>100){e.patrolAngle+=dt*.24;e.group.position.x=e.baseX+Math.sin(e.patrolAngle)*10;e.group.position.z=e.baseZ+Math.cos(e.patrolAngle)*10;}
        if(dist<2.2&&e.attackTimer<=0){e.attackTimer=1.3;this.player.takeDamage(7);if(this.audio)this.audio.play('melee');}
      }
      const y=terrainHeight(e.group.position.x,e.group.position.z);e.group.position.y=y;e.group.lookAt(p.x,y+(e.boss?2.5:1.7),p.z);
      e.ring.position.y=.22;
      if(e.hitFlash>0)e.group.children.forEach(c=>{if(c.material&&c.material.emissive)c.material.emissive.setHex(0x5e1b1b);});
    }
  }
}
