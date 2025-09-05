import type { Cell } from "../types/cell";
import type { Region } from "../types/region";
import type { Terrain } from "../types/terrain";

const HEX_ROWS: Terrain[][] = [
  ["forest", "hill", "mountain"],
  ["plains", "forest", "hill", "mountain"],
  ["forest", "hill", "mountain", "plains", "forest"],
  ["hill", "mountain", "plains", "forest"],
  ["mountain", "plains", "forest"],
];

export const createHexBoard = (): { board: Cell[][]; regions: Region[] } => {
  const board: Cell[][] = [];
  const regions: Region[] = [];
  let id = 0;

  HEX_ROWS.forEach((row, rIdx) => {
    const rowCells: Cell[] = [];
    row.forEach((terrain, cIdx) => {
      id += 1;
      rowCells.push({ id, terrain, regionId: id, border: false });
      regions.push({ id, terrain, cells: [[rIdx, cIdx]] });
    });
    board.push(rowCells);
  });

  return { board, regions };
};

