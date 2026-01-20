/**
 * Map Controls Component
 *
 * Provides sliders for configuring the procedurally generated hex map.
 * Only the host can modify these settings; for other players, the controls
 * are disabled and display a message.
 *
 * Configuration Parameters:
 * - Radius: Size of the hex grid (4-18) - larger = bigger map
 * - Density: Initial fill probability (0-1) - higher = more land
 * - Smoothing: Cellular automata passes (0-5) - more = smoother regions
 * - Tile Size: Pixel size per hex (12-48) - larger = bigger visual tiles
 *
 * Used in: LobbyPage
 *
 * The changes are applied in real-time to the map preview, giving
 * immediate visual feedback as the host adjusts settings.
 */

import type { MapConfig } from '../types';

/**
 * Props for the MapControls component
 */
interface MapControlsProps {
  /** Current map configuration values */
  map: MapConfig;
  /** Callback when any configuration value changes */
  onChange: (partial: Partial<MapConfig>) => void;
  /** Whether the controls are disabled (true for non-host players) */
  disabled?: boolean;
}

/**
 * MapControls - Sliders for configuring procedural map generation
 *
 * Renders a set of range sliders for adjusting map generation parameters.
 * Each slider shows its current value and updates the map in real-time.
 *
 * @param props - Component props with current values, change handler, and disabled state
 * @returns The rendered map controls component
 *
 * @example
 * ```tsx
 * <MapControls
 *   map={{ radius: 10, density: 0.46, smooth: 2, size: 24, seed: 123 }}
 *   onChange={(partial) => updateMapConfig(partial)}
 *   disabled={!isHost}
 * />
 * ```
 */
export default function MapControls({ map, onChange, disabled }: MapControlsProps) {
  return (
    <div className="space-y-4">
      {/* Section header */}
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Map Settings</h3>

      <div className="space-y-3">
        {/* Radius slider - Controls overall map size */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="text-slate-700">Radius</label>
            <span className="text-slate-500">{map.radius}</span>
          </div>
          <input
            type="range"
            min={4}
            max={18}
            value={map.radius}
            onChange={(e) => onChange({ radius: parseInt(e.target.value, 10) })}
            disabled={disabled}
            className="w-full"
          />
        </div>

        {/* Density slider - Controls initial fill probability for land generation */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="text-slate-700">Density</label>
            <span className="text-slate-500">{map.density.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={map.density}
            onChange={(e) => onChange({ density: parseFloat(e.target.value) })}
            disabled={disabled}
            className="w-full"
          />
        </div>

        {/* Smoothing slider - Controls cellular automata smoothing passes */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="text-slate-700">Smoothing</label>
            <span className="text-slate-500">{map.smooth}</span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            value={map.smooth}
            onChange={(e) => onChange({ smooth: parseInt(e.target.value, 10) })}
            disabled={disabled}
            className="w-full"
          />
        </div>

        {/* Tile Size slider - Controls visual size of each hex tile */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="text-slate-700">Tile Size</label>
            <span className="text-slate-500">{map.size}px</span>
          </div>
          <input
            type="range"
            min={12}
            max={48}
            value={map.size}
            onChange={(e) => onChange({ size: parseInt(e.target.value, 10) })}
            disabled={disabled}
            className="w-full"
          />
        </div>
      </div>

      {/* Message shown to non-host players */}
      {disabled && (
        <p className="text-xs text-slate-400 italic">Only the host can change map settings</p>
      )}
    </div>
  );
}
