import React from 'react';
import './Board.css';

interface CellProps {
  row: number;
  col: number;
}

const Cell: React.FC<CellProps> = ({ row, col }) => {
  return <div className="cell">{row},{col}</div>;
};

export default Cell;
