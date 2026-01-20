/**
 * Player Routes
 *
 * REST API endpoints for player management.
 * Handles player creation and status updates via PostgreSQL database.
 *
 * Endpoints:
 * - POST /players - Create a new player with a name
 * - PATCH /players/:player_id/ready - Update a player's ready status
 *
 * Note: These endpoints interact with the database for persistent storage.
 * Real-time player state in rooms is managed separately by roomManager.js
 * and communicated via WebSocket.
 */

import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

/**
 * POST /players
 *
 * Create a new player in the database.
 * Called when a user enters their name on the home page before
 * creating or joining a game.
 *
 * Request Body:
 * - player_name: string (required) - The display name for the player
 *
 * Response:
 * - 201: { player_id: UUID, player_name: string }
 * - 400: { error: 'player_name is required' }
 * - 500: { error: 'Failed to create player' }
 */
router.post('/', async (req, res) => {
  try {
    const { player_name } = req.body;

    // Validate player name is provided
    if (!player_name) {
      return res.status(400).json({ error: 'player_name is required' });
    }

    // Insert new player into database, returning the generated UUID
    const result = await pool.query(
      `INSERT INTO players (player_name) VALUES ($1) RETURNING player_id, player_name`,
      [player_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating player:', err);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

/**
 * PATCH /players/:player_id/ready
 *
 * Update a player's ready status in the database.
 * Note: This is separate from the WebSocket-based ready status
 * which is managed in roomManager.js for real-time updates.
 *
 * Request Params:
 * - player_id: UUID - The player's unique identifier
 *
 * Request Body:
 * - ready: boolean (required) - Whether the player is ready
 *
 * Response:
 * - 200: { player_id, player_name, player_status }
 * - 400: { error: 'ready must be a boolean' }
 * - 404: { error: 'Player not found' }
 * - 500: { error: 'Failed to update player status' }
 */
router.patch('/:player_id/ready', async (req, res) => {
  try {
    const { player_id } = req.params;
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
