import type { Terrain } from "./terrain";

export interface Cell {
  id: number;
  terrain: Terrain;
  regionId: number;
  occupiedBy?: number;
}
