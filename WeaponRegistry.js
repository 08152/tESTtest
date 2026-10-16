import * as BoneSMG from './Waffe_Knochenknacker.js';
import * as HadesHook from './Waffe_HadesHaken.js';
import * as StakeRifle from './Waffe_HolzpflockGewehr.js';
import * as BoneGatling from './Waffe_KnochenGatling.js';
import * as HeavyAR from './Waffe_SchweresSturmgewehr.js';
import * as GhostBlade from './Waffe_GhostfaceKlinge.js';
export const WEAPONS = [BoneSMG,HadesHook,StakeRifle,BoneGatling,HeavyAR,GhostBlade];
export const WEAPON_BY_ID = Object.fromEntries(WEAPONS.map(m=>[m.WEAPON_DATA.id,m]));
export function getWeapon(id){return WEAPON_BY_ID[id]||null;}
