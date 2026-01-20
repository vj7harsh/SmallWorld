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
import { Panel } from '../components/ui/panel';
import { MapViewport } from '../components/MapViewport';
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

  /** Zoom level for the map preview */
  const [mapZoom, setMapZoom] = useState(1);

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
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        fontFamily: "'Bangers', cursive",
        backgroundColor: '#2d3436'
      }}
    >
      {/* Diagonal stripes background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #4a5f3a 0px, #4a5f3a 40px, #3d4f2f 40px, #3d4f2f 80px)',
        }}
      />

      {/* Main content - two column layout */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Left Panel - Room Details */}
        <Panel
          title="GAME LOBBY"
          subtitle="PREPARE FOR BATTLE"
          className="bg-[#F0EAD6] border-4 border-[#2d3436] shadow-[8px_8px_0px_rgba(0,0,0,0.3)] transform rotate-[-0.5deg]"
          bodyClassName="pt-4"
        >
          <div className="space-y-5">
            {/* Room code with copy button */}
            <div className="space-y-2">
              <label
                className="block text-xl"
                style={{ color: '#2d3436' }}
              >
                ROOM CODE:
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyRoomCode}
                  className="flex-1 px-4 py-3 text-lg outline-none transition text-left"
                  style={{
                    backgroundColor: 'white',
                    border: '3px solid #2d3436',
                    borderRadius: '0.5rem',
                    color: '#2d3436',
                    boxShadow: '3px 3px 0px rgba(0,0,0,0.2)',
                    fontFamily: 'monospace',
                  }}
                  title="Click to copy"
                >
                  {roomId}
                </button>
                <button
                  onClick={copyRoomCode}
                  className="px-4 py-3 text-lg transition-all"
                  style={{
                    backgroundColor: '#4a5f3a',
                    color: '#F0EAD6',
                    border: '3px solid #2d3436',
                    borderRadius: '0.5rem',
                    boxShadow: '3px 3px 0px rgba(0,0,0,0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '5px 5px 0px rgba(0,0,0,0.3)';
                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '3px 3px 0px rgba(0,0,0,0.2)';
                    e.currentTarget.style.transform = 'translate(0, 0)';
                  }}
                >
                  COPY
                </button>
              </div>
            </div>

            {/* Connection status indicator */}
            <div className="flex items-center gap-3 px-4 py-3" style={{
              backgroundColor: connected ? 'rgba(74, 95, 58, 0.2)' : 'rgba(255, 107, 53, 0.2)',
              border: `3px solid ${connected ? '#4a5f3a' : '#ff6b35'}`,
              borderRadius: '0.5rem',
            }}>
              <span className={`w-3 h-3 rounded-full ${connected ? 'bg-[#4a5f3a]' : 'bg-[#ff6b35]'}`} />
              <span className="text-lg" style={{ color: '#2d3436' }}>
                {connected ? 'CONNECTED' : 'CONNECTING...'}
              </span>
            </div>

            {/* Player list with race selection */}
            <div className="space-y-2">
              <label
                className="block text-xl"
                style={{ color: '#2d3436' }}
              >
                SOLDIERS:
              </label>
              <div
                style={{
                  backgroundColor: 'white',
                  border: '3px solid #2d3436',
                  borderRadius: '0.5rem',
                  boxShadow: '3px 3px 0px rgba(0,0,0,0.2)',
                  padding: '0.75rem',
                }}
              >
                <PlayerList
                  players={roomState.players}
                  currentPlayer={playerName}
                  host={roomState.host}
                  onRaceChange={setRace}
                />
              </div>
            </div>

            {/* Ready/Not Ready toggle button */}
            <button
              onClick={handleToggleReady}
              className="w-full py-3 text-2xl tracking-wider transition-all"
              style={{
                backgroundColor: isReady ? '#ff6b35' : '#4a5f3a',
                color: '#F0EAD6',
                border: '4px solid #2d3436',
                borderRadius: '0.5rem',
                boxShadow: '5px 5px 0px rgba(0,0,0,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '7px 7px 0px rgba(0,0,0,0.3)';
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '5px 5px 0px rgba(0,0,0,0.3)';
                e.currentTarget.style.transform = 'translate(0, 0)';
              }}
            >
              {isReady ? 'NOT READY' : 'READY'}
            </button>

            {/* Map configuration controls (only host can modify) */}
            {isHost && (
              <>
                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-1" style={{ backgroundColor: '#2d3436' }} />
                  <span className="text-lg" style={{ color: '#2d3436' }}>MAP CONFIG</span>
                  <div className="flex-1 h-1" style={{ backgroundColor: '#2d3436' }} />
                </div>

                <div
                  style={{
                    backgroundColor: 'white',
                    border: '3px solid #2d3436',
                    borderRadius: '0.5rem',
                    boxShadow: '3px 3px 0px rgba(0,0,0,0.2)',
                    padding: '1rem',
                  }}
                >
                  <MapControls map={localMap} onChange={handleMapChange} disabled={!isHost} />
                </div>
              </>
            )}

            {/* Waiting message when not all players are ready */}
            {!allReady && (
              <div
                className="px-4 py-3 text-lg text-center"
                style={{
                  backgroundColor: 'rgba(255, 107, 53, 0.2)',
                  border: '3px solid #ff6b35',
                  borderRadius: '0.5rem',
                  color: '#2d3436',
                }}
              >
                WAITING FOR ALL SOLDIERS TO BE READY...
              </div>
            )}

            {/* Host gets start button, others see waiting message */}
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={!allReady}
                className="w-full py-3 text-2xl tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#2d3436',
                  color: '#F0EAD6',
                  border: '4px solid #2d3436',
                  borderRadius: '0.5rem',
                  boxShadow: '5px 5px 0px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.boxShadow = '7px 7px 0px rgba(0,0,0,0.3)';
                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '5px 5px 0px rgba(0,0,0,0.3)';
                  e.currentTarget.style.transform = 'translate(0, 0)';
                }}
              >
                START GAME
              </button>
            ) : (
              allReady && (
                <div
                  className="px-4 py-3 text-lg text-center"
                  style={{
                    backgroundColor: 'rgba(74, 95, 58, 0.2)',
                    border: '3px solid #4a5f3a',
                    borderRadius: '0.5rem',
                    color: '#2d3436',
                  }}
                >
                  WAITING FOR HOST TO START...
                </div>
              )
            )}

            {/* Leave game button */}
            <button
              onClick={onLeave}
              className="w-full py-2 text-lg tracking-wider transition-all"
              style={{
                backgroundColor: 'transparent',
                color: '#2d3436',
                border: '3px solid #2d3436',
                borderRadius: '0.5rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(45, 52, 54, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              LEAVE GAME
            </button>
          </div>
        </Panel>

        {/* Right Panel - Map Preview */}
        <Panel
          title="BATTLEFIELD"
          subtitle="MAP PREVIEW"
          className="bg-[#F0EAD6] border-4 border-[#2d3436] shadow-[8px_8px_0px_rgba(0,0,0,0.3)] transform rotate-[0.5deg]"
          bodyClassName="p-0"
        >
          {/* Zoom slider control */}
          <div
            className="flex items-center gap-3 px-4 py-3 mx-6 mt-4"
            style={{
              backgroundColor: 'white',
              border: '3px solid #2d3436',
              borderRadius: '0.5rem',
              boxShadow: '3px 3px 0px rgba(0,0,0,0.2)',
            }}
          >
            <label
              className="text-base whitespace-nowrap"
              style={{ color: '#2d3436' }}
            >
              ZOOM:
            </label>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={mapZoom}
              onChange={(e) => setMapZoom(parseFloat(e.target.value))}
              className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                backgroundColor: '#e0e0e0',
                accentColor: '#4a5f3a',
              }}
            />
            <span
              className="text-base font-mono w-12 text-right"
              style={{ color: '#2d3436' }}
            >
              {mapZoom.toFixed(1)}x
            </span>
          </div>

          {/* Map preview container */}
          <div
            style={{
              backgroundColor: 'white',
              border: '3px solid #2d3436',
              borderRadius: '0.5rem',
              margin: '1rem 1.5rem 1.5rem 1.5rem',
              overflow: 'hidden',
              height: '400px',
            }}
          >
            <MapViewport zoom={mapZoom} className="w-full h-full">
              {/* Procedurally generated hex map preview */}
              <HexMap
                radius={localMap.radius}
                density={localMap.density}
                smooth={localMap.smooth}
                size={localMap.size}
                seed={localMap.seed}
              />
            </MapViewport>
          </div>

          {/* Pan hint */}
          <p
            className="text-center text-sm pb-4"
            style={{ color: '#666' }}
          >
            Drag to pan • Use slider to zoom
          </p>
        </Panel>
      </div>
    </div>
  );
}
