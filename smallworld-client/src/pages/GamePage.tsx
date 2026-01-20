/**
 * Game Page Component
 *
 * The main game interface displayed after the host starts the game.
 * Renders the game board and shows current player information.
 *
 * Currently a basic implementation that:
 * - Displays the procedurally generated hex map
 * - Shows the player list with their races
 * - Maintains WebSocket connection for future game state updates
 *
 * Layout:
 * - Left sidebar: Current player info, player list, leave button
 * - Main area: The game board (hex map)
 *
 * WebSocket:
 * - Reconnects to the room to receive ongoing state updates
 * - Sends 'join' message to rejoin (allows reconnection after disconnect)
 */

import { useEffect, useState } from 'react';
import HexMap from '../components/IrregularHexRegions';
import type { MapConfig, Player } from '../types';
import { WS_URL } from '../config';

/**
 * Props for the GamePage component
 */
interface GamePageProps {
  /** The room ID for the game */
  roomId: string;
  /** The current player's display name */
  playerName: string;
  /** The current player's UUID */
  playerId: string;
  /** The map configuration for rendering the game board */
  map: MapConfig;
  /** Callback when the player leaves the game */
  onLeave: () => void;
}

/**
 * GamePage - Main game interface after the game has started
 *
 * @param props - Component props with game state and callbacks
 * @returns The rendered game page component
 */
export default function GamePage({ roomId, playerName, playerId, map, onLeave }: GamePageProps) {
  /** List of players in the game */
  const [players, setPlayers] = useState<Player[]>([]);

  /** Whether the WebSocket connection is active */
  const [connected, setConnected] = useState(false);

  /**
   * Effect: Establish WebSocket connection for game updates
   *
   * Connects to the game server and rejoins the room to receive
   * ongoing state updates. This allows players to reconnect after
   * a page refresh or temporary disconnect.
   */
  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    /**
     * Handle WebSocket open
     * Sends join message to rejoin the room
     */
    ws.onopen = () => {
      setConnected(true);
      // Rejoin the room to get state updates
      ws.send(JSON.stringify({ type: 'join', roomId, playerName, playerId }));
    };

    /**
     * Handle incoming WebSocket messages
     * Updates player list when receiving state updates
     */
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'state') {
          setPlayers(data.players || []);
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };

    /**
     * Handle WebSocket close
     * Updates connection status for UI feedback
     */
    ws.onclose = () => setConnected(false);

    /**
     * Handle WebSocket errors
     * Updates connection status for UI feedback
     */
    ws.onerror = () => setConnected(false);

    // Cleanup: Close WebSocket when component unmounts
    return () => ws.close();
  }, [roomId, playerName, playerId]);

  /** Find the current player's data from the player list */
  const currentPlayer = players.find((p) => p.name === playerName);

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar - Contains player info and controls */}
      <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col">
        {/* Header with room ID and connection status */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">Game Room</h1>
          <p className="text-sm text-slate-500 mt-1 font-mono">{roomId}</p>
          {/* Connection status indicator */}
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-sm text-slate-500">
              {connected ? 'Connected' : 'Reconnecting...'}
            </span>
          </div>
        </div>

        {/* Current player information card */}
        <div className="p-4 bg-blue-50 rounded-lg mb-6">
          <p className="text-sm text-blue-600 font-medium">You are</p>
          <p className="text-lg font-bold text-blue-800">{playerName}</p>
          {/* Display selected race if available */}
          {currentPlayer?.race && (
            <p className="text-sm text-blue-600">{currentPlayer.race}</p>
          )}
        </div>

        {/* Player list */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
            Players
          </h3>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.name}
                className={`p-3 rounded-lg ${
                  player.name === playerName ? 'bg-blue-100 border border-blue-200' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Player name with "(You)" indicator */}
                  <span className="font-medium text-slate-800">
                    {player.name}
                    {player.name === playerName && ' (You)'}
                  </span>
                  {/* Player's race selection */}
                  <span className="text-sm text-slate-500">{player.race || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game controls (placeholder for future game actions) */}
        <div className="mt-auto pt-6 space-y-3">
          <p className="text-sm text-slate-400 text-center">Game in progress...</p>
          {/* Leave game button */}
          <button
            onClick={onLeave}
            className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition"
          >
            Leave Game
          </button>
        </div>
      </aside>

      {/* Main content area - Game board */}
      <main className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Procedurally generated hex map as the game board */}
          <HexMap
            radius={map.radius}
            density={map.density}
            smooth={map.smooth}
            size={map.size}
            seed={map.seed}
          />
        </div>
      </main>
    </div>
  );
}
