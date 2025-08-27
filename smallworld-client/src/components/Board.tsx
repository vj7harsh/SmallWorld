import React, { useEffect, useState } from "react";
import Cell from "./Cell";
import type { Cell as CellType } from "../types/cell";
import { createBoard } from "../utils/mapgenerator";
import "./Board.css";

const Board: React.FC = () => {
  const [board, setBoard] = useState<CellType[][]>([]);

  useEffect(() => {
    const { board } = createBoard();
    setBoard(board);
  }, []);

  const handleCellClick = (regionId: number) => {
    // Placeholder for interaction logic
    console.log(`Clicked region ${regionId}`);
  };

  return (
    <div className="board-container">
      <div className="board">
        {board.map((row, r) => (
          <div key={r} className="board-row">
            {row.map((cell) => (
              <Cell
                key={cell.id}
                terrain={cell.terrain}
                occupiedBy={cell.occupiedBy}
                border={cell.border}
                onClick={() => handleCellClick(cell.regionId)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Board;
