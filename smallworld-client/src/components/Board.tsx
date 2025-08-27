import type { Cell } from "../types/cell";
import type { Region } from "../types/region";
import { LAND_TERRAINS } from "../types/terrain";
import type { Terrain } from "../types/terrain";

const BOARD_SIZE = 20;
const REGION_COUNT = 30;

// Manhattan distance (for Voronoi partitioning)
const manhattan = (r1: number, c1: number, r2: number, c2: number): number =>
  Math.abs(r1 - r2) + Math.abs(c1 - c2);

// Orthogonal neighbors for border detection
const orthNeighbors = (r: number, c: number): [number, number][] => {
  const offsets = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
  ];
  return offsets
    .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
    .filter(([nr, nc]) => nr >= 0 && nc >= 0 && nr < BOARD_SIZE && nc < BOARD_SIZE);
};

export const createBoard = (): { board: Cell[][]; regions: Region[] } => {
  // Step 1: Init board
  const board: Cell[][] = Array.from({ length: BOARD_SIZE }, (_, r) =>
    Array.from({ length: BOARD_SIZE }, (_, c) => ({
      id: r * BOARD_SIZE + c,
      terrain: "unassigned" as Terrain,
      regionId: -1,
      border: false, // new flag
    }))
  );

  // Step 2: Pick seeds
  const seeds: [number, number, number][] = [];
  let nextId = 1;
  while (seeds.length < REGION_COUNT) {
    const r = Math.floor(Math.random() * BOARD_SIZE);
    const c = Math.floor(Math.random() * BOARD_SIZE);
    if (seeds.some(([sr, sc]) => sr === r && sc === c)) continue;
    seeds.push([r, c, nextId++]);
  }

  // Step 3: Voronoi partition
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      let bestSeed = seeds[0];
      let bestDist = manhattan(r, c, bestSeed[0], bestSeed[1]);
      for (let s = 1; s < seeds.length; s++) {
        const [sr, sc, id] = seeds[s];
        const dist = manhattan(r, c, sr, sc);
        if (dist < bestDist) {
          bestDist = dist;
          bestSeed = seeds[s];
        }
      }
      board[r][c].regionId = bestSeed[2];
    }
  }

  // Step 4: Collect regions & assign terrains
  const regions: Region[] = [];
  for (let id = 1; id <= REGION_COUNT; id++) {
    const terrain = LAND_TERRAINS[Math.floor(Math.random() * LAND_TERRAINS.length)];
    const cells: [number, number][] = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c].regionId === id) {
          board[r][c].terrain = terrain;
          cells.push([r, c]);
        }
      }
    }

    if (cells.length) {
      regions.push({ id, terrain, cells });
    }
  }

  // Step 5: Mark borders
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const regionId = board[r][c].regionId;
      for (const [nr, nc] of orthNeighbors(r, c)) {
        if (board[nr][nc].regionId !== regionId) {
          board[r][c].border = true;
          break;
        }
      }
    }
  }

  return { board, regions };
};
