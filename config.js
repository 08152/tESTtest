export const GAME_CONFIG = {
  title: 'ISLAND SHOOTER — HALLOWEEN PROTOTYP',
  mapSize: 3000,
  islandRadius: 1450,
  terrainSegments: 108,
  playerHeight: 1.75,
  walkSpeed: 40,
  sprintSpeed: 66,
  jumpSpeed: 17,
  gravity: 32,
  fallDamage: false,
  startingHealth: 100,
  startingShield: 0,
  ghostfaceHealth: 850,
  ghostfaceMarkRange: 10,
  ghostfaceBladeDamageToPlayer: 15,
  ghostfaceBladeDamageToEnemies: 80,
  lootPickupRange: 8,
  weaponDropDistance: 3.2,
  droppedItemLifetime: 0,
  propsShrinkSeconds: 2.8,
  rarityOrder: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
  rarity: {
    common:    { label: 'Gewöhnlich', color: 0xb8c2cc, multiplier: 1.00 },
    uncommon:  { label: 'Ungewöhnlich', color: 0x63cf7b, multiplier: 1.08 },
    rare:      { label: 'Selten', color: 0x5ca7ff, multiplier: 1.17 },
    epic:      { label: 'Episch', color: 0xb57aff, multiplier: 1.28 },
    legendary: { label: 'Legendär', color: 0xffc64d, multiplier: 1.42 }
  },
  // Externe Dateien werden direkt über URLs geladen. Wenn ein Server sie blockiert,
  // läuft das Spiel mit den eingebauten Materialien und synthetischen Sounds weiter.
  externalTextures: {
    grass: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r165/examples/textures/terrain/grasslight-big.jpg',
    brick: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r165/examples/textures/brick_diffuse.jpg',
    wood: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r165/examples/textures/hardwood2_diffuse.jpg'
  },
  externalSounds: {
    // Beispiel für einen extern geladenen CC0-Sound. Die anderen Spiel-Sounds werden
    // leichtgewichtig per Web Audio erzeugt und können hier später ersetzt werden.
    ghostfaceAlert: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3'
  },
  pois: [
    { id: 'Noxhaven', name: 'Noxhaven', biome: 'Haunted City', x: -330, z: 250, size: 150, kind: 'haunted' },
    { id: 'Nexora', name: 'Nexora', biome: 'City', x: 230, z: -150, size: 180, kind: 'city' },
    { id: 'Kravent', name: 'Kravent', biome: 'Industry', x: 680, z: -190, size: 155, kind: 'industry' },
    { id: 'DravikPort', name: 'Dravik-Port', biome: 'Coast', x: -500, z: -820, size: 170, kind: 'port' },
    { id: 'Cryndor', name: 'Cryndor', biome: 'Snow', x: 710, z: -740, size: 145, kind: 'snow' },
    { id: 'Avelorn', name: 'Avelorn', biome: 'Fields', x: -730, z: 500, size: 155, kind: 'fields' },
    { id: 'Zarkora', name: 'Zarkora', biome: 'Desert', x: 720, z: 670, size: 165, kind: 'desert' },
    { id: 'Myrvessa', name: 'Myrvessa', biome: 'Forest', x: -820, z: -360, size: 145, kind: 'forest' },
    { id: 'Marivex', name: 'Marivex', biome: 'Coast', x: 210, z: 1030, size: 140, kind: 'coast' },
    { id: 'Valkryss', name: 'Valkryss', biome: 'Snow', x: 1040, z: -450, size: 100, kind: 'snow' },
    { id: 'Veltrix', name: 'Veltrix', biome: 'City', x: 480, z: 35, size: 100, kind: 'citySmall' },
    { id: 'DraxenWerke', name: 'Draxen-Werke', biome: 'Industry', x: 900, z: 50, size: 95, kind: 'industrySmall' },
    { id: 'BraydenFields', name: 'Brayden Fields', biome: 'Fields', x: -490, z: 760, size: 100, kind: 'fieldsSmall' },
    { id: 'VeyronSand', name: 'Veyron-Sand', biome: 'Desert', x: 1040, z: 850, size: 100, kind: 'desertSmall' },
    { id: 'Solvaya', name: 'Solvaya', biome: 'Coast', x: -100, z: 1150, size: 100, kind: 'coastSmall' }
  ]
};
