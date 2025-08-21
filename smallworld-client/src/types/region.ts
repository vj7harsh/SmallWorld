import type { Terrain } from './terrain';

export interface Region {
  terrain: Terrain;
  occupied: boolean;
}
