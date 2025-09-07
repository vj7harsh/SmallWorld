import { useEffect, useMemo, useState } from "react";
import IrregularHexRegions from "./IrregularHexRegions";

type MapCfg = { radius: number; density: number; smooth: number; size: number; seed: number };

interface SetupPageProps {
  ws: WebSocket;
  roomId: string;
  playerName: string;
  onStart: (map: MapCfg) => void;
}

export default function SetupPage({ ws, roomId, playerName, onStart }: SetupPageProps) {
  const [players, setPlayers] = useState<string[]>([]);
  const [host, setHost] = useState<string | undefined>(undefined);
  const [map, setMap] = useState<MapCfg>({ radius: 10, density: 0.46, smooth: 2, size: 24, seed: 12345 });
  const [started, setStarted] = useState(false);

  const isHost = useMemo(() => host === playerName, [host, playerName]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "state") {
          setPlayers(data.players || []);
          setHost(data.host);
          if (data.map) setMap(data.map);
          if (data.started) setStarted(true);
        }
      } catch {}
    };
    ws.addEventListener("message", handler);
    return () => ws.removeEventListener("message", handler);
  }, [ws]);

  useEffect(() => {
    if (started && map) onStart(map);
  }, [started]);

  const updateMap = (partial: Partial<MapCfg>) => {
    if (!isHost) return;
    const next = { ...map, ...partial };
    setMap(next);
    ws.send(
      JSON.stringify({ type: "set_config", roomId, playerName, map: next })
    );
  };

  const startGame = () => {
    if (!isHost) return;
    // Ensure latest config is saved before starting
    ws.send(JSON.stringify({ type: "set_config", roomId, playerName, map }));
    ws.send(JSON.stringify({ type: "start", roomId, playerName }));
  };

  return (
    <div className="w-full h-screen flex">
      {/* Sidebar - players and controls */}
      <aside className="w-72 shrink-0 h-full p-5 flex flex-col gap-4 border-r bg-gray-100/70 dark:bg-neutral-900/60">
        <h2 className="font-semibold text-lg">Setup: {roomId}</h2>
        <div className="text-sm">You are: <b>{playerName}</b> {isHost && <span className="opacity-70">(Host)</span>}</div>
        <div>
          <h3 className="font-semibold text-sm mb-1">Players</h3>
          <ul className="list-disc ml-5 text-sm">
            {players.map((p) => (
              <li key={p}>{p}{p === host ? " (Host)" : ""}</li>
            ))}
          </ul>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <label className="text-sm">Radius: {map.radius}</label>
          <input type="range" min={4} max={18} value={map.radius} onChange={(e) => updateMap({ radius: parseInt(e.target.value, 10) })} disabled={!isHost} />
          <label className="text-sm">Density: {map.density.toFixed(2)}</label>
          <input type="range" min={0} max={1} step={0.01} value={map.density} onChange={(e) => updateMap({ density: parseFloat(e.target.value) })} disabled={!isHost} />
          <label className="text-sm">Smooth: {map.smooth}</label>
          <input type="range" min={0} max={5} value={map.smooth} onChange={(e) => updateMap({ smooth: parseInt(e.target.value, 10) })} disabled={!isHost} />
        </div>

        <button onClick={startGame} className="mt-auto px-4 py-2 rounded bg-black/80 text-white text-sm disabled:opacity-50" disabled={!isHost}>
          Start Game
        </button>
      </aside>

      {/* Map preview */}
      <main className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-neutral-800">
        <div className="w-full max-w-4xl p-6">
          <div className="relative h-[420px] w-full rounded-xl border shadow-md bg-white/80 dark:bg-neutral-900/70 overflow-hidden">
            <div className="absolute inset-0">
              <IrregularHexRegions
                radius={map.radius}
                density={map.density}
                smooth={map.smooth}
                size={map.size}
                seed={map.seed}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
