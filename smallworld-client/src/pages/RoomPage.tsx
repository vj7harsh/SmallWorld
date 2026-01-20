/**
 * Room Page Component
 *
 * The page where authenticated users can create or join games.
 * Shows the logged-in user's info and provides game management options.
 *
 * Features:
 * - Display current user info
 * - Create new game button
 * - Join existing game with room code
 * - Logout option
 */

import { useState } from 'react';
import { API_URL } from '../config';
import { Panel } from '../components/ui/panel';
import { RulesSection } from '../components/RulesSection';
import type { User } from '../types';

interface RoomPageProps {
  /** Currently logged-in user */
  user: User;
  /** Callback when a game is created */
  onGameCreated: (roomId: string) => void;
  /** Callback when a game is joined */
  onGameJoined: (roomId: string) => void;
  /** Callback to logout */
  onLogout: () => void;
}

export default function RoomPage({ user, onGameCreated, onGameJoined, onLogout }: RoomPageProps) {
  /** Room code for joining an existing game */
  const [roomCode, setRoomCode] = useState('');

  /** Error message to display */
  const [error, setError] = useState<string | null>(null);

  /** Loading state to disable buttons during API calls */
  const [loading, setLoading] = useState(false);

  /**
   * Handle "Create New Game" button click
   * Creates a game using the authenticated user
   */
  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include session cookie
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create game');
      }

      const data = await res.json();
      onGameCreated(data.game_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle "Join Game" button click
   * Joins a game using the room code
   */
  const handleJoin = async () => {
    if (!roomCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/games/${roomCode.trim()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include session cookie
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to join game');
      }

      onGameJoined(roomCode.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setLoading(false);
    }
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

        {/* Left Panel - Game Actions */}
        <Panel
          title="WAR ZONE!"
          subtitle="JOIN THE BATTLE!"
          className="bg-[#F0EAD6] border-4 border-[#2d3436] shadow-[8px_8px_0px_rgba(0,0,0,0.3)] transform rotate-[-0.5deg]"
          bodyClassName="pt-4"
        >
          {/* User info header */}
          <div
            className="flex items-center justify-between mb-4 pb-4"
            style={{ borderBottom: '2px solid #2d3436' }}
          >
            <div>
              <p className="text-lg" style={{ color: '#2d3436' }}>
                SOLDIER: <span className="font-bold">{user.playerName}</span>
              </p>
            </div>
            <button
              onClick={onLogout}
              disabled={loading}
              className="text-base transition-all"
              style={{
                color: '#ff6b35',
                textDecoration: 'underline',
              }}
            >
              LOGOUT
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div
              className="border-3 px-4 py-3 rounded-lg mb-4 text-lg"
              style={{
                backgroundColor: '#ff6b35',
                borderColor: '#2d3436',
                color: '#F0EAD6'
              }}
            >
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Create game button */}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-3 text-2xl tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#ff6b35',
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
              {loading ? 'DEPLOYING...' : 'CREATE NEW GAME'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-1" style={{ backgroundColor: '#2d3436' }} />
              <span className="text-lg" style={{ color: '#2d3436' }}>OR JOIN EXISTING</span>
              <div className="flex-1 h-1" style={{ backgroundColor: '#2d3436' }} />
            </div>

            {/* Room code input */}
            <div className="space-y-2">
              <label
                className="block text-xl"
                style={{ color: '#2d3436' }}
              >
                GAME CODE:
              </label>
              <input
                type="text"
                placeholder="Enter game code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 text-lg outline-none transition"
                style={{
                  backgroundColor: 'white',
                  border: '3px solid #2d3436',
                  borderRadius: '0.5rem',
                  color: '#2d3436',
                  boxShadow: '3px 3px 0px rgba(0,0,0,0.2)',
                }}
              />
            </div>

            {/* Join game button */}
            <button
              onClick={handleJoin}
              disabled={!roomCode.trim() || loading}
              className="w-full py-3 text-2xl tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#4a5f3a',
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
              {loading ? 'JOINING...' : 'JOIN GAME'}
            </button>
          </div>
        </Panel>

        {/* Right Panel - Rules */}
        <Panel
          title="RULES OF WAR"
          subtitle="KNOW YOUR BATTLEFIELD"
          className="bg-[#F0EAD6] border-4 border-[#2d3436] shadow-[8px_8px_0px_rgba(0,0,0,0.3)] transform rotate-[0.5deg]"
          bodyClassName="max-h-[60vh] overflow-y-auto"
        >
          <RulesSection embedded />
        </Panel>
      </div>
    </div>
  );
}
