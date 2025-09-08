import { useEffect, useMemo, useState } from "react";
import IrregularHexRegions from "./IrregularHexRegions";

type MapCfg = { radius: number; density: number; smooth: number; size: number; seed: number };
type Player = { name: string; race?: string };

interface SetupPageProps {
  ws: WebSocket;
  roomId: string;
  playerName: string;
  onStart: (map: MapCfg) => void;
}

export default function SetupPage({ ws, roomId, playerName, onStart }: SetupPageProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [host, setHost] = useState<string | undefined>(undefined);
  const [map, setMap] = useState<MapCfg>({ radius: 10, density: 0.46, smooth: 2, size: 24, seed: 12345 });
  const [started, setStarted] = useState(false);

  // Allow controls before first state arrives by assuming creator is host
  const isHost = useMemo(() => (host ? host === playerName : true), [host, playerName]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "state") {
          setPlayers((data.players || []) as Player[]);
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
          <div className="flex flex-col gap-2 text-sm">
            {players.map((p) => (
              <div key={p.name} className="flex items-center justify-between gap-2">
                <div>
                  {p.name}
                  {p.name === host ? " (Host)" : ""}
                </div>
                <div className="flex items-center gap-2">
                  {p.name === playerName ? (
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={p.race || ""}
                      onChange={(e) =>
                        ws.send(
                          JSON.stringify({
                            type: "set_race",
                            roomId,
                            playerName,
                            race: e.target.value || undefined,
                          })
                        )
                      }
                    >
                      <option value="">Pick race…</option>
                      <option value="Humans">Humans</option>
                      <option value="Elves">Elves</option>
                      <option value="Orcs">Orcs</option>
                      <option value="Dwarves">Dwarves</option>
                      <option value="Undead">Undead</option>
                    </select>
                  ) : (
                    <span className="opacity-80">{p.race || "—"}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <label className="text-sm">Radius: {map.radius}</label>
          <input type="range" min={4} max={18} value={map.radius} onChange={(e) => updateMap({ radius: parseInt(e.target.value, 10) })} disabled={!isHost} />
          <label className="text-sm">Density: {map.density.toFixed(2)}</label>
          <input type="range" min={0} max={1} step={0.01} value={map.density} onChange={(e) => updateMap({ density: parseFloat(e.target.value) })} disabled={!isHost} />
          <label className="text-sm">Smooth: {map.smooth}</label>
          <input type="range" min={0} max={5} value={map.smooth} onChange={(e) => updateMap({ smooth: parseInt(e.target.value, 10) })} disabled={!isHost} />
          <label className="text-sm">Tile Size: {map.size}px</label>
          <input type="range" min={12} max={48} step={1} value={map.size} onChange={(e) => updateMap({ size: parseInt(e.target.value, 10) })} disabled={!isHost} />
        </div>
        {!isHost && (
          <div className="text-xs opacity-70">Only host can change map.</div>
        )}

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
