export type Terrain =
  | 'forest'
  | 'hill'
  | 'mountain'
  | 'plains'
  | 'swamp'
  | 'water';

export const LAND_TERRAINS: Terrain[] = [
  'forest',
  'hill',
  'mountain',
  'plains',
  'swamp',
];

export const TERRAINS: Terrain[] = [...LAND_TERRAINS, 'water'];
