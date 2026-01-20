/**
 * App.tsx - Main Application Component
 *
 * This is the root component that handles:
 * - Authentication state management
 * - URL-based routing (auth, rooms, lobby, game pages)
 * - Navigation between pages
 *
 * Routes:
 * - / → AuthPage (login/signup) if not logged in
 * - /rooms → RoomPage (create/join game) if logged in
 * - /lobby?room=<id> → LobbyPage (waiting room, map config)
 * - /game?room=<id> → GamePage (active gameplay)
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import RoomPage from './pages/RoomPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import type { MapConfig, GameSession } from './types';

// Possible routes in the application
type Route = 'auth' | 'rooms' | 'lobby' | 'game';

// Session storage key for game session
const GAME_SESSION_KEY = 'smallworld_game_session';

/**
 * Parse the current URL to determine which route/page to show
 */
function getRouteFromURL(): { route: Route; roomId?: string } {
  const { pathname, search } = window.location;
  const params = new URLSearchParams(search);
  const roomId = params.get('room') || undefined;

  if (pathname.startsWith('/lobby')) return { route: 'lobby', roomId };
  if (pathname.startsWith('/game')) return { route: 'game', roomId };
  if (pathname.startsWith('/rooms')) return { route: 'rooms' };
  return { route: 'auth' };
}

/**
 * Load game session from sessionStorage
 */
function loadGameSession(): GameSession | null {
  try {
    const stored = sessionStorage.getItem(GAME_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save game session to sessionStorage
 */
function saveGameSession(session: GameSession | null) {
  if (session) {
    sessionStorage.setItem(GAME_SESSION_KEY, JSON.stringify(session));
  } else {
    sessionStorage.removeItem(GAME_SESSION_KEY);
  }
}

function App() {
  // Authentication hook
  const { user, loading: authLoading, error: authError, login, signup, logout, clearError } = useAuth();

  // Game session (persists room ID)
  const [gameSession, setGameSession] = useState<GameSession | null>(() => loadGameSession());

  // Current route/page being displayed
  const [route, setRoute] = useState<Route>(() => getRouteFromURL().route);

  // Mode determines WebSocket message type: 'create' for host, 'join' for others
  const [mode, setMode] = useState<'create' | 'join'>('create');

  // Map configuration received when game starts
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);

  /**
   * Update game session and persist to sessionStorage
   */
  const updateGameSession = useCallback((session: GameSession | null) => {
    setGameSession(session);
    saveGameSession(session);
  }, []);

  /**
   * Handle browser back/forward navigation
   */
  useEffect(() => {
    const handlePopState = () => {
      const { route: newRoute } = getRouteFromURL();
      setRoute(newRoute);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  /**
   * Navigate to a new route
   */
  const navigate = useCallback((newRoute: Route, roomId?: string) => {
    let url = '/';
    if (newRoute === 'rooms') {
      url = '/rooms';
    } else if (newRoute === 'lobby' && roomId) {
      url = `/lobby?room=${encodeURIComponent(roomId)}`;
    } else if (newRoute === 'game' && roomId) {
      url = `/game?room=${encodeURIComponent(roomId)}`;
    } else if (newRoute === 'auth') {
      url = '/';
    }

    window.history.pushState({}, '', url);
    setRoute(newRoute);
  }, []);

  /**
   * Callback when a new game is created
   */
  const handleGameCreated = useCallback((roomId: string) => {
    updateGameSession({ roomId });
    setMode('create');
    navigate('lobby', roomId);
  }, [updateGameSession, navigate]);

  /**
   * Callback when joining an existing game
   */
  const handleGameJoined = useCallback((roomId: string) => {
    updateGameSession({ roomId });
    setMode('join');
    navigate('lobby', roomId);
  }, [updateGameSession, navigate]);

  /**
   * Callback when the game starts
   */
  const handleGameStart = useCallback((map: MapConfig) => {
    setMapConfig(map);
    if (gameSession?.roomId) {
      navigate('game', gameSession.roomId);
    }
  }, [gameSession, navigate]);

  /**
   * Callback when player leaves the game
   */
  const handleLeave = useCallback(() => {
    updateGameSession(null);
    setMapConfig(null);
    navigate('rooms');
  }, [updateGameSession, navigate]);

  /**
   * Handle logout
   */
  const handleLogout = useCallback(async () => {
    await logout();
    updateGameSession(null);
    setMapConfig(null);
    navigate('auth');
  }, [logout, updateGameSession, navigate]);

  /**
   * Redirect based on auth state and URL
   */
  useEffect(() => {
    if (authLoading) return; // Wait for auth check to complete

    const { route: urlRoute, roomId } = getRouteFromURL();

    if (!user) {
      // Not logged in - redirect to auth page
      if (urlRoute !== 'auth') {
        navigate('auth');
      }
    } else {
      // Logged in
      if (urlRoute === 'auth') {
        // On auth page but logged in - go to rooms
        navigate('rooms');
      } else if ((urlRoute === 'lobby' || urlRoute === 'game') && roomId) {
        // On game route - restore game session
        if (!gameSession || gameSession.roomId !== roomId) {
          updateGameSession({ roomId });
          setMode('join'); // Reconnecting uses 'join' mode
        }
        setRoute(urlRoute);
      } else if (urlRoute === 'rooms') {
        setRoute('rooms');
      }
    }
  }, [user, authLoading]); // Only run when auth state changes

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // ==================== RENDER ====================

  // Not logged in - show auth page
  if (!user) {
    return (
      <AuthPage
        onLogin={login}
        onSignup={signup}
        error={authError}
        onClearError={clearError}
      />
    );
  }

  // Logged in - show appropriate page based on route

  // Render Lobby Page
  if (route === 'lobby' && gameSession) {
    return (
      <LobbyPage
        roomId={gameSession.roomId}
        playerName={user.playerName}
        playerId={user.playerId}
        mode={mode}
        onGameStart={handleGameStart}
        onLeave={handleLeave}
      />
    );
  }

  // Render Game Page (only if we have map config)
  if (route === 'game' && gameSession && mapConfig) {
    return (
      <GamePage
        roomId={gameSession.roomId}
        playerName={user.playerName}
        playerId={user.playerId}
        map={mapConfig}
        onLeave={handleLeave}
      />
    );
  }

  // If on game route but no map config, redirect to lobby
  if (route === 'game' && gameSession && !mapConfig) {
    navigate('lobby', gameSession.roomId);
    return null;
  }

  // Default: show Room Page (create/join game)
  return (
    <RoomPage
      user={user}
      onGameCreated={handleGameCreated}
      onGameJoined={handleGameJoined}
      onLogout={handleLogout}
    />
  );
}

export default App;
