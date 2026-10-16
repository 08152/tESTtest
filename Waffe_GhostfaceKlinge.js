import { createWeaponModel } from './WeaponModels.js';
export const WEAPON_DATA = {
  id:'ghostBlade', name:'Ghostface-Klinge', short:'Geisterklinge', icon:'✦', category:'Boss-Beute', magazine:1, reserve:1,
  fireInterval:.66, reloadDuration:0, range:3.2, automatic:false, aimable:false, reloadStyle:'melee', ability:'mark-enemies', raritySpawn:['legendary'],
  damage:{ common:{body:58,head:80}, uncommon:{body:62,head:86}, rare:{body:67,head:92}, epic:{body:73,head:100}, legendary:{body:80,head:110} },
  description:'Nahkampf. Rechtsklick markiert Gegner in einem Umkreis von 10 m.'
};
export const createViewModel = () => createWeaponModel(WEAPON_DATA.id,{withHands:true});
export const createWorldModel = () => createWeaponModel(WEAPON_DATA.id,{world:true});
export function animateWeapon(parts, state, time) {
  if(parts.ghostBlade) parts.ghostBlade.rotation.z=state==='firing'?Math.sin(time*18)*.55:Math.sin(time*2)*.018;
}
