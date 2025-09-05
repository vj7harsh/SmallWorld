import React from "react";
import Cell from "./Cell";
import type { GameState } from "../game";
import "./Board.css";

interface BoardProps {
  G: GameState;
  moves: { selectCell: (row: number, col: number) => void };
}

const Board: React.FC<BoardProps> = ({ G, moves }) => {
  const { board } = G;

  return (
    <div className="board-container">
      <div className="board">
        {board.map((row, r) => (
          <div key={r} className="board-row">
            {row.map((cell, c) => (
              <Cell
                key={cell.id}
                terrain={cell.terrain}
                occupiedBy={cell.occupiedBy}
                border={cell.border}
                onClick={() => moves.selectCell(r, c)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Board;
