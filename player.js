import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';
import { terrainHeight, makeMaterial, addBox } from './WorldTools.js';

export class PlayerController {
  constructor(camera, scene, canvas) {
    this.camera=camera; this.scene=scene; this.canvas=canvas;
    this.position=camera.position; this.phase='menu'; this.health=GAME_CONFIG.startingHealth; this.shield=GAME_CONFIG.startingShield;
    this.velocity=new THREE.Vector3(); this.keys=new Set(); this.yaw=0; this.pitch=0; this.grounded=false; this.parachute=false; this.parachuteGroup=null; this.cabin=null;
    this.jumpTime=0; this.mouseSensitivity=.002; this.touchMove={x:0,y:0}; this.attackLock=0; this.damageFlash=0;
    camera.rotation.order='YXZ';
    window.addEventListener('keydown',e=>{this.keys.add(e.code); if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    canvas.addEventListener('click',()=>{if(this.phase==='playing' && document.pointerLockElement!==canvas)canvas.requestPointerLock?.();});
    document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas && (this.phase==='playing'||this.phase==='airborne')){this.yaw-=e.movementX*this.mouseSensitivity;this.pitch-=e.movementY*this.mouseSensitivity;this.pitch=Math.max(-1.52,Math.min(1.52,this.pitch));}});
    document.addEventListener('pointerlockchange',()=>{this.pointerLocked=document.pointerLockElement===canvas;});
    this.pointerLocked=false;
    this.camera.position.set(0,180,1040); this.camera.lookAt(0,0,0);
  }
  resetPlane() {
    this.removeCabin(); this.removeParachute();
    this.health=GAME_CONFIG.startingHealth;this.shield=GAME_CONFIG.startingShield;this.velocity.set(0,0,0);this.yaw=0;this.pitch=0;this.parachute=false;this.grounded=false;this.phase='plane';
    const x=0,z=1100;this.position.set(x,terrainHeight(x,z)+155,z);this.camera.rotation.set(0,0,0,'YXZ');this.yaw=0;this.pitch=0;
    this.createCabin();
  }
  createCabin() {
    this.removeCabin(); const g=new THREE.Group();g.name='TransportPlaneCabin';this.camera.add(g);this.cabin=g;
    const wall=makeMaterial(0x2e3742,.86), rib=makeMaterial(0x66717c,.55,.45), floor=makeMaterial(0x343c44,.98), seat=makeMaterial(0x323a41,.95);
    const add=(x,y,z,w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o;};
    add(0,-1.42,0,5.4,.16,15,floor);add(-2.55,.2,-.2,.15,3.6,14,wall);add(2.55,.2,-.2,.15,3.6,14,wall);add(0,2.05,.8,5.2,.15,13,wall);add(0,.1,7.5,5.2,3.4,.16,wall);
    // Tail-ramp frame: open centre remains visible toward the island.
    add(-2.25,-.1,-7.4,.25,3.1,.25,rib);add(2.25,-.1,-7.4,.25,3.1,.25,rib);add(0,1.45,-7.4,4.7,.24,.25,rib);add(-2.15,-1.15,-7.4,.4,.18,2.8,rib);add(2.15,-1.15,-7.4,.4,.18,2.8,rib);
    for(let z=-4;z<6;z+=2.2){add(-1.95,-.35,z,.72,1.3,.8,seat);add(1.95,-.35,z,.72,1.3,.8,seat);}
    for(let x of [-2,2]) for(let z of [-5,-1,3,6]){const light=new THREE.Mesh(new THREE.SphereGeometry(.07,6,4),new THREE.MeshBasicMaterial({color:0x79e2bc}));light.position.set(x,1.55,z);g.add(light);}
  }
  removeCabin(){if(this.cabin){this.camera.remove(this.cabin);this.cabin.traverse(o=>{o.geometry?.dispose?.();});this.cabin=null;}}
  jumpFromPlane(){if(this.phase!=='plane')return;this.removeCabin();this.phase='airborne';this.jumpTime=0;this.velocity.set(0,-3,0);this.grounded=false;this.parachute=false;}
  deployParachute(){if(this.phase!=='airborne'||this.parachute)return;this.parachute=true;this.velocity.y=-11;this.createParachute();}
  createParachute(){this.removeParachute();const g=new THREE.Group();g.name='SingleStandardParachute';this.scene.add(g);this.parachuteGroup=g;
    const canopy=new THREE.Mesh(new THREE.SphereGeometry(5.8,14,8,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0xdde5ea,roughness:.7,side:THREE.DoubleSide}));canopy.scale.y=.62;canopy.position.y=4.7;g.add(canopy);
    const red=new THREE.Mesh(new THREE.BoxGeometry(11.2,.12,.9),new THREE.MeshStandardMaterial({color:0xd85036,roughness:.8}));red.position.set(0,5.7,0);g.add(red);
    const cordsMat=new THREE.LineBasicMaterial({color:0xbec8d2,transparent:true,opacity:.85});
    for(let i=-3;i<=3;i++){const points=[new THREE.Vector3(i*1.5,6.7,0),new THREE.Vector3(i*.35,1.1,0)];g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),cordsMat));}
  }
  removeParachute(){if(this.parachuteGroup){this.scene.remove(this.parachuteGroup);this.parachuteGroup.traverse(o=>{o.geometry?.dispose?.();});this.parachuteGroup=null;}}
  forwardVector(){return new THREE.Vector3(-Math.sin(this.yaw),0,-Math.cos(this.yaw)).normalize();}
  update(dt) {
    if(this.damageFlash>0)this.damageFlash=Math.max(0,this.damageFlash-dt);
    this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');
    if(this.phase==='plane'||this.phase==='menu'||this.phase==='gameover')return {landed:false};
    if(this.phase==='airborne'){
      this.jumpTime+=dt;
      if(this.keys.has('Space')&&!this.parachute)this.deployParachute();
      const f=this.forwardVector();const right=new THREE.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw));
      let mx=0,mz=0;if(this.keys.has('KeyW')||this.keys.has('ArrowUp')){mx+=f.x;mz+=f.z;}if(this.keys.has('KeyS')||this.keys.has('ArrowDown')){mx-=f.x;mz-=f.z;}if(this.keys.has('KeyA')||this.keys.has('ArrowLeft')){mx-=right.x;mz-=right.z;}if(this.keys.has('KeyD')||this.keys.has('ArrowRight')){mx+=right.x;mz+=right.z;}
      mx+=this.touchMove.x;mz+=this.touchMove.y;const mv=new THREE.Vector3(mx,0,mz);if(mv.lengthSq()>0)mv.normalize();this.position.x+=mv.x*36*dt;this.position.z+=mv.z*36*dt;
      if(!this.parachute){this.velocity.y-=GAME_CONFIG.gravity*dt;if(this.position.y<35){this.deployParachute();}}
      this.position.y+=this.velocity.y*dt;
      if(this.parachute){this.velocity.y=-11;this.position.y+=8*dt; if(this.parachuteGroup){this.parachuteGroup.position.set(this.position.x,this.position.y-5.5,this.position.z);this.parachuteGroup.rotation.y=this.yaw;}}
      const floor=terrainHeight(this.position.x,this.position.z)+GAME_CONFIG.playerHeight;
      if(this.position.y<=floor){this.position.y=floor;this.velocity.y=0;this.phase='playing';this.grounded=true;this.removeParachute();this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');return {landed:true};}
      return {landed:false};
    }
    if(this.phase==='playing'){
      const f=this.forwardVector(), right=new THREE.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw));
      let mx=0,mz=0;if(this.keys.has('KeyW')||this.keys.has('ArrowUp')){mx+=f.x;mz+=f.z;}if(this.keys.has('KeyS')||this.keys.has('ArrowDown')){mx-=f.x;mz-=f.z;}if(this.keys.has('KeyA')||this.keys.has('ArrowLeft')){mx-=right.x;mz-=right.z;}if(this.keys.has('KeyD')||this.keys.has('ArrowRight')){mx+=right.x;mz+=right.z;}
      mx+=this.touchMove.x;mz+=this.touchMove.y;
      const move=new THREE.Vector3(mx,0,mz);const sprint=this.keys.has('ShiftLeft')||this.keys.has('ShiftRight');
      if(move.lengthSq()>1)move.normalize();const speed=sprint?GAME_CONFIG.sprintSpeed:GAME_CONFIG.walkSpeed;
      const nx=this.position.x+move.x*speed*dt,nz=this.position.z+move.z*speed*dt;
      // Soft shoreline bounds keep the player on the island.
      const r=Math.sqrt((nx/1450)**2+(nz/1420)**2);if(r<.985){this.position.x=nx;this.position.z=nz;}
      const ground=terrainHeight(this.position.x,this.position.z)+GAME_CONFIG.playerHeight;
      if(this.keys.has('Space')&&this.grounded){this.velocity.y=GAME_CONFIG.jumpSpeed;this.grounded=false;}
      if(!this.grounded){this.velocity.y-=GAME_CONFIG.gravity*dt;this.position.y+=this.velocity.y*dt;if(this.position.y<=ground){this.position.y=ground;this.velocity.y=0;this.grounded=true;}}
      else this.position.y=ground;
      // Dampen accidental out-of-bounds drift on the coast.
      this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');
    }
    return {landed:false};
  }
  takeDamage(amount){if(this.shield>0){const absorbed=Math.min(this.shield,amount);this.shield-=absorbed;amount-=absorbed;}this.health=Math.max(0,this.health-amount);this.damageFlash=.28;return this.health<=0;}
  dispose(){this.removeCabin();this.removeParachute();this.keys.clear();}
}
