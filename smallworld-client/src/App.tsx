/**
 * App.tsx - Main Application Component
 *
 * This is the root component that handles:
 * - URL-based routing (home, lobby, game pages)
 * - Session management (persisted to sessionStorage)
 * - Navigation between pages
 * - Passing callbacks to child components
 *
 * Routes:
 * - / or /home → HomePage (create/join game)
 * - /lobby?room=<id> → LobbyPage (waiting room, map config)
 * - /game?room=<id> → GamePage (active gameplay)
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from './hooks/useSession';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import type { MapConfig } from './types';

// Possible routes in the application
type Route = 'home' | 'lobby' | 'game';

/**
 * Parse the current URL to determine which route/page to show
 * @returns Object with route name and optional roomId from query params
 */
function getRouteFromURL(): { route: Route; roomId?: string } {
  const { pathname, search } = window.location;
  const params = new URLSearchParams(search);
  const roomId = params.get('room') || undefined;

  if (pathname.startsWith('/lobby')) return { route: 'lobby', roomId };
  if (pathname.startsWith('/game')) return { route: 'game', roomId };
  return { route: 'home' };
}

function App() {
  // Session hook manages player credentials in sessionStorage
  const { session, setSession, clearSession } = useSession();

  // Current route/page being displayed
  const [route, setRoute] = useState<Route>(() => getRouteFromURL().route);

  // Mode determines WebSocket message type: 'create' for host, 'join' for others
  const [mode, setMode] = useState<'create' | 'join'>('create');

  // Map configuration received when game starts
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);

  /**
   * Handle browser back/forward navigation
   * Updates route state when user clicks browser nav buttons
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
   * Updates browser URL and internal route state
   *
   * @param newRoute - The route to navigate to
   * @param roomId - Optional room ID to include in URL query params
   */
  const navigate = useCallback((newRoute: Route, roomId?: string) => {
    let url = '/';
    if (newRoute === 'lobby' && roomId) {
      url = `/lobby?room=${encodeURIComponent(roomId)}`;
    } else if (newRoute === 'game' && roomId) {
      url = `/game?room=${encodeURIComponent(roomId)}`;
    } else if (newRoute === 'home') {
      url = '/';
    }

    window.history.pushState({}, '', url);
    setRoute(newRoute);
  }, []);

  /**
   * Callback when a new game is created
   * Called from HomePage after REST API creates the game
   * Saves session and navigates to lobby as host
   *
   * @param roomId - The UUID of the created game
   * @param playerName - The player's display name
   * @param playerId - The player's UUID from database
   */
  const handleGameCreated = useCallback(
    (roomId: string, playerName: string, playerId: string) => {
      setSession({ roomId, playerName, playerId });
      setMode('create');  // Host uses 'create' WebSocket message
      navigate('lobby', roomId);
    },
    [setSession, navigate]
  );

  /**
   * Callback when joining an existing game
   * Called from HomePage after REST API confirms join
   * Saves session and navigates to lobby as non-host
   *
   * @param roomId - The UUID of the game to join
   * @param playerName - The player's display name
   * @param playerId - The player's UUID from database
   */
  const handleGameJoined = useCallback(
    (roomId: string, playerName: string, playerId: string) => {
      setSession({ roomId, playerName, playerId });
      setMode('join');  // Non-host uses 'join' WebSocket message
      navigate('lobby', roomId);
    },
    [setSession, navigate]
  );

  /**
   * Callback when the game starts
   * Called from LobbyPage when host clicks start and game begins
   * Saves map config and navigates to game page
   *
   * @param map - The finalized map configuration
   */
  const handleGameStart = useCallback(
    (map: MapConfig) => {
      setMapConfig(map);
      if (session?.roomId) {
        navigate('game', session.roomId);
      }
    },
    [session, navigate]
  );

  /**
   * Callback when player leaves the game
   * Clears session and returns to home page
   */
  const handleLeave = useCallback(() => {
    clearSession();
    setMapConfig(null);
    navigate('home');
  }, [clearSession, navigate]);

  /**
   * Auto-restore session on page load/refresh
   * If user has a valid session and is on a game route, stay there
   * If no session but on game route, redirect to home
   */
  useEffect(() => {
    const { route: urlRoute } = getRouteFromURL();

    if (session && (urlRoute === 'lobby' || urlRoute === 'game')) {
      // Have session, stay on current game route
      setRoute(urlRoute);
      // Use 'join' mode when restoring (reconnecting to existing room)
      setMode('join');
    } else if (!session && urlRoute !== 'home') {
      // No session but trying to access game route, redirect to home
      navigate('home');
    }
  }, []); // Only run once on mount

  // ==================== RENDER ====================

  // Render Lobby Page
  if (route === 'lobby' && session) {
    return (
      <LobbyPage
        roomId={session.roomId}
        playerName={session.playerName}
        playerId={session.playerId}
        mode={mode}
        onGameStart={handleGameStart}
        onLeave={handleLeave}
      />
    );
  }

  // Render Game Page (only if we have map config)
  if (route === 'game' && session && mapConfig) {
    return (
      <GamePage
        roomId={session.roomId}
        playerName={session.playerName}
        playerId={session.playerId}
        map={mapConfig}
        onLeave={handleLeave}
      />
    );
  }

  // If on game route but no map config, redirect to lobby
  // This handles page refresh during game (map config is lost)
  if (route === 'game' && session && !mapConfig) {
    navigate('lobby', session.roomId);
    return null;
  }

  // Default: show Home Page
  return <HomePage onGameCreated={handleGameCreated} onGameJoined={handleGameJoined} />;
}

export default App;
