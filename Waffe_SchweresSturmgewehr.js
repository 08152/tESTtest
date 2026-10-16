import { createWeaponModel } from './WeaponModels.js';
export const WEAPON_DATA = {
  id:'heavyAR', name:'Schweres Sturmgewehr', short:'Schweres SG', icon:'◉', category:'Sturmgewehr', magazine:24, reserve:144,
  fireInterval:.29, reloadDuration:2.05, range:650, automatic:true, aimable:true, reloadStyle:'mag-push', raritySpawn:['common','uncommon','rare','epic','legendary'],
  damage:{ common:{body:25,head:41}, uncommon:{body:27,head:45}, rare:{body:29,head:49}, epic:{body:32,head:54}, legendary:{body:35,head:60} },
  description:'Langsamere Feuerrate, hoher Schaden für mittlere und weite Entfernung, Rotpunktvisier.'
};
export const createViewModel = () => createWeaponModel(WEAPON_DATA.id,{withHands:true});
export const createWorldModel = () => createWeaponModel(WEAPON_DATA.id,{world:true});
export function animateWeapon(parts, state, time) {
  if(parts.magazine && state==='reloading') parts.magazine.position.y=-.22+Math.sin(time*5)*.12;
}
