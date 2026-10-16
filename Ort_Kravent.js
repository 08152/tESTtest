import { buildDistrict } from './WorldTools.js';
export function createKravent(scene, poi) { return buildDistrict(scene, poi, { count: 18, minWidth: 18, maxWidth: 35, minDepth: 18, maxDepth: 34, minHeight: 11, maxHeight: 34, palette: [0x50565d,0x6b6b66,0x5c6268,0x8d7659], roofColor:0x353a40, road:0x35373a, decor:'industrial', crates:true, tower:true, vines:true, labelColor:'#f9d49a' }); }
