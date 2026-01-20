/**
 * Player List Component
 *
 * Displays a list of players in the game room with their status.
 * Shows each player's:
 * - Ready status indicator (green dot = ready, gray = not ready)
 * - Player name with host badge if applicable
 * - Race selection (dropdown for current player, text for others)
 *
 * Used in: LobbyPage
 *
 * Interaction:
 * - Current player can select their race from a dropdown
 * - Other players' races are displayed as read-only text
 */

import type { Player } from '../types';

/** Available races for selection in the game */
const RACES = ['Humans', 'Elves', 'Orcs', 'Dwarves', 'Undead'];

/**
 * Props for the PlayerList component
 */
interface PlayerListProps {
  /** Array of players in the room */
  players: Player[];
  /** Name of the current player (for enabling race selection) */
  currentPlayer: string;
  /** Name of the host player (to show host badge) */
  host?: string;
  /** Callback when the current player changes their race selection */
  onRaceChange?: (race: string) => void;
}

/**
 * PlayerList - Displays all players in a room with their status and race
 *
 * Renders a list showing each player's:
 * - Ready status (green/gray indicator dot)
 * - Name with "(Host)" badge for the host
 * - Race selection (dropdown for current player, text for others)
 *
 * @param props - Component props containing player data and callbacks
 * @returns The rendered player list component
 *
 * @example
 * ```tsx
 * <PlayerList
 *   players={[{ name: 'Alice', race: 'Elves', ready: true }]}
 *   currentPlayer="Alice"
 *   host="Alice"
 *   onRaceChange={(race) => handleRaceChange(race)}
 * />
 * ```
 */
export default function PlayerList({ players, currentPlayer, host, onRaceChange }: PlayerListProps) {
  return (
    <div className="space-y-2">
      {/* Section header */}
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Players</h3>

      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.name}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
          >
            {/* Left side: Ready indicator and player name */}
            <div className="flex items-center gap-3">
              {/* Ready status indicator dot */}
              <span
                className={`w-3 h-3 rounded-full ${player.ready ? 'bg-emerald-500' : 'bg-slate-300'}`}
                title={player.ready ? 'Ready' : 'Not ready'}
              />
              {/* Player name with optional host badge */}
              <span className="font-medium text-slate-800">
                {player.name}
                {player.name === host && (
                  <span className="ml-2 text-xs text-amber-600 font-semibold">(Host)</span>
                )}
              </span>
            </div>

            {/* Right side: Race selection or display */}
            <div>
              {/* Current player gets a dropdown to select race */}
              {player.name === currentPlayer && onRaceChange ? (
                <select
                  value={player.race || ''}
                  onChange={(e) => onRaceChange(e.target.value)}
                  className="text-sm border border-slate-300 rounded px-2 py-1 bg-white"
                >
                  <option value="">Select Race</option>
                  {RACES.map((race) => (
                    <option key={race} value={race}>
                      {race}
                    </option>
                  ))}
                </select>
              ) : (
                /* Other players show their race as text */
                <span className="text-sm text-slate-500">{player.race || '—'}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
