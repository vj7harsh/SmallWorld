import React from 'react';
import './Board.css';
import type { Terrain } from '../types/terrain';

interface CellProps {
  terrain: Terrain;
}

const Cell: React.FC<CellProps> = ({ terrain }) => {
  return <div className={`cell ${terrain}`}>{terrain[0].toUpperCase()}</div>;
};

export default Cell;
