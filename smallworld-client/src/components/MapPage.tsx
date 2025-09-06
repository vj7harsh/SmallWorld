import { useState } from "react";
import IrregularHexRegions from "./IrregularHexRegions";

interface MapPageProps {
  players: number;
  mode: "create" | "join";
}

export default function MapPage({ players, mode }: MapPageProps) {
  const [radius, setRadius] = useState(8 + players); // scale with players
  const [density, setDensity] = useState(0.46);
  const [smooth, setSmooth] = useState(2);
  const [size, setSize] = useState(24);
  const [seed, setSeed] = useState(12345);

  return (
    <div className="w-full h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 p-4 flex flex-col gap-4 border-r bg-gray-100 dark:bg-neutral-900">
        <h2 className="font-semibold text-lg">Game Setup ({mode})</h2>

        <label>Radius</label>
        <input
          type="range"
          min={4}
          max={18}
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value, 10))}
        />

        <label>Density</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={density}
          onChange={(e) => setDensity(parseFloat(e.target.value))}
        />

        <label>Smooth</label>
        <input
          type="range"
          min={0}
          max={5}
          value={smooth}
          onChange={(e) => setSmooth(parseInt(e.target.value, 10))}
        />
      </aside>

      {/* Map area */}
      <main className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-neutral-800">
        <div className="w-full h-full max-w-5xl p-4">
          <div className="relative w-full h-0 pb-[70%] rounded-xl border shadow-md bg-white/80 dark:bg-neutral-900/70 overflow-hidden">
            <div className="absolute inset-0">
              <IrregularHexRegions
                radius={radius}
                density={density}
                smooth={smooth}
                size={size}
                seed={seed}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
