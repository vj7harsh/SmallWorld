import { useEffect, useState } from "react";
import IrregularHexRegions from "./IrregularHexRegions";

type MapCfg = { radius: number; density: number; smooth: number; size: number; seed: number };

interface GamePageProps {
  ws: WebSocket;
  roomId: string;
  playerName: string;
  map?: MapCfg; // optional: if provided, render the fixed map too
}

export default function GamePage({ ws, roomId, playerName, map }: GamePageProps) {
  const [players, setPlayers] = useState<string[]>([]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "players") {
          setPlayers(data.players);
        }
      } catch {}
    };
    ws.addEventListener("message", handler);
    return () => ws.removeEventListener("message", handler);
  }, [ws]);

  return (
    <div className="w-full h-screen flex">
      {/* Sidebar - player list */}
      <aside className="w-72 shrink-0 h-full p-4 flex flex-col gap-3 border-r bg-gray-100 dark:bg-neutral-900">
        <h2 className="font-semibold text-lg">Room: {roomId}</h2>
        <div className="text-sm">You are: <b>{playerName}</b></div>
        <div className="mt-2">
          <h3 className="font-semibold text-sm">Players</h3>
          <ul className="list-disc ml-5 text-sm">
            {players.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main area: optionally render the fixed map if provided */}
      <main className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-neutral-800">
        {map ? (
          <div className="w-full max-w-4xl p-6">
            <div className="relative h-[460px] w-full rounded-xl border shadow-md bg-white/80 dark:bg-neutral-900/70 overflow-hidden">
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
        ) : (
          <div className="text-sm opacity-70">Waiting to start…</div>
        )}
      </main>
    </div>
  );
}
