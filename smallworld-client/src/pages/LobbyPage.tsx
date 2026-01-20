import { useState, useEffect } from 'react';
import { useGameSocket } from '../hooks/useGameSocket';
import PlayerList from '../components/PlayerList';
import MapControls from '../components/MapControls';
import HexMap from '../components/IrregularHexRegions';
import { Panel } from '../components/ui/panel';
import { MapViewport } from '../components/MapViewport';
import type { MapConfig } from '../types';

interface LobbyPageProps {
  roomId: string;
  playerName: string;
  playerId: string;
  mode: 'create' | 'join';
  onGameStart: (map: MapConfig) => void;
  onLeave: () => void;
}

const DEFAULT_MAP: MapConfig = {
  radius: 10,
  density: 0.46,
  smooth: 2,
  size: 24,
  seed: Date.now(),
};

export default function LobbyPage({
  roomId,
  playerName,
  playerId,
  mode,
  onGameStart,
  onLeave,
}: LobbyPageProps) {
  const [localMap, setLocalMap] = useState<MapConfig>(DEFAULT_MAP);
  const [mapZoom, setMapZoom] = useState(1);

  const { connected, roomState, setConfig, setRace, setReady, startGame } = useGameSocket({
    roomId,
    playerName,
    playerId,
    mode,
  });

  useEffect(() => {
    if (roomState.map) {
      setLocalMap(roomState.map);
    }
  }, [roomState.map]);

  useEffect(() => {
    if (roomState.started) {
      onGameStart(localMap);
    }
  }, [roomState.started, localMap, onGameStart]);

  const isHost = roomState.host === playerName;
  const currentPlayer = roomState.players.find((p) => p.name === playerName);
  const isReady = currentPlayer?.ready ?? false;
  const allReady = roomState.players.length > 0 && roomState.players.every((p) => p.ready);

  const handleMapChange = (partial: Partial<MapConfig>) => {
    if (!isHost) return;
    const newMap = { ...localMap, ...partial };
    setLocalMap(newMap);
    setConfig(newMap);
  };

  const handleToggleReady = () => setReady(!isReady);

  const handleStartGame = () => {
    if (!isHost || !allReady) return;
    setConfig(localMap);
    startGame();
  };

  const copyRoomCode = () => navigator.clipboard.writeText(roomId);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        backgroundColor: '#2d3436'
      }}
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #4a5f3a 0px, #4a5f3a 40px, #3d4f2f 40px, #3d4f2f 80px)',
        }}
      />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* LEFT PANEL: Room & Players */}
        <Panel
          title="GAME LOBBY"
          subtitle="PREPARE FOR BATTLE"
          className="transform rotate-[-0.5deg]"
          bodyClassName="pt-4"
        >
          <div className="space-y-5">
            {/* Room Code */}
            <div className="space-y-2">
              <label className="block text-xl font-bold" style={{ color: '#2d3436' }}>ROOM CODE:</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyRoomCode}
                  className="flex-1 px-4 py-3 text-lg font-mono bg-white border-[3px] border-[#2d3436] rounded-lg shadow-[3px_3px_0px_rgba(0,0,0,0.2)]"
                >
                  {roomId}
                </button>
                <button
                  onClick={copyRoomCode}
                  className="px-4 py-3 font-bold bg-[#4a5f3a] text-[#F0EAD6] border-[3px] border-[#2d3436] rounded-lg"
                >
                  COPY
                </button>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg border-[3px]" style={{
              backgroundColor: connected ? 'rgba(74, 95, 58, 0.1)' : 'rgba(255, 107, 53, 0.1)',
              borderColor: connected ? '#4a5f3a' : '#ff6b35',
            }}>
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-[#4a5f3a]' : 'bg-[#ff6b35]'} animate-pulse`} />
              <span className="font-bold text-[#2d3436]">{connected ? 'SYSTEMS ONLINE' : 'ESTABLISHING UPLINK...'}</span>
            </div>

            {/* Soldiers List */}
            <div className="space-y-2">
              <label className="block text-xl font-bold" style={{ color: '#2d3436' }}>SOLDIERS:</label>
              <div className="bg-white border-[3px] border-[#2d3436] rounded-lg p-3 shadow-[3px_3px_0px_rgba(0,0,0,0.1)]">
                <PlayerList
                  players={roomState.players}
                  currentPlayer={playerName}
                  host={roomState.host}
                  onRaceChange={setRace}
                />
              </div>
            </div>

            {/* Ready Button */}
            <button
              onClick={handleToggleReady}
              className="w-full py-4 border-[4px] border-[#2d3436] rounded-xl shadow-[5px_5px_0px_rgba(0,0,0,0.3)] transition-all active:translate-y-1 active:shadow-none"
              style={{
                backgroundColor: isReady ? '#ff6b35' : '#4a5f3a',
                color: '#F0EAD6',
                fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
                fontWeight: 'bold'
              }}
            >
              {isReady ? 'STANDING BY' : 'MARK READY'}
            </button>

            {/* Game Start Logic */}
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={!allReady}
                className="w-full py-4 bg-[#2d3436] text-[#F0EAD6] border-[4px] border-[#2d3436] rounded-xl shadow-[5px_5px_0px_rgba(0,0,0,0.3)] disabled:opacity-50 font-bold"
                style={{ fontSize: 'clamp(1.25rem, 2vw, 1.75rem)' }}
              >
                {allReady ? 'ENGAGE BATTLE' : 'AWAITING SQUAD'}
              </button>
            ) : (
              <div className="text-center p-3 border-2 border-dashed border-[#2d3436] rounded-lg opacity-70 font-bold text-[#2d3436]">
                {allReady ? "AWAITING HOST COMMAND..." : "PREPARE YOURSELF..."}
              </div>
            )}

            <button onClick={onLeave} className="w-full py-2 border-2 border-[#2d3436] rounded-lg font-bold hover:bg-black/5 transition-colors text-[#2d3436]">
              ABORT MISSION
            </button>
          </div>
        </Panel>

        {/* RIGHT PANEL: Map & Config */}
        {/* RIGHT PANEL: Battlefield HUD */}
        <div className="lg:col-span-8 h-full overflow-hidden flex flex-col">
          <Panel
            title="BATTLEFIELD"
            subtitle="TACTICAL DISPLAY"
            className="transform rotate-[0.5deg] h-full flex flex-col"
            bodyClassName="p-0 relative flex-1" // Added relative here
          >
            {/* THE MAP (Full background) */}
            <div className="absolute inset-0 z-0 bg-white">
              <MapViewport zoom={mapZoom} className="w-full h-full">
                <HexMap {...localMap} />
              </MapViewport>
            </div>

            {/* OVERLAY: Zoom Control (Top Right) */}
            <div className="absolute top-4 right-4 z-10 w-64">
              <div className="bg-[#F0EAD6]/90 backdrop-blur-sm border-[3px] border-[#2d3436] rounded-lg p-3 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xs text-[#2d3436]">ZOOM</span>
                  <input
                    type="range"
                    min="0.5" max="2.5" step="0.1"
                    value={mapZoom}
                    onChange={(e) => setMapZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-[#4a5f3a] h-1.5"
                  />
                  <span className="font-mono text-xs w-8">{mapZoom.toFixed(1)}x</span>
                </div>
              </div>
            </div>

            {/* OVERLAY: Tactical Controls (Bottom Right) - Only for Host */}
            {isHost && (
              <div className="absolute bottom-4 right-4 z-10 w-72">
                <div className="bg-[#F0EAD6]/90 backdrop-blur-sm border-[3px] border-[#2d3436] rounded-lg p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
                  <div className="text-[10px] font-bold opacity-60 mb-2 tracking-tighter uppercase">Terrain Generator</div>
                  <div className="max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
                    <MapControls map={localMap} onChange={handleMapChange} disabled={!isHost} />
                  </div>
                </div>
              </div>
            )}

            {/* OVERLAY: Tactical Intel (Bottom Left) */}
            <div className="absolute bottom-4 left-4 z-10">
              <div className="bg-[#2d3436]/80 text-[#F0EAD6] px-3 py-1 border-2 border-[#F0EAD6]/20 rounded text-[10px] uppercase tracking-widest">
                {isHost ? "Status: Commanding" : "Status: Receiving Intel"}
              </div>
            </div>

            {/* Controls Hint */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <p className="text-[10px] uppercase tracking-widest opacity-40 text-[#2d3436] bg-white/50 px-2 rounded">
                Right Click + Drag to Pan
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}