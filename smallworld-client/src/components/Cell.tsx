import React from "react";
import "../components/Board.css";
import type { Terrain } from "../types/terrain";

interface CellProps {
  terrain: Terrain;
  occupiedBy?: number;
  onClick: () => void;
  border?: boolean;
}

const Cell: React.FC<CellProps> = ({ terrain, occupiedBy, onClick, border }) => {
  return (
    <div
      className={`cell ${terrain} ${border ? "border" : ""} ${occupiedBy ? "occupied" : ""}`}
      onClick={onClick}
    >
      {occupiedBy ? "🏰" : terrain[0].toUpperCase()}
    </div>
  );
};

export default Cell;
