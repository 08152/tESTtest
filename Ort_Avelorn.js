import { buildDistrict } from './WorldTools.js';
export function createAvelorn(scene, poi) { return buildDistrict(scene, poi, { count: 12, minWidth: 10, maxWidth: 18, minDepth: 12, maxDepth: 20, minHeight: 7, maxHeight: 14, palette: [0xb6a271,0x8c8e5b,0x97855b,0x6d8052], roofColor:0x604b35, road:0x8e815c, farm:true, vines:true, labelColor:'#f8e3a1' }); }
