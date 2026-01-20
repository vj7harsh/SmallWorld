/**
 * Home Page Component
 *
 * The landing page of the SmallWorld application where players can:
 * 1. Enter their name
 * 2. Create a new game (becoming the host)
 * 3. Join an existing game using a room code
 *
 * Flow:
 * - User enters their name (required for both create and join)
 * - To create: Click "Create New Game" -> API creates player and game -> redirects to lobby as host
 * - To join: Enter room code and click "Join Game" -> API creates player and validates room -> redirects to lobby as player
 *
 * API Calls:
 * - POST /players: Create a new player with the given name
 * - POST /games: Create a new game room
 * - POST /games/:id/join: Join an existing game room
 */

import { useState } from 'react';
import { API_URL } from '../config';

/**
 * Props for the HomePage component
 */
interface HomePageProps {
  /** Callback when a game is successfully created */
  onGameCreated: (roomId: string, playerName: string, playerId: string) => void;
  /** Callback when a game is successfully joined */
  onGameJoined: (roomId: string, playerName: string, playerId: string) => void;
}

/**
 * HomePage - Landing page for creating or joining games
 *
 * @param props - Component props containing callback functions
 * @returns The rendered home page component
 */
export default function HomePage({ onGameCreated, onGameJoined }: HomePageProps) {
  /** The player's chosen display name */
  const [playerName, setPlayerName] = useState('');

  /** Room code for joining an existing game */
  const [roomCode, setRoomCode] = useState('');

  /** Error message to display (null when no error) */
  const [error, setError] = useState<string | null>(null);

  /** Loading state to disable buttons during API calls */
  const [loading, setLoading] = useState(false);

  /**
   * Create a new player via the REST API
   * Called before both creating and joining games
   *
   * @param name - The player's display name
   * @returns The generated player UUID
   * @throws Error if the API call fails
   */
  const createPlayer = async (name: string): Promise<string> => {
    const res = await fetch(`${API_URL}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_name: name }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create player');
    }

    const data = await res.json();
    return data.player_id;
  };

  /**
   * Handle "Create New Game" button click
   *
   * Steps:
   * 1. Create a player with the entered name
   * 2. Create a new game room with the player as host
   * 3. Call onGameCreated callback to navigate to lobby
   */
  const handleCreate = async () => {
    // Validate player name is not empty
    if (!playerName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create player
      const playerId = await createPlayer(playerName.trim());

      // Step 2: Create game
      const res = await fetch(`${API_URL}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId }),
      });

      if (!res.ok) {
        throw new Error('Failed to create game');
      }

      // Step 3: Navigate to lobby
      const data = await res.json();
      onGameCreated(data.game_id, playerName.trim(), playerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle "Join Game" button click
   *
   * Steps:
   * 1. Create a player with the entered name
   * 2. Join the game room using the provided room code
   * 3. Call onGameJoined callback to navigate to lobby
   */
  const handleJoin = async () => {
    // Validate both player name and room code are provided
    if (!playerName.trim() || !roomCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create player
      const playerId = await createPlayer(playerName.trim());

      // Step 2: Join game (room code is case-sensitive as it's a UUID)
      const res = await fetch(`${API_URL}/games/${roomCode.trim()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to join game');
      }

      // Step 3: Navigate to lobby
      onGameJoined(roomCode.trim(), playerName.trim(), playerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-2 text-slate-800">SmallWorld</h1>
        <p className="text-center text-slate-500 mb-6">Conquer the world with your fantasy races</p>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Player name input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              disabled={loading}
            />
          </div>

          {/* Create game button */}
          <button
            onClick={handleCreate}
            disabled={!playerName.trim() || loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
          >
            {loading ? 'Creating...' : 'Create New Game'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-300" />
            <span className="text-slate-400 text-sm">or join existing</span>
            <div className="flex-1 h-px bg-slate-300" />
          </div>

          {/* Room code input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Game Code</label>
            <input
              type="text"
              placeholder="Enter game code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              disabled={loading}
            />
          </div>

          {/* Join game button */}
          <button
            onClick={handleJoin}
            disabled={!playerName.trim() || !roomCode.trim() || loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
          >
            {loading ? 'Joining...' : 'Join Game'}
          </button>
        </div>
      </div>
    </div>
  );
}
