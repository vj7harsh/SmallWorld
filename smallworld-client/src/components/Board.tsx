import React from 'react';
import Cell from './Cell';
import './Board.css';
import type { Region } from '../types/region';
import type { Terrain } from '../types/terrain';
import { LAND_TERRAINS } from '../types/terrain';

const BOARD_SIZE = 5;

const shuffle = <T,>(array: T[]): void => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

const createBoard = (): Region[][] => {
  const total = BOARD_SIZE * BOARD_SIZE;
  const waterCount = Math.floor(total * 0.3);
  const landCount = total - waterCount;

  // ensure at least two cells for each land terrain
  const base = 2;
  const counts = LAND_TERRAINS.map(() => base);
  let remaining = landCount - base * LAND_TERRAINS.length;
  while (remaining > 0) {
    counts[Math.floor(Math.random() * LAND_TERRAINS.length)]++;
    remaining--;
  }

  const terrainPool: Terrain[] = counts.flatMap((count, idx) =>
    Array(count).fill(LAND_TERRAINS[idx])
  );
  shuffle(terrainPool);

  const positions = Array.from({ length: total }, (_, i) => i);
  shuffle(positions);
  const waterSet = new Set(positions.slice(0, waterCount));

  const board: Region[][] = [];
  let id = 1;
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: Region[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      const index = r * BOARD_SIZE + c;
      if (waterSet.has(index)) {
        row.push({ id: id++, terrain: 'water', occupied: false });
      } else {
        const terrain = terrainPool.pop()!;
        row.push({ id: id++, terrain, occupied: false });
      }
    }
    board.push(row);
  }
  return board;
};

const Board: React.FC = () => {
  const [board, setBoard] = React.useState<Region[][]>(createBoard());
  const [selected, setSelected] = React.useState<Region | null>(null);

  const handleCellClick = (row: number, col: number) => {
    setBoard(prev => {
      const updated = prev.map(r => r.slice());
      const region = updated[row][col];
      const toggled = { ...region, occupied: !region.occupied };
      updated[row][col] = toggled;
      setSelected(toggled);
      return updated;
    });
  };

  return (
    <div className="board-container">
      <div className="board">
        {board.map((rowData, row) => (
          <div className="board-row" key={row}>
            {rowData.map((region, col) => (
              <Cell
                key={region.id}
                terrain={region.terrain}
                occupied={region.occupied}
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
