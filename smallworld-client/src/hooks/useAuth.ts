/**
 * Authentication Hook
 *
 * Manages user authentication state using server-side sessions.
 * Provides login, signup, logout, and session verification.
 */

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';
import type { User } from '../types';

/**
 * Custom React hook for authentication
 *
 * Handles:
 * - Checking if user is logged in on app load
 * - Login with username/password
 * - Signup with username/password
 * - Logout
 *
 * @returns Object with user state and auth methods
 */
export function useAuth() {
  /** Currently logged-in user, null if not authenticated */
  const [user, setUser] = useState<User | null>(null);

  /** Whether initial auth check is in progress */
  const [loading, setLoading] = useState(true);

  /** Error message from last auth operation */
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if user is logged in on mount
   * Calls /auth/me to verify session
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Verify current authentication status
   * Called on mount and can be called to refresh auth state
   */
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include', // Include cookies
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to check auth:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Log in with username and password
   *
   * @param username - The username
   * @param password - The password
   * @returns True if login succeeded, false otherwise
   */
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        return true;
      } else {
        setError(data.error || 'Login failed');
        return false;
      }
    } catch (err) {
      setError('Failed to connect to server');
      return false;
    }
  }, []);

  /**
   * Create a new account
   *
   * @param username - The username (must be unique)
   * @param password - The password
   * @param playerName - Optional display name (defaults to username)
   * @returns True if signup succeeded, false otherwise
   */
  const signup = useCallback(async (
    username: string,
    password: string,
    playerName?: string
  ): Promise<boolean> => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ username, password, playerName }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        return true;
      } else {
        setError(data.error || 'Signup failed');
        return false;
      }
    } catch (err) {
      setError('Failed to connect to server');
      return false;
    }
  }, []);

  /**
   * Log out the current user
   * Destroys the server session
   */
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  }, []);

  /**
   * Clear any error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    /** Currently logged-in user, null if not authenticated */
    user,
    /** Whether initial auth check is in progress */
    loading,
    /** Error message from last auth operation */
    error,
    /** Log in with username/password */
    login,
    /** Create a new account */
    signup,
    /** Log out the current user */
    logout,
    /** Clear any error message */
    clearError,
    /** Refresh auth state from server */
    checkAuth,
  };
}
