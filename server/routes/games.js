/**
 * Game Routes
 *
 * REST API endpoints for game room management.
 * Handles creating games, joining games, and getting game status.
 *
 * Endpoints:
 * - POST /games - Create a new game room
 * - POST /games/:game_id/join - Join an existing game room
 * - GET /games/:game_id - Get game details
 * - GET /games/:game_id/status - Get game status with player details
 * - PATCH /games/:game_id/status - Update game status
 *
 * Note: These endpoints persist game data in PostgreSQL.
 * Real-time game state is managed separately by roomManager.js
 * and communicated via WebSocket.
 */

import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

/**
 * POST /games
 *
 * Create a new game room in the database.
 * The creating player becomes the first member of the game.
 * Called when a user clicks "Create New Game" on the home page.
 *
 * Request Body:
 * - player_id: UUID (required) - The ID of the player creating the game
 *
 * Response:
 * - 201: { game_id: UUID, message: 'Game room created successfully.' }
 * - 400: { error: 'player_id is required' }
 * - 500: { error: 'Failed to create game room' }
 */
router.post('/', async (req, res) => {
  try {
    const { player_id } = req.body;

    // Validate player_id is provided
    if (!player_id) {
      return res.status(400).json({ error: 'player_id is required' });
    }

    // Create the game with the player as the first member
    const gameResult = await pool.query(
      `INSERT INTO games (players_list, game_status)
       VALUES ($1::jsonb, 'waiting')
       RETURNING game_id, created_on`,
      [JSON.stringify([player_id])]
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
 * Adds the player to the game's players list if the game is still waiting.
 * Called when a user enters a room code and clicks "Join Game".
 *
 * Request Params:
 * - game_id: UUID - The game room ID to join
 *
 * Request Body:
 * - player_id: UUID (required) - The ID of the player joining
 *
 * Response:
 * - 200: { message: 'Joined game room successfully.' }
 * - 400: { error: 'player_id is required' } or { error: 'Game has already started' }
 * - 404: { error: 'Game room not found' }
 * - 500: { error: 'Failed to join game room' }
 */
router.post('/:game_id/join', async (req, res) => {
  try {
    const { game_id } = req.params;
    const { player_id } = req.body;

    // Validate player_id is provided
    if (!player_id) {
      return res.status(400).json({ error: 'player_id is required' });
    }

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
 * Returns the raw game record without player details.
 *
 * Request Params:
 * - game_id: UUID - The game room ID
 *
 * Response:
 * - 200: Full game record from database
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
 * Joins game data with player data to provide complete information
 * about all players in the game.
 *
 * Request Params:
 * - game_id: UUID - The game room ID
 *
 * Response:
 * - 200: {
 *     game_id: UUID,
 *     game_status: string,
 *     player_count: number,
 *     players: Array<{player_id, player_name, player_status, score}>,
 *     created_on: timestamp,
 *     last_updated: timestamp
 *   }
 * - 404: { error: 'Game not found' }
 * - 500: { error: 'Failed to fetch game status' }
 */
router.get('/:game_id/status', async (req, res) => {
  try {
    const { game_id } = req.params;

    // Get game details
    const gameResult = await pool.query(
      `SELECT * FROM games WHERE game_id = $1`,
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
 * Used when the host starts the game.
 *
 * Request Params:
 * - game_id: UUID - The game room ID
 *
 * Request Body:
 * - status: string (required) - The new game status ('waiting', 'active', 'ended')
 *
 * Response:
 * - 200: Updated game record
 * - 400: { error: 'status is required' }
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
