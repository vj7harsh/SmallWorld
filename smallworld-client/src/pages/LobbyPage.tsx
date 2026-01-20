/**
 * Lobby Page Component
 *
 * The pre-game lobby where players wait before the game starts.
 * Players can:
 * - See other players in the room
 * - Select their race
 * - Mark themselves as ready
 * - Host can configure the map and start the game
 *
 * Layout:
 * - Left sidebar: Room info, player list, ready button, map controls (host), start button
 * - Main area: Live map preview with current configuration
 *
 * WebSocket Communication:
 * - Sends: set_config (host), set_race, set_ready, start (host)
 * - Receives: state updates with player list, map config, started flag
 */

import { useState, useEffect } from 'react';
import { useGameSocket } from '../hooks/useGameSocket';
import PlayerList from '../components/PlayerList';
import MapControls from '../components/MapControls';
import HexMap from '../components/IrregularHexRegions';
import type { MapConfig } from '../types';

/**
 * Props for the LobbyPage component
 */
interface LobbyPageProps {
  /** The room ID for the game */
  roomId: string;
  /** The current player's display name */
  playerName: string;
  /** The current player's UUID */
  playerId: string;
  /** Whether the player created (create) or joined (join) the room */
  mode: 'create' | 'join';
  /** Callback when the game starts, receives the final map configuration */
  onGameStart: (map: MapConfig) => void;
  /** Callback when the player leaves the lobby */
  onLeave: () => void;
}

/**
 * Default map configuration used when creating a new room
 * or before the host sets a custom configuration
 */
const DEFAULT_MAP: MapConfig = {
  radius: 10,      // Hex grid radius (determines map size)
  density: 0.46,   // Initial noise fill probability (0-1)
  smooth: 2,       // Number of cellular automata smoothing passes
  size: 24,        // Pixel size per hex tile
  seed: Date.now(), // Random seed for procedural generation
};

/**
 * LobbyPage - Pre-game room where players configure and ready up
 *
 * @param props - Component props with room info and callbacks
 * @returns The rendered lobby page component
 */
export default function LobbyPage({
  roomId,
  playerName,
  playerId,
  mode,
  onGameStart,
  onLeave,
}: LobbyPageProps) {
  /** Local map configuration state (for immediate UI updates) */
  const [localMap, setLocalMap] = useState<MapConfig>(DEFAULT_MAP);

  // Connect to the game WebSocket and get room state + action methods
  const { connected, roomState, setConfig, setRace, setReady, startGame } = useGameSocket({
    roomId,
    playerName,
    playerId,
    mode,
  });

  /**
   * Effect: Sync local map state with server state
   * When the server broadcasts a new map configuration, update local state
   */
  useEffect(() => {
    if (roomState.map) {
      setLocalMap(roomState.map);
    }
  }, [roomState.map]);

  /**
   * Effect: Handle game start
   * When the server indicates the game has started, navigate to the game page
   */
  useEffect(() => {
    if (roomState.started) {
      onGameStart(localMap);
    }
  }, [roomState.started, localMap, onGameStart]);

  // Derived state for UI logic
  /** Whether the current player is the host */
  const isHost = roomState.host === playerName;

  /** The current player's data from the room state */
  const currentPlayer = roomState.players.find((p) => p.name === playerName);

  /** Whether the current player has marked themselves as ready */
  const isReady = currentPlayer?.ready ?? false;

  /** Whether all players in the room are ready */
  const allReady = roomState.players.length > 0 && roomState.players.every((p) => p.ready);

  /**
   * Handle map configuration changes (host only)
   * Updates local state immediately for responsiveness, then syncs to server
   *
   * @param partial - Partial map config to merge with current config
   */
  const handleMapChange = (partial: Partial<MapConfig>) => {
    if (!isHost) return;
    const newMap = { ...localMap, ...partial };
    setLocalMap(newMap);
    setConfig(newMap);
  };

  /**
   * Handle ready button toggle
   * Switches the player's ready status between ready and not ready
   */
  const handleToggleReady = () => {
    setReady(!isReady);
  };

  /**
   * Handle start game button click (host only)
   * Sends final map configuration and starts the game
   */
  const handleStartGame = () => {
    if (!isHost || !allReady) return;
    // Send final config before starting
    setConfig(localMap);
    startGame();
  };

  /**
   * Copy the room code to clipboard
   * Allows players to easily share the room code with friends
   */
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar - Contains room info, players, controls */}
      <aside className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col">
        {/* Header with room code and connection status */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">Game Lobby</h1>
          {/* Room code with copy button */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-slate-500">Room Code:</span>
            <button
              onClick={copyRoomCode}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded font-mono text-sm font-semibold transition"
              title="Click to copy"
            >
              {roomId}
            </button>
          </div>
          {/* Connection status indicator */}
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-sm text-slate-500">
              {connected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Player list with race selection */}
        <div className="mb-6">
          <PlayerList
            players={roomState.players}
            currentPlayer={playerName}
            host={roomState.host}
            onRaceChange={setRace}
          />
        </div>

        {/* Ready/Not Ready toggle button */}
        <button
          onClick={handleToggleReady}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            isReady
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isReady ? 'Not Ready' : 'Ready'}
        </button>

        {/* Map configuration controls (only host can modify) */}
        <div className="mt-6 flex-1">
          <MapControls map={localMap} onChange={handleMapChange} disabled={!isHost} />
        </div>

        {/* Start game section */}
        <div className="mt-auto pt-6 space-y-3">
          {/* Waiting message when not all players are ready */}
          {!allReady && (
            <p className="text-sm text-amber-600 text-center">
              Waiting for all players to be ready...
            </p>
          )}

          {/* Host gets start button, others see waiting message */}
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={!allReady}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
            >
              Start Game
            </button>
          ) : (
            <p className="text-sm text-slate-500 text-center">
              {allReady ? 'Waiting for host to start...' : ''}
            </p>
          )}

          {/* Leave game button */}
          <button
            onClick={onLeave}
            className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition"
          >
            Leave Game
          </button>
        </div>
      </aside>

      {/* Main content area - Map preview */}
      <main className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Procedurally generated hex map preview */}
          <HexMap
            radius={localMap.radius}
            density={localMap.density}
            smooth={localMap.smooth}
            size={localMap.size}
            seed={localMap.seed}
          />
        </div>
      </main>
    </div>
  );
}
