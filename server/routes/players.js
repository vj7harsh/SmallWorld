/**
 * Player Routes
 *
 * REST API endpoints for player management.
 * All endpoints require authentication.
 *
 * Endpoints:
 * - GET /players/me - Get current player info
 * - PATCH /players/ready - Update player's ready status
 */

import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All player routes require authentication
router.use(requireAuth);

/**
 * GET /players/me
 *
 * Get the authenticated player's information.
 *
 * Response:
 * - 200: { player_id, username, player_name, player_status, score }
 * - 401: { error: 'Authentication required' }
 * - 404: { error: 'Player not found' }
 * - 500: { error: 'Failed to fetch player' }
 */
router.get('/me', async (req, res) => {
  try {
    const player_id = req.session.user.playerId;

    const result = await pool.query(
      `SELECT player_id, username, player_name, player_status, score, current_game_id
       FROM players WHERE player_id = $1`,
      [player_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching player:', err);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

/**
 * PATCH /players/ready
 *
 * Update the authenticated player's ready status.
 *
 * Request Body:
 * - ready: boolean (required) - Whether the player is ready
 *
 * Response:
 * - 200: { player_id, player_name, player_status }
 * - 400: { error: 'ready must be a boolean' }
 * - 401: { error: 'Authentication required' }
 * - 404: { error: 'Player not found' }
 * - 500: { error: 'Failed to update player status' }
 */
router.patch('/ready', async (req, res) => {
  try {
    const player_id = req.session.user.playerId;
    const { ready } = req.body;

    // Validate ready is a boolean
    if (typeof ready !== 'boolean') {
      return res.status(400).json({ error: 'ready must be a boolean' });
    }

    // Update player status in database
    const result = await pool.query(
      `UPDATE players SET player_status = $1 WHERE player_id = $2 RETURNING player_id, player_name, player_status`,
      [ready ? 'ready' : 'not_ready', player_id]
    );

    // Check if player exists
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating player ready status:', err);
    res.status(500).json({ error: 'Failed to update player status' });
  }
});

export default router;
