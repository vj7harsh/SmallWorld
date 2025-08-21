import React from "react";
import Cell from "./Cell";
import "./Board.css";
import { createBoard } from "../utils/mapgenerator";
import type { Cell as CellType } from "../types/cell";
import type { Region } from "../types/region";

const Board: React.FC = () => {
  const [board, setBoard] = React.useState<CellType[][]>([]);
  const [regions, setRegions] = React.useState<Region[]>([]);
  const [selected, setSelected] = React.useState<CellType | null>(null);

  React.useEffect(() => {
    const { board, regions } = createBoard();
    setBoard(board);
    setRegions(regions);
  }, []);

  const handleCellClick = (row: number, col: number) => {
    setBoard((prev) => {
      const updated = prev.map((r) => r.slice());
      const cell = updated[row][col];
      const toggled = { ...cell, occupiedBy: cell.occupiedBy ? undefined : 1 };
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
            {rowData.map((cell, col) => (
              <Cell
                key={cell.id}
                terrain={cell.terrain}
                occupiedBy={cell.occupiedBy}
                onClick={() => handleCellClick(row, col)}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="region-info">
        {selected
          ? `Terrain: ${selected.terrain}, Region: ${selected.regionId}, Occupied: ${
              selected.occupiedBy ? "Yes" : "No"
            }`
          : "Click a region to see details."}
      </div>
    </div>
  );
};

export default Board;
