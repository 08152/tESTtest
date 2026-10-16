import { createWeaponModel } from './WeaponModels.js';
export const WEAPON_DATA = {
  id:'stakeRifle', name:'Holzpflock-Gewehr', short:'Pflock-Gewehr', icon:'🪵', category:'Präzisionswaffe', magazine:5, reserve:35,
  fireInterval:1.35, reloadDuration:2.8, range:1000, automatic:false, aimable:true, reloadStyle:'stake-bundle', raritySpawn:['rare','epic','legendary'],
  damage:{ common:{body:76,head:125}, uncommon:{body:83,head:138}, rare:{body:91,head:151}, epic:{body:100,head:168}, legendary:{body:112,head:190} },
  description:'Langsam, weitreichend und stark. Beim Schuss öffnet sich die Klappe und Funken erscheinen.'
};
export const createViewModel = () => createWeaponModel(WEAPON_DATA.id,{withHands:true});
export const createWorldModel = () => createWeaponModel(WEAPON_DATA.id,{world:true});
export function animateWeapon(parts, state, time) {
  if(parts.hatch){const target=state==='firing'?-.9:state==='reloading'&&time%2<.8?-.65:0;parts.hatch.rotation.x+=(target-parts.hatch.rotation.x)*.22;}
  if(parts.stakeBundle) parts.stakeBundle.visible=state==='reloading';
}
