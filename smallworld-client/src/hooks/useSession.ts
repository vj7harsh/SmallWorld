/**
 * Session Management Hook
 *
 * Provides persistent session storage for player information across page refreshes.
 * Uses browser's sessionStorage to maintain state during a browser session.
 *
 * Session data includes:
 * - playerId: UUID identifying the player
 * - playerName: Display name chosen by the player
 * - roomId: Current room the player is in
 * - isHost: Whether the player created/hosts the room
 *
 * Session is automatically restored on page load and cleared when:
 * - The user explicitly leaves a room
 * - The browser tab/window is closed (sessionStorage behavior)
 */

import { useState, useCallback } from 'react';
import type { Session } from '../types';

/** Key used to store session data in sessionStorage */
const SESSION_KEY = 'smallworld_session';

/**
 * Load existing session from sessionStorage
 * Called once when the hook initializes to restore previous session state
 *
 * @returns The stored session object, or null if no session exists or parsing fails
 */
function loadSession(): Session | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load session:', e);
  }
  return null;
}

/**
 * Save session to sessionStorage
 * Called whenever session state changes to persist the update
 *
 * @param session - The session object to save, or null to clear the session
 */
function saveSession(session: Session | null) {
  try {
    if (session) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

/**
 * Custom React hook for managing player session state
 *
 * Provides a session object that persists across page refreshes within the same
 * browser session. The session is automatically loaded from sessionStorage on
 * first render and saved whenever it changes.
 *
 * @returns Object containing:
 *   - session: Current session data or null if not logged in
 *   - setSession: Function to update the session (also persists to storage)
 *   - clearSession: Function to remove the session entirely
 *
 * @example
 * ```tsx
 * const { session, setSession, clearSession } = useSession();
 *
 * // Create a new session when joining a room
 * setSession({ playerId: 'uuid', playerName: 'Alice', roomId: 'ABCD', isHost: true });
 *
 * // Check if user has an active session
 * if (session) {
 *   console.log(`Welcome back, ${session.playerName}!`);
 * }
 *
 * // Clear session when leaving a room
 * clearSession();
 * ```
 */
export function useSession() {
  // Initialize state from sessionStorage (only runs once on mount)
  const [session, setSessionState] = useState<Session | null>(() => loadSession());

  /**
   * Update the session state and persist to sessionStorage
   * @param newSession - New session data or null to clear
   */
  const setSession = useCallback((newSession: Session | null) => {
    setSessionState(newSession);
    saveSession(newSession);
  }, []);

  /**
   * Clear the current session entirely
   * Removes from both React state and sessionStorage
   */
  const clearSession = useCallback(() => {
    setSessionState(null);
    saveSession(null);
  }, []);

  return { session, setSession, clearSession };
}
