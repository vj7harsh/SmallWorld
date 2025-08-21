import React from 'react';
import Cell from './Cell';
import './Board.css';
import { TERRAINS } from '../types/terrain';
import type { Region } from '../types/region';

const BOARD_SIZE = 5; // temporary board size

const generateBoard = (): Region[][] =>
  Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      terrain: TERRAINS[Math.floor(Math.random() * TERRAINS.length)],
      occupied: false,
    }))
  );

const Board: React.FC = () => {
  const [board, setBoard] = React.useState<Region[][]>(generateBoard);
  const [selected, setSelected] = React.useState<Region | null>(null);

  const handleCellClick = (row: number, col: number) => {
    setBoard(prev =>
      prev.map((r, rIdx) =>
        r.map((cell, cIdx) => {
          if (rIdx === row && cIdx === col) {
            const updated = { ...cell, occupied: !cell.occupied };
            setSelected(updated);
            return updated;
          }
          return cell;
        })
      )
    );
  };

  return (
    <div className="board-container">
      <div className="board">
        {board.map((rowData, row) => (
          <div className="board-row" key={row}>
            {rowData.map((cell, col) => (
              <Cell
                key={col}
                terrain={cell.terrain}
                occupied={cell.occupied}
                onClick={() => handleCellClick(row, col)}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="region-info">
        {selected
          ? `Terrain: ${selected.terrain}, Occupied: ${selected.occupied ? 'Yes' : 'No'}`
          : 'Click a region to see details.'}
      </div>
    </div>
  );
};

export default Board;
