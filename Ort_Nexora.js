import { buildDistrict } from './WorldTools.js';
export function createNexora(scene, poi) { return buildDistrict(scene, poi, { count: 26, minWidth: 17, maxWidth: 29, minDepth: 16, maxDepth: 30, minHeight: 25, maxHeight: 74, palette: [0x697886,0x566578,0x727f8c,0x434e61], roofColor:0x303d4b, road:0x252d38, glow:true, windowColor:0x84baca, vines:true, labelColor:'#d2edff' }); }
