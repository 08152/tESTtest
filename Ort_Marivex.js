import { buildDistrict } from './WorldTools.js';
export function createMarivex(scene, poi) { return buildDistrict(scene, poi, { count: 8, minWidth: 10, maxWidth: 20, minDepth: 10, maxDepth: 20, minHeight: 6, maxHeight: 13, palette: [0x4d737b,0x678985,0x8c9a8b,0x637477], roofColor:0x324951, road:0x6f7770, palms:true, vines:true, labelColor:'#c7fff5' }); }
