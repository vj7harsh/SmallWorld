import React from 'react';
import Cell from './Cell';
import './Board.css';
import { TERRAINS } from '../types/terrain';
import type { Terrain } from '../types/terrain';

const BOARD_SIZE = 5; // temporary board size

const generateBoard = (): Terrain[][] =>
  Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () =>
      TERRAINS[Math.floor(Math.random() * TERRAINS.length)]
    )
  );

const Board: React.FC = () => {
  const board = React.useMemo<Terrain[][]>(generateBoard, []);

  return (
    <div className="board">
      {board.map((rowData, row) => (
        <div className="board-row" key={row}>
          {rowData.map((terrain, col) => (
            <Cell key={col} terrain={terrain} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;
