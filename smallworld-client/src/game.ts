import type { Game } from 'boardgame.io';
import type { Cell } from './types/cell';
import type { Region } from './types/region';
import { createHexBoard } from './utils/hexBoard';

export interface GameState {
  board: Cell[][];
  regions: Region[];
}

export const SmallWorldGame: Game<GameState> = {
  setup: () => {
    const { board, regions } = createHexBoard();
    return { board, regions };
  },
  moves: {
    selectCell: ({ G }, row: number, col: number) => {
      const cell = G.board[row][col];
      cell.border = !cell.border;
    },
  },
};

export default SmallWorldGame;
