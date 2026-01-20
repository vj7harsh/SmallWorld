import React from "react";

type MapCfg = { radius: number; density: number; smooth: number; size: number; seed: number };
type Player = { name: string; race?: string };

interface SetupSidebarProps {
  roomId: string;
  playerName: string;
  players: Player[];
  isHost: boolean;
  hostName?: string;
  map: MapCfg;
  onChangeMap: (partial: Partial<MapCfg>) => void;
  onStart: () => void;
}

export default function SetupSidebar({
  roomId,
  playerName,
  players,
  isHost,
  hostName,
  map,
  onChangeMap,
  onStart,
}: SetupSidebarProps) {
  const resolvedHost = hostName;

  return (
    <aside className="shrink-0 h-full p-5 flex flex-col gap-4 bg-gray-100/70 dark:bg-neutral-900/60 border border-black">
      <h2 className="font-semibold text-lg">Room ID: {roomId}</h2>
      <>
        You: <b>{playerName}</b> {isHost && <span className="opacity-70">(Host)</span>}
      </>

      <>
        <h3 className="font-semibold text-sm mb-1">Players</h3>
        <ul className="list-unstyled m-0 p-0 text-sm">
          {players.map((p) => (
            <li key={p.name} className="py-1">
              {p.name}
              {resolvedHost && p.name === resolvedHost ? " (Host)" : ""}
            </li>
          ))}
        </ul>
      </>

      <div className="mt-2 d-flex flex-column gap-3">
        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0" style={{ width: 90 }}>Radius</label>
          <input
            type="range"
            className="form-range flex-grow-1"
            min={4}
            max={18}
            value={map.radius}
            onChange={(e) => onChangeMap({ radius: parseInt(e.target.value, 10) })}
            disabled={!isHost}
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0" style={{ width: 90 }}>Density</label>
          <input
            type="range"
            className="form-range flex-grow-1"
            min={0}
            max={1}
            step={0.01}
            value={map.density}
            onChange={(e) => onChangeMap({ density: parseFloat(e.target.value) })}
            disabled={!isHost}
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0" style={{ width: 90 }}>Smooth</label>
          <input
            type="range"
            className="form-range flex-grow-1"
            min={0}
            max={5}
            value={map.smooth}
            onChange={(e) => onChangeMap({ smooth: parseInt(e.target.value, 10) })}
            disabled={!isHost}
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0" style={{ width: 90 }}>Tile Size</label>
          <input
            type="range"
            className="form-range flex-grow-1"
            min={12}
            max={48}
            step={1}
            value={map.size}
            onChange={(e) => onChangeMap({ size: parseInt(e.target.value, 10) })}
            disabled={!isHost}
          />
        </div>
      </div>
      {!isHost && <div className="text-xs opacity-70">Only host can change map.</div>}

      <button onClick={onStart} className="btn btn-dark mt-auto" disabled={!isHost}>
        Start Game
      </button>
    </aside>
  );
}
