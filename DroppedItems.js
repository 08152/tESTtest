import * as THREE from 'three';
import { terrainHeight } from './WorldTools.js';
export class DroppedItems {
  constructor(scene){this.scene=scene;this.items=[];}
  add(object, position, velocity=new THREE.Vector3(), life=2.8, kind='debris', options={}){
    object.position.copy(position);this.scene.add(object);this.items.push({object,velocity:velocity.clone(),life,age:0,kind,shrink:options.shrink!==false,rot:options.rot||new THREE.Vector3(2,3,1),settled:false, ...options});return object;
  }
  update(dt){
    for(let i=this.items.length-1;i>=0;i--){const item=this.items[i];item.age+=dt;const o=item.object;
      if(item.kind==='weapon'){
        if(!item.settled){item.velocity.y-=24*dt;o.position.addScaledVector(item.velocity,dt);o.rotation.x+=item.rot.x*dt;o.rotation.y+=item.rot.y*dt;o.rotation.z+=item.rot.z*dt;const floor=terrainHeight(o.position.x,o.position.z)+.35;if(o.position.y<=floor){o.position.y=floor;item.settled=true;item.velocity.set(0,0,0);o.rotation.x=0;o.rotation.z=0;}}
        continue;
      }
      if(!item.settled){item.velocity.y-=23*dt;o.position.addScaledVector(item.velocity,dt);o.rotation.x+=item.rot.x*dt;o.rotation.y+=item.rot.y*dt;o.rotation.z+=item.rot.z*dt;const floor=terrainHeight(o.position.x,o.position.z)+.18;if(o.position.y<=floor){o.position.y=floor;item.settled=true;item.velocity.multiplyScalar(.08);o.rotation.x*=.3;o.rotation.z*=.3;}}
      const start=Math.max(0,item.life-.85);
      if(item.shrink&&item.age>start){const t=Math.min(1,(item.age-start)/Math.max(.05,item.life-start));o.scale.setScalar(Math.max(.001,1-t));if(o.traverse)o.traverse(n=>{if(n.material){n.material.transparent=true;n.material.opacity=1-t;}});}
      if(item.age>=item.life){this.scene.remove(o);o.traverse?.(n=>{n.geometry?.dispose?.();});this.items.splice(i,1);}
    }
  }
  clear(){for(const it of this.items){this.scene.remove(it.object);it.object.traverse?.(n=>n.geometry?.dispose?.());}this.items.length=0;}
}
