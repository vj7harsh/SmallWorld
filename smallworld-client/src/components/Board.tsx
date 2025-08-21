import React from 'react';
import Cell from './Cell';
import './Board.css';

const BOARD_SIZE = 5; // temporary board size

const Board: React.FC = () => {
  const rows = Array.from({ length: BOARD_SIZE }, (_, row) => (
    <div className="board-row" key={row}>
      {Array.from({ length: BOARD_SIZE }, (_, col) => (
        <Cell key={col} row={row} col={col} />
      ))}
    </div>
  ));

  return <div className="board">{rows}</div>;
};

export default Board;
