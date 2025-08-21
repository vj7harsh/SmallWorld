import React from 'react';
import './Board.css';
import type { Terrain } from '../types/terrain';

interface CellProps {
  terrain: Terrain;
  occupied: boolean;
  onClick: () => void;
}

const Cell: React.FC<CellProps> = ({ terrain, occupied, onClick }) => {
  return (
    <div
      className={`cell ${terrain} ${occupied ? 'occupied' : ''}`}
      onClick={onClick}
    >
      {occupied ? '🏰' : terrain[0].toUpperCase()}
    </div>
  );
};

export default Cell;
