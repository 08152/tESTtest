import { buildDistrict } from './WorldTools.js';
export function createMyrvessa(scene, poi) { return buildDistrict(scene, poi, { count: 8, minWidth: 9, maxWidth: 17, minDepth: 9, maxDepth: 17, minHeight: 5, maxHeight: 10, palette: [0x625746,0x564b3e,0x76694f,0x4b5944], roofColor:0x353f31, road:0x3b4235, decor:'haunted', vines:true, labelColor:'#c6f2d3' }); }
