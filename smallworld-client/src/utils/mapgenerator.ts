import type { Cell } from "../types/cell";
import type { Region } from "../types/region";
import { LAND_TERRAINS } from "../types/terrain";
import type { Terrain } from "../types/terrain";

const BOARD_SIZE = 20;
const REGION_COUNT = 30;
const MIN_REGION_SIZE = 5;
const MAX_REGION_SIZE = 30;

// Orthogonal neighbors used for expansion and border detection
const orthNeighbors = (r: number, c: number): [number, number][] => {
  const offsets = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  return offsets
    .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
    .filter(
      ([nr, nc]) => nr >= 0 && nc >= 0 && nr < BOARD_SIZE && nc < BOARD_SIZE,
    );
};

// Orthogonal neighbors used for border detection
const orthNeighbors = (r: number, c: number): [number, number][] => {
  const offsets = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  return offsets
    .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
    .filter(
      ([nr, nc]) => nr >= 0 && nc >= 0 && nr < BOARD_SIZE && nc < BOARD_SIZE,
    );
};

export const createBoard = (): { board: Cell[][]; regions: Region[] } => {
  // Step 1: Init board with water
  const board: Cell[][] = Array.from({ length: BOARD_SIZE }, (_, r) =>
    Array.from({ length: BOARD_SIZE }, (_, c) => ({
      id: r * BOARD_SIZE + c,
      terrain: "water" as Terrain,
      regionId: -1,
      border: false,
    }))
  );

  const regions: Region[] = [];

  // Step 2: Grow regions randomly
  for (let id = 1; id <= REGION_COUNT; id++) {
    // Find a random water cell to start this region
    let seedR = -1;
    let seedC = -1;
    let attempts = 0;
    while (attempts < 1000) {
      const r = Math.floor(Math.random() * BOARD_SIZE);
      const c = Math.floor(Math.random() * BOARD_SIZE);
      if (board[r][c].terrain === "water") {
        seedR = r;
        seedC = c;
        break;
      }
      attempts++;
    }
    if (seedR === -1) break; // no space left

    const terrain =
      LAND_TERRAINS[Math.floor(Math.random() * LAND_TERRAINS.length)];
    const cells: [number, number][] = [];

    const queue: [number, number][] = [[seedR, seedC]];
    board[seedR][seedC].terrain = terrain;
    board[seedR][seedC].regionId = id;
    cells.push([seedR, seedC]);

    const targetSize =
      Math.floor(
        Math.random() * (MAX_REGION_SIZE - MIN_REGION_SIZE + 1),
      ) + MIN_REGION_SIZE;

    while (queue.length && cells.length < targetSize) {
      const [cr, cc] = queue.shift()!;
      for (const [nr, nc] of orthNeighbors(cr, cc)) {
        if (cells.length >= targetSize) break;
        if (board[nr][nc].terrain !== "water") continue;
        if (Math.random() < 0.5) {
          board[nr][nc].terrain = terrain;
          board[nr][nc].regionId = id;
          cells.push([nr, nc]);
          queue.push([nr, nc]);
        }
      }
    }

    regions.push({ id, terrain, cells });
  }

  // Step 3: Mark borders between regions and water
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const regionId = board[r][c].regionId;
      if (regionId === -1) continue;
      for (const [nr, nc] of orthNeighbors(r, c)) {
        if (board[nr][nc].regionId !== regionId) {
          board[r][c].border = true;
          break;
        }
      }
    }
  }

  // Step 5: Mark borders between regions
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
