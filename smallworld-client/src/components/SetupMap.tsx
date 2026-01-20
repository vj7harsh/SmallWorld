import React from "react";
import IrregularHexRegions from "./IrregularHexRegions";

type MapCfg = { radius: number; density: number; smooth: number; size: number; seed: number };

interface SetupMapProps {
  map: MapCfg;
}

export default function SetupMap({ map }: SetupMapProps) {
  return (
    <div className="w-full h-full flex items-stretch bg-gray-50 dark:bg-neutral-800">
      <div className="w-full h-full p-4">
        <div className="relative h-full w-full rounded-xl border shadow-md bg-white/80 dark:bg-neutral-900/70 overflow-hidden">
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
    </div>
  );
}
