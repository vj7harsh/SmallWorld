/**
 * Game Routes
 *
 * REST API endpoints for game room management.
 * All endpoints require authentication.
 *
 * Endpoints:
 * - POST /games - Create a new game room
 * - POST /games/:game_id/join - Join an existing game room
 * - GET /games/:game_id - Get game details
 * - GET /games/:game_id/status - Get game status with player details
 * - PATCH /games/:game_id/status - Update game status
 */

import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All game routes require authentication
router.use(requireAuth);

/**
 * POST /games
 *
 * Create a new game room in the database.
 * Uses the authenticated user as the host.
 *
 * Response:
 * - 201: { game_id: UUID, message: 'Game room created successfully.' }
 * - 401: { error: 'Authentication required' }
 * - 500: { error: 'Failed to create game room' }
 */
router.post('/', async (req, res) => {
  try {
    // Get player_id from authenticated session
    const player_id = req.session.user.playerId;

    // Create the game with the player as the first member and host
    const gameResult = await pool.query(
      `INSERT INTO games (host_id, players_list, game_status)
       VALUES ($1, $2::jsonb, 'waiting')
       RETURNING game_id, host_id, created_on`,
      [player_id, JSON.stringify([player_id])]
    );

    const game = gameResult.rows[0];

    // Update player's current game reference
    await pool.query(
      `UPDATE players SET current_game_id = $1, player_status = 'in_game'
       WHERE player_id = $2`,
      [game.game_id, player_id]
    );

    res.status(201).json({
      game_id: game.game_id,
      message: 'Game room created successfully.',
    });
  } catch (err) {
    console.error('Error creating game:', err);
    res.status(500).json({ error: 'Failed to create game room' });
  }
});

/**
 * POST /games/:game_id/join
 *
 * Join an existing game room.
 * Uses the authenticated user to join the game.
 *
 * Request Params:
 * - game_id: UUID - The game room ID to join
 *
 * Response:
 * - 200: { message: 'Joined game room successfully.' }
 * - 400: { error: 'Game has already started' }
 * - 401: { error: 'Authentication required' }
 * - 404: { error: 'Game room not found' }
 * - 500: { error: 'Failed to join game room' }
 */
router.post('/:game_id/join', async (req, res) => {
  try {
    const { game_id } = req.params;
    // Get player_id from authenticated session
    const player_id = req.session.user.playerId;

    // Check if game exists and is in 'waiting' status
    const gameResult = await pool.query(
      `SELECT game_id, players_list, game_status FROM games WHERE game_id = $1`,
      [game_id]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game room not found' });
    }

    const game = gameResult.rows[0];

    // Only allow joining if game hasn't started
    if (game.game_status !== 'waiting') {
      return res.status(400).json({ error: 'Game has already started' });
    }

    // Add player to the game's players list (avoid duplicates)
    const playersList = game.players_list || [];
    if (!playersList.includes(player_id)) {
      playersList.push(player_id);
    }

    // Update the game's players list
    await pool.query(
      `UPDATE games SET players_list = $1::jsonb WHERE game_id = $2`,
      [JSON.stringify(playersList), game_id]
    );

    // Update player's current game reference
    await pool.query(
      `UPDATE players SET current_game_id = $1, player_status = 'in_game'
       WHERE player_id = $2`,
      [game_id, player_id]
    );

    res.status(200).json({
      message: 'Joined game room successfully.',
    });
  } catch (err) {
    console.error('Error joining game:', err);
    res.status(500).json({ error: 'Failed to join game room' });
  }
});

/**
 * GET /games/:game_id
 *
 * Get basic game details from the database.
 *
 * Request Params:
 * - game_id: UUID - The game room ID
 *
 * Response:
 * - 200: Full game record from database
 * - 401: { error: 'Authentication required' }
 * - 404: { error: 'Game not found' }
 * - 500: { error: 'Failed to fetch game' }
 */
router.get('/:game_id', async (req, res) => {
  try {
    const { game_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM games WHERE game_id = $1`,
      [game_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching game:', err);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

/**
 * GET /games/:game_id/status
 *
 * Get game status with full player details.
 *
 * Request Params:
 * - game_id: UUID - The game room ID
 *
 * Response:
 * - 200: Game status with player details
 * - 401: { error: 'Authentication required' }
 * - 404: { error: 'Game not found' }
 * - 500: { error: 'Failed to fetch game status' }
 */
router.get('/:game_id/status', async (req, res) => {
  try {
    const { game_id } = req.params;

    // Get game details including host
    const gameResult = await pool.query(
      `SELECT g.*, p.player_name as host_name
       FROM games g
       LEFT JOIN players p ON g.host_id = p.player_id
       WHERE g.game_id = $1`,
      [game_id]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = gameResult.rows[0];
    const playerIds = game.players_list || [];

    // Get full player details for all players in the game
    let players = [];
    if (playerIds.length > 0) {
      const playersResult = await pool.query(
        `SELECT player_id, player_name, player_status, score
         FROM players
         WHERE player_id = ANY($1::uuid[])`,
        [playerIds]
      );
      players = playersResult.rows;
    }

    res.json({
      game_id: game.game_id,
      host_id: game.host_id,
      host_name: game.host_name,
      game_status: game.game_status,
      player_count: players.length,
      players: players,
      created_on: game.created_on,
      last_updated: game.last_updated,
    });
  } catch (err) {
    console.error('Error fetching game status:', err);
    res.status(500).json({ error: 'Failed to fetch game status' });
  }
});

/**
 * PATCH /games/:game_id/status
 *
 * Update the game's status (e.g., from 'waiting' to 'active').
 *
 * Request Params:
 * - game_id: UUID - The game room ID
 *
 * Request Body:
 * - status: string (required) - The new game status
 *
 * Response:
 * - 200: Updated game record
 * - 400: { error: 'status is required' }
 * - 401: { error: 'Authentication required' }
 * - 404: { error: 'Game not found' }
 * - 500: { error: 'Failed to update game status' }
 */
router.patch('/:game_id/status', async (req, res) => {
  try {
    const { game_id } = req.params;
    const { status } = req.body;

    // Validate status is provided
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    // Update game status and last_updated timestamp
    const result = await pool.query(
      `UPDATE games SET game_status = $1, last_updated = NOW() WHERE game_id = $2 RETURNING *`,
      [status, game_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating game status:', err);
    res.status(500).json({ error: 'Failed to update game status' });
  }
});

export default router;
