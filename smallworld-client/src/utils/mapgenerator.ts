import type { Cell } from "../types/cell";
import type { Region } from "../types/region";
import { LAND_TERRAINS } from "../types/terrain";
import type { Terrain } from "../types/terrain";

const BOARD_SIZE = 20;

const shuffle = <T,>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array; // return the shuffled array
};

// hex neighbors
const neighbors = (r: number, c: number): [number, number][] => {
  const offsets =
    r % 2 === 0
      ? [
          [-1, 0],
          [-1, -1],
          [0, -1],
          [0, 1],
          [1, 0],
          [1, -1],
        ]
      : [
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, 0],
          [1, 1],
        ];
  return offsets
    .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
    .filter(([nr, nc]) => nr >= 0 && nc >= 0 && nr < BOARD_SIZE && nc < BOARD_SIZE);
};

export const createBoard = (): { board: Cell[][]; regions: Region[] } => {
  const board: Cell[][] = Array.from({ length: BOARD_SIZE }, (_, r) =>
    Array.from({ length: BOARD_SIZE }, (_, c) => ({
      id: r * BOARD_SIZE + c,
      terrain: "water" as Terrain, // default terrain
      regionId: -1,
    }))
  );

  const regions: Region[] = [];
  let nextRegionId = 1;

  // flood-fill land regions
  for (let r = 1; r < BOARD_SIZE - 1; r++) {
    for (let c = 1; c < BOARD_SIZE - 1; c++) {
      if (board[r][c].regionId !== -1) continue;
      

      const regionSize = 3 + Math.floor(Math.random() * 3); // 6–8
      const terrain = LAND_TERRAINS[Math.floor(Math.random() * LAND_TERRAINS.length)];
      const regionCells: [number, number][] = [];

      const frontier: [number, number][] = [[r, c]];
      while (frontier.length && regionCells.length < regionSize) {
        const [cr, cc] = frontier.pop()!;
        if (board[cr][cc].regionId !== -1) continue;
        board[cr][cc].terrain = terrain;
        board[cr][cc].regionId = nextRegionId;
        regionCells.push([cr, cc]);

        shuffle(neighbors(cr, cc)).forEach((n) => frontier.push(n));
      }

      if (regionCells.length >= 3) {
        // only accept regions >= 3 cells
        regions.push({ id: nextRegionId++, terrain, cells: regionCells });
      } else {
        // reset small patches back to water
        regionCells.forEach(([rr, cc]) => {
          board[rr][cc].terrain = "water";
          board[rr][cc].regionId = -1;
        });
      }
    }
  }

  return { board, regions };
};
