import { createWeaponModel } from './WeaponModels.js';
export const WEAPON_DATA = {
  id:'boneSMG', name:'Knochenknacker-MP', short:'Knochen-MP', icon:'☠', category:'Maschinenpistole', magazine:40, reserve:240,
  fireInterval:.082, reloadDuration:1.75, range:230, automatic:true, aimable:true, reloadStyle:'magazine-drop', raritySpawn:['common','uncommon','rare','epic','legendary'],
  damage:{ common:{body:7,head:11}, uncommon:{body:7.5,head:12}, rare:{body:8,head:13}, epic:{body:8.5,head:14}, legendary:{body:9,head:15} },
  description:'Schnelle Feuerrate, niedriger Schaden, Knochen bewegen sich beim Laufen.'
};
export const createViewModel = () => createWeaponModel(WEAPON_DATA.id,{withHands:true});
export const createWorldModel = () => createWeaponModel(WEAPON_DATA.id,{world:true});
export function animateWeapon(parts, state, time) {
  if(parts.bones) parts.bones.forEach((b,i)=>{b.rotation.z=Math.sin(time*5+i*1.9)*.09;});
  if(parts.magazine && state==='reloading') parts.magazine.rotation.x=Math.sin(time*13)*.12;
}
