import type { Region } from "../types/region";

export const BOARD_SIZE = 20;

export const REGIONS: Region[] = [
  // Left continent (12 regions)
  { id: 1, terrain: "forest", cells: [[2,2],[2,3],[3,2],[3,3],[4,2],[4,3],[5,2],[5,3]] },
  { id: 2, terrain: "hill", cells: [[2,5],[2,6],[3,5],[3,6],[4,5],[4,6],[5,5],[5,6]] },
  { id: 3, terrain: "mountain", cells: [[6,2],[6,3],[7,2],[7,3],[8,2],[8,3],[9,2],[9,3]] },
  { id: 4, terrain: "plains", cells: [[6,5],[6,6],[7,5],[7,6],[8,5],[8,6],[9,5],[9,6]] },
  { id: 5, terrain: "forest", cells: [[10,2],[10,3],[11,2],[11,3],[12,2],[12,3],[13,2],[13,3]] },
  { id: 6, terrain: "hill", cells: [[10,5],[10,6],[11,5],[11,6],[12,5],[12,6],[13,5],[13,6]] },
  { id: 7, terrain: "mountain", cells: [[14,2],[14,3],[15,2],[15,3],[16,2],[16,3],[17,2],[17,3]] },
  { id: 8, terrain: "plains", cells: [[14,5],[14,6],[15,5],[15,6],[16,5],[16,6],[17,5],[17,6]] },
  { id: 9, terrain: "forest", cells: [[2,8],[2,9],[3,8],[3,9],[4,8],[4,9]] },
  { id: 10, terrain: "hill", cells: [[6,8],[6,9],[7,8],[7,9],[8,8],[8,9]] },
  { id: 11, terrain: "mountain", cells: [[10,8],[10,9],[11,8],[11,9],[12,8],[12,9]] },
  { id: 12, terrain: "plains", cells: [[14,8],[14,9],[15,8],[15,9],[16,8],[16,9]] },

  // Right continent (13 regions)
  { id: 13, terrain: "forest", cells: [[2,13],[2,14],[3,13],[3,14],[4,13],[4,14]] },
  { id: 14, terrain: "hill", cells: [[6,13],[6,14],[7,13],[7,14],[8,13],[8,14]] },
  { id: 15, terrain: "mountain", cells: [[10,13],[10,14],[11,13],[11,14],[12,13],[12,14]] },
  { id: 16, terrain: "plains", cells: [[14,13],[14,14],[15,13],[15,14],[16,13],[16,14]] },
  { id: 17, terrain: "forest", cells: [[2,16],[2,17],[3,16],[3,17],[4,16],[4,17]] },
  { id: 18, terrain: "hill", cells: [[6,16],[6,17],[7,16],[7,17],[8,16],[8,17]] },
  { id: 19, terrain: "mountain", cells: [[10,16],[10,17],[11,16],[11,17],[12,16],[12,17]] },
  { id: 20, terrain: "plains", cells: [[14,16],[14,17],[15,16],[15,17],[16,16],[16,17]] },
  { id: 21, terrain: "forest", cells: [[5,18],[6,18],[7,18],[8,18]] },
  { id: 22, terrain: "hill", cells: [[9,18],[10,18],[11,18],[12,18]] },
  { id: 23, terrain: "mountain", cells: [[13,18],[14,18],[15,18]] },
  { id: 24, terrain: "plains", cells: [[16,18],[17,18],[18,18]] },
  { id: 25, terrain: "forest", cells: [[12,16],[13,16],[13,17],[12,17]] }
];
