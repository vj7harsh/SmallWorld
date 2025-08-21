import React from 'react';
import Cell from './Cell';
import './Board.css';
import type { Region } from '../types/region';

// Layout map: 0 represents sea, numbers map to region ids
const BOARD_LAYOUT: number[][] = [
  [0, 0, 0, 0, 0],
  [0, 1, 1, 2, 0],
  [0, 3, 1, 2, 0],
  [0, 3, 3, 2, 0],
  [0, 0, 0, 0, 0],
];

const INITIAL_REGIONS: Region[] = [
  { id: 1, terrain: 'forest', occupied: false },
  { id: 2, terrain: 'hill', occupied: false },
  { id: 3, terrain: 'mountain', occupied: false },
];

const Board: React.FC = () => {
  const [regions, setRegions] = React.useState<Region[]>(INITIAL_REGIONS);
  const [selected, setSelected] = React.useState<Region | null>(null);

  const handleCellClick = (row: number, col: number) => {
    const regionId = BOARD_LAYOUT[row][col];
    if (!regionId) {
      setSelected({ id: 0, terrain: 'water', occupied: false });
      return;
    }

    setRegions(prev => {
      const updated = prev.map(r =>
        r.id === regionId ? { ...r, occupied: !r.occupied } : r
      );
      setSelected(updated.find(r => r.id === regionId) || null);
      return updated;
    });
  };

  return (
    <div className="board-container">
      <div className="board">
        {BOARD_LAYOUT.map((rowData, row) => (
          <div className="board-row" key={row}>
            {rowData.map((regionId, col) => {
              const region = regions.find(r => r.id === regionId);
              return (
                <Cell
                  key={col}
                  terrain={region ? region.terrain : 'water'}
                  occupied={region ? region.occupied : false}
                  onClick={() => handleCellClick(row, col)}
                />
              );
            })}
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

