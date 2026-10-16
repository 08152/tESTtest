import { buildDistrict } from './WorldTools.js';
export function createZarkora(scene, poi) { return buildDistrict(scene, poi, { count: 10, minWidth: 13, maxWidth: 22, minDepth: 12, maxDepth: 21, minHeight: 5, maxHeight: 15, palette: [0xa36a3d,0xb6844f,0x7b5537,0xc19a65], roofColor:0x67482e, road:0x8c643d, decor:'industrial', labelColor:'#ffce98' }); }
