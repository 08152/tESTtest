import { buildDistrict } from './WorldTools.js';
export function createSidePOI(scene, poi) {
  const color = poi.biome === 'Snow' ? [0x97b6c7,0xbad1da] : poi.biome === 'Desert' ? [0xb47b4b,0x8f5d3a] : poi.biome === 'Industry' ? [0x66696b,0x464e53] : poi.biome === 'City' ? [0x637280,0x4d5967] : [0x9a8c63,0x6e7951];
  return buildDistrict(scene, poi, { count: 5, minWidth: 8, maxWidth: 15, minDepth: 8, maxDepth: 15, minHeight: 5, maxHeight: 18, palette: color, roofColor:0x3a424c, road:0x464747, vines:true, labelColor:'#e8e5d8' });
}
