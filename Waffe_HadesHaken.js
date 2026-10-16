import { createWeaponModel } from './WeaponModels.js';
export const WEAPON_DATA = {
  id:'hadesHook', name:'Hades-Haken', short:'Hades-Haken', icon:'⛓', category:'Kettenhaken', magazine:1, reserve:12,
  fireInterval:1.05, reloadDuration:1.45, range:10, automatic:false, aimable:false, reloadStyle:'hook-swap', ability:'chain-pull', raritySpawn:['rare','epic','legendary'],
  damage:{ common:{body:22,head:30}, uncommon:{body:24,head:33}, rare:{body:26,head:36}, epic:{body:29,head:40}, legendary:{body:32,head:44} },
  description:'Kettenhaken mit 10 m Aktionsbereich. Rechtsklick aktiviert den Zugmodus; Linksklick zielt auf einen Gegner.'
};
export const createViewModel = () => createWeaponModel(WEAPON_DATA.id,{withHands:true});
export const createWorldModel = () => createWeaponModel(WEAPON_DATA.id,{world:true});
export function animateWeapon(parts, state, time) {
  if(parts.chain) parts.chain.forEach((link,i)=>{link.position.x=Math.sin(time*8+i*.65)*.012;});
  if(parts.hook && state==='firing') parts.hook.position.z=-.58-Math.sin(time*14)*.25;
}
