import { createWeaponModel } from './WeaponModels.js';
export const WEAPON_DATA = {
  id:'boneGatling', name:'Knochen-Gatling', short:'Knochen-Gatling', icon:'💀', category:'Schwere Waffe', magazine:150, reserve:450,
  fireInterval:.064, reloadDuration:3.5, range:260, automatic:true, aimable:false, reloadStyle:'belt-feed', raritySpawn:['epic','legendary'],
  damage:{ common:{body:5,head:8}, uncommon:{body:5.5,head:8.5}, rare:{body:6,head:9}, epic:{body:6.5,head:10}, legendary:{body:7,head:11} },
  description:'Mehrere normale Metallläufe. Jeder zehnte Schuss erzeugt zusätzlich einen Knochen, der kurz im Boden bleibt.'
};
export const createViewModel = () => createWeaponModel(WEAPON_DATA.id,{withHands:true});
export const createWorldModel = () => createWeaponModel(WEAPON_DATA.id,{world:true});
export function animateWeapon(parts, state, time, firing=false) {
  if(parts.barrelRotor) parts.barrelRotor.rotation.z += firing ? .68 : .03;
  if(parts.belt) parts.belt.forEach((link,i)=>{link.position.x=((i*.045+time*(firing?2.6:.08))%0.3);});
}
