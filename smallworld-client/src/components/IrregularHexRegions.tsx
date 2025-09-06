import { useMemo, useState, type PointerEvent } from "react";

// Irregular map made of hex tiles, grouped into contiguous hex regions (not a fixed outer shape)
// - Uses axial coords (pointy-top)
// - Procedural generation via simple cellular-automata smoothing over random noise
// - Finds connected components to form "regions" and colors them distinctly
//
// Controls:
// - Radius: size of the candidate field (larger => more possible tiles)
// - Density: initial chance a tile is present before smoothing
// - Smooth: number of smoothing passes (higher => chunkier blobs)
// - Shuffle: reseed the generator to get a new shape

const SQRT3 = Math.sqrt(3);

// Axial → pixel for POINTY-TOP hexes
function axialToPixel(q: number, r: number, size: number) {
  const x = size * SQRT3 * (q + r / 2);
  const y = size * (3 / 2) * r;
  return { x, y };
}

// Pointy-top axial neighbors
const AXIAL_NEI: [number, number][] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

function hexCorners(cx: number, cy: number, size: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = ((60 * i - 30) * Math.PI) / 180; // pointy-top
    pts.push([cx + size * Math.cos(angle), cy + size * Math.sin(angle)]);
  }
  return pts;
}

function formatPoints(points: [number, number][]) {
  return points.map((p) => p.join(",")).join(" ");
}

function tileKey(q: number, r: number) {
  return `${q},${r}`;
}

// Simple seeded RNG (Mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build candidate axial coords within a big hex radius
function buildAxialField(radius: number) {
  const out: { q: number; r: number }[] = [];
  for (let q = -radius; q <= radius; q++) {
    const rMin = Math.max(-radius, -q - radius);
    const rMax = Math.min(radius, -q + radius);
    for (let r = rMin; r <= rMax; r++) out.push({ q, r });
  }
  return out;
}

// Cellular automata style smoothing
function smoothPresence(
  present: Set<string>,
  candidates: { q: number; r: number }[],
  passes: number,
  threshold = 3
) {
  let cur = new Set(present);
  for (let p = 0; p < passes; p++) {
    const next = new Set<string>();
    for (const { q, r } of candidates) {
      let cnt = 0;
      for (const [dq, dr] of AXIAL_NEI) {
        const k = tileKey(q + dq, r + dr);
        if (cur.has(k)) cnt++;
      }
      const k = tileKey(q, r);
      // keep if enough neighbors or already present with some support
      if (cnt >= threshold || (cur.has(k) && cnt >= 2)) next.add(k);
    }
    cur = next;
  }
  return cur;
}

// Connected components over the kept tiles
function computeRegions(kept: Set<string>) {
  const regions: string[][] = [];
  const seen = new Set<string>();
  for (const k of kept) {
    if (seen.has(k)) continue;
    const [q0, r0] = k.split(",").map(Number);
    const comp: string[] = [];
    const q: [number, number][] = [[q0, r0]];
    seen.add(k);
    while (q.length) {
      const [qv, rv] = q.pop()!;
      const kv = tileKey(qv, rv);
      comp.push(kv);
      for (const [dq, dr] of AXIAL_NEI) {
        const kn = tileKey(qv + dq, rv + dr);
        if (kept.has(kn) && !seen.has(kn)) {
          seen.add(kn);
          q.push([qv + dq, rv + dr]);
        }
      }
    }
    regions.push(comp);
  }
  return regions;
}

function hslFor(i: number) {
  const hue = (i * 53) % 360; // pseudo-random spread
  return {
    fill: `hsl(${hue} 70% 52%)`,
    stroke: `hsl(${hue} 65% 36%)`,
  };
}

