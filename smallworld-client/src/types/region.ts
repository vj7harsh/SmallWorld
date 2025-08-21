import type { Terrain } from './terrain';

export interface Region {
  id: number;
  terrain: Terrain;
  occupied: boolean;
}
