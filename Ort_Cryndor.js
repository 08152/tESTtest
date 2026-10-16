import { buildDistrict } from './WorldTools.js';
export function createCryndor(scene, poi) { return buildDistrict(scene, poi, { count: 12, minWidth: 11, maxWidth: 20, minDepth: 11, maxDepth: 19, minHeight: 8, maxHeight: 20, palette: [0xc1d7e1,0x7899ab,0x92afc1,0x536c7d], roofColor:0x31495f, road:0x607b89, crystals:true, vines:true, labelColor:'#def7ff' }); }