export default function IrregularHexRegions() {
  const [radius, setRadius] = useState(8); // candidate field radius
  const [size, setSize] = useState(24); // tile pixel radius
  const [density, setDensity] = useState(0.46); // initial random fill
  const [smooth, setSmooth] = useState(2); // smoothing passes
  const [seed, setSeed] = useState(12345);
  const [hovered, setHovered] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1); // svg zoom level
  const [pan, setPan] = useState({ x: 0, y: 0 }); // svg pan offset
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  // Build candidates and random initial presence using the RNG (stable per seed)
  const { items, keptSet } = useMemo(() => {
    const candidates = buildAxialField(radius);

    // random initial presence
    // generate deterministic pseudo-random per tile by hashing coords with seed
    const present = new Set<string>();
    for (const { q, r } of candidates) {
      // mix seed with coordinates (simple integer hash)
      const h = ((q * 73856093) ^ (r * 19349663) ^ seed) >>> 0;
      const rr = mulberry32(h)();
      if (rr < density) present.add(tileKey(q, r));
    }

    const kept = smoothPresence(present, candidates, smooth, 3);
    const items = [...kept].map((k) => {
      const [q, r] = k.split(",").map(Number);
      const { x, y } = axialToPixel(q, r, size);
      return { q, r, x, y, k };
    });

    return { items, keptSet: kept };
  }, [radius, size, density, smooth, seed]);

  // Connected components => regions
  const regions = useMemo(() => computeRegions(keptSet), [keptSet]);

  // Compute viewBox from kept tiles only
  const layout = useMemo(() => {
    if (items.length === 0) return { minX: 0, minY: 0, width: 0, height: 0 };
    const padding = size * 2;
    const xs = items.flatMap((it) => [it.x - size, it.x + size]);
    const ys = items.flatMap((it) => [it.y - size, it.y + size]);
    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }, [items, size]);

  const center = useMemo(
    () => ({
      x: layout.minX + layout.width / 2,
      y: layout.minY + layout.height / 2,
    }),
    [layout]
  );

  const shuffle = () => setSeed((s) => (s * 1664525 + 1013904223) >>> 0);
  const zoomIn = () => setZoom((z) => Math.min(z * 1.25, 4));
  const zoomOut = () => setZoom((z) => Math.max(z / 1.25, 0.5));

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    setPointer({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!pointer) return;
    const dx = e.clientX - pointer.x;
    const dy = e.clientY - pointer.y;
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    setPointer({ x: e.clientX, y: e.clientY });
  };

  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    setPointer(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="w-screen h-screen p-4 box-border flex flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm opacity-80">Radius</label>
          <input
            type="range"
            min={4}
            max={18}
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value, 10))}
          />
          <span className="text-sm tabular-nums w-8 text-center">{radius}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm opacity-80">Tile size</label>
          <input
            type="range"
            min={14}
            max={56}
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value, 10))}
          />
          <span className="text-sm tabular-nums w-10 text-center">{size}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm opacity-80">Density</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={density}
            onChange={(e) => setDensity(parseFloat(e.target.value))}
          />
          <span className="text-sm tabular-nums w-12 text-center">{density.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm opacity-80">Smooth</label>
          <input
            type="range"
            min={0}
            max={5}
            value={smooth}
            onChange={(e) => setSmooth(parseInt(e.target.value, 10))}
          />
          <span className="text-sm tabular-nums w-6 text-center">{smooth}</span>
        </div>
        <button
          onClick={shuffle}
          className="ml-auto px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 ring-1 ring-black/10 text-sm"
        >
          Shuffle
        </button>
      </div>

      <div className="relative w-full grow rounded-2xl bg-neutral-900/5 dark:bg-neutral-800/40 ring-1 ring-black/5 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox={`${layout.minX} ${layout.minY} ${layout.width} ${layout.height}`}
          role="img"
          aria-label="Irregular hex regions"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{ touchAction: "none", cursor: pointer ? "grabbing" : zoom !== 1 ? "grab" : "default" }}
        >
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.25" />
            </filter>
          </defs>

          <g transform={`translate(${pan.x} ${pan.y}) translate(${center.x} ${center.y}) scale(${zoom}) translate(${-center.x} ${-center.y})`}>
            {regions.map((comp, idx) => {
              const { fill, stroke } = hslFor(idx);
              return (
                <g key={`reg-${idx}`} filter="url(#shadow)">
                  {comp.map((k) => {
                    const it = items.find((t) => t.k === k)!;
                    const pts = formatPoints(hexCorners(it.x, it.y, size));
                    const isHovered = hovered === k;
                    return (
                      <polygon
                        key={k}
                        points={pts}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={1.25}
                        style={{ cursor: "pointer", opacity: isHovered ? 0.85 : 1, transition: "opacity 120ms linear" }}
                        onMouseEnter={() => setHovered(k)}
                        onMouseLeave={() => setHovered(null)}
                      />
                    );
                  })}
                </g>
              );
            })}
          </g>
        </svg>
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button
            onClick={zoomIn}
            className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 ring-1 ring-black/10"
          >
            +
          </button>
          <button
            onClick={zoomOut}
            className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 ring-1 ring-black/10"
          >
            -
          </button>
        </div>
      </div>

      <div className="text-xs opacity-70 space-y-1">
        <p>
          This generator creates an <b>irregular map</b> by randomly selecting tiles within a large
          axial field and then smoothing via a simple cellular-automata rule. Afterward, contiguous
          components are detected to form <b>regions</b>, each colored differently.
        </p>
        <p>
          Tips: Increase <b>Smooth</b> for chunkier landmasses; tweak <b>Density</b> to control land/water
          ratio. Hit <b>Shuffle</b> for a fresh world using a new seed.
        </p>
      </div>

      <div className="text-xs opacity-70 grid grid-cols-2 gap-2">
        <div>
          Regions: <span className="font-medium">{regions.length}</span>
        </div>
        <div>
          Tiles: <span className="font-medium">{items.length}</span>
        </div>
      </div>
    </div>
  );
}
