/**
 * Authentication Routes
 *
 * Handles user signup, login, logout, and session verification.
 * Uses express-session for session-based authentication.
 *
 * Endpoints:
 * - POST /auth/signup - Create a new account
 * - POST /auth/login - Log in to existing account
 * - POST /auth/logout - Log out (destroy session)
 * - GET /auth/me - Get current logged-in user
 */

import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

/**
 * POST /auth/signup
 *
 * Create a new user account.
 * Username must be unique. Password stored as plain text (per requirements).
 *
 * Request Body:
 * - username: string (required, unique)
 * - password: string (required)
 * - playerName: string (optional, defaults to username)
 *
 * Response:
 * - 201: { user: { playerId, username, playerName } }
 * - 400: { error: 'Username and password are required' }
 * - 409: { error: 'Username already exists' }
 * - 500: { error: 'Failed to create account' }
 */
router.post('/signup', async (req, res) => {
  try {
    const { username, password, playerName } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Use username as player name if not provided
    const displayName = playerName || username;

    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT player_id FROM players WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Create new user (password stored as plain text per requirements)
    const result = await pool.query(
      `INSERT INTO players (username, password, player_name)
       VALUES ($1, $2, $3)
       RETURNING player_id, username, player_name`,
      [username, password, displayName]
    );

    const user = result.rows[0];

    // Create session for the new user (auto-login after signup)
    req.session.user = {
      playerId: user.player_id,
      username: user.username,
      playerName: user.player_name,
    };

    res.status(201).json({
      user: {
        playerId: user.player_id,
        username: user.username,
        playerName: user.player_name,
      },
    });
  } catch (err) {
    console.error('Error creating account:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

/**
 * POST /auth/login
 *
 * Log in to an existing account.
 * Creates a session on successful login.
 *
 * Request Body:
 * - username: string (required)
 * - password: string (required)
 *
 * Response:
 * - 200: { user: { playerId, username, playerName } }
 * - 400: { error: 'Username and password are required' }
 * - 401: { error: 'Invalid username or password' }
 * - 500: { error: 'Failed to log in' }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username and password
    const result = await pool.query(
      `SELECT player_id, username, player_name
       FROM players
       WHERE username = $1 AND password = $2`,
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Create session
    req.session.user = {
      playerId: user.player_id,
      username: user.username,
      playerName: user.player_name,
    };

    res.json({
      user: {
        playerId: user.player_id,
        username: user.username,
        playerName: user.player_name,
      },
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

/**
 * POST /auth/logout
 *
 * Log out the current user.
 * Destroys the session.
 *
 * Response:
 * - 200: { message: 'Logged out successfully' }
 * - 500: { error: 'Failed to log out' }
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Failed to log out' });
    }

    // Clear the session cookie
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

/**
 * GET /auth/me
 *
 * Get the currently logged-in user.
 * Returns user info if logged in, null if not.
 *
 * Response:
 * - 200: { user: { playerId, username, playerName } | null }
 */
router.get('/me', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.json({ user: null });
  }
});

export default router;
