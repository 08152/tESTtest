import { buildDistrict } from './WorldTools.js';
export function createDravikPort(scene, poi) { return buildDistrict(scene, poi, { count: 17, minWidth: 14, maxWidth: 28, minDepth: 15, maxDepth: 30, minHeight: 9, maxHeight: 28, palette: [0x586874,0x3d5963,0x69777b,0x55545a], roofColor:0x303c42, road:0x41444a, decor:'industrial', ship:true, crates:true, vines:true, labelColor:'#aeeaf5' }); }
