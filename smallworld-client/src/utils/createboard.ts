import type { Cell } from "../types/cell";
import type { Region } from "../types/region";
import { REGIONS, BOARD_SIZE } from "../maps/defMap";

export const createFixedBoard = (): { board: Cell[][]; regions: Region[] } => {
  // start with water everywhere
  const board: Cell[][] = Array.from({ length: BOARD_SIZE }, (_, r) =>
    Array.from({ length: BOARD_SIZE }, (_, c) => ({
      id: r * BOARD_SIZE + c,
      terrain: "water",
      regionId: -1,
    }))
  );

  // assign each region’s terrain + cells
  REGIONS.forEach(region => {
    region.cells.forEach(([r, c]) => {
      board[r][c].terrain = region.terrain;
      board[r][c].regionId = region.id;
    });
  });

  return { board, regions: REGIONS };
};
