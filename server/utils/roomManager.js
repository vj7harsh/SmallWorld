/**
 * Room Manager
 *
 * Manages the in-memory state of all game rooms.
 * Handles room creation, player joining/leaving, game state updates,
 * and persists room data to disk (rooms.json) for recovery after restart.
 *
 * Room Structure:
 * {
 *   players: [{ name: string, race?: string, ready?: boolean }],
 *   host: string,        // Player name of the host
 *   map: MapConfig,      // Map configuration (radius, density, smooth, size, seed)
 *   started: boolean     // Whether the game has started
 * }
 */

import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

// Path to the JSON file where room state is persisted
const DATA_PATH = path.resolve(process.cwd(), config.roomsFile);

// In-memory storage for all active rooms
// Key: roomId (UUID from REST API), Value: room object
let rooms = {};

/**
 * Load rooms from disk on server startup
 * Restores room state from rooms.json if it exists
 * @returns {Object} The loaded rooms object
 */
export function loadRooms() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        rooms = parsed;
        console.log(`Loaded ${Object.keys(rooms).length} rooms from disk`);
      }
    }
  } catch (e) {
    console.error('Failed to load rooms.json:', e.message);
  }
  return rooms;
}

// Timer for debounced persistence
let persistTimer = null;

/**
 * Persist rooms to disk with debouncing
 * Waits 100ms after the last change before writing to avoid excessive disk I/O
 * Called automatically after any room state change
 */
function persistRooms() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DATA_PATH, JSON.stringify(rooms, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write rooms.json:', e.message);
    }
  }, 100);
}

/**
 * Generate a unique 4-character room ID
 * Uses characters that are easy to read (no I/O/1/0 to avoid confusion)
 * @param {number} len - Length of the ID (default: 4)
 * @returns {string} The generated room ID
 */
function generateRoomId(len = 4) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/**
 * Get a room by its ID
 * @param {string} roomId - The room ID to look up
 * @returns {Object|null} The room object or null if not found
 */
export function getRoom(roomId) {
  return rooms[roomId] || null;
}

/**
 * Get all rooms (for debugging/admin purposes)
 * @returns {Object} All rooms keyed by roomId
 */
export function getAllRooms() {
  return rooms;
}

/**
 * Create a new room or join an existing one as the creator/host
 * Called when a player creates a new game
 *
 * @param {string|null} roomId - Room ID (UUID from REST API) or null to generate one
 * @param {string} playerName - Name of the player creating the room
 * @param {string} playerId - UUID of the player (from REST API)
 * @returns {string} The room ID (provided or generated)
 */
export function createRoom(roomId = null, playerName, playerId) {
  // Generate unique ID if not provided (fallback for non-REST API usage)
  if (!roomId) {
    do {
      roomId = generateRoomId(4);
    } while (rooms[roomId]);
  }

  // If room already exists (created via REST API), add player to it
  if (rooms[roomId]) {
    // Add player if not already present
    if (!rooms[roomId].players.find((p) => p.name === playerName)) {
      rooms[roomId].players.push({ name: playerName, race: undefined, ready: false });
    }
    // Set as host if no host exists
    if (!rooms[roomId].host) {
      rooms[roomId].host = playerName;
    }
  } else {
    // Create a brand new room with this player as host
    rooms[roomId] = {
      players: [{ name: playerName, race: undefined, ready: false }],
      host: playerName,
      map: undefined,
      started: false,
    };
  }

  persistRooms();
  return roomId;
}

/**
 * Join an existing room as a non-host player
 * Called when a player joins a game created by someone else
 *
 * @param {string} roomId - The room ID to join
 * @param {string} playerName - Name of the joining player
 * @returns {Object} Success object or error object with code and message
 */
export function joinRoom(roomId, playerName) {
  // Create empty room if it doesn't exist in WebSocket memory
  // (REST API has already validated the room exists in the database)
  if (!rooms[roomId]) {
    rooms[roomId] = { players: [], host: undefined, map: undefined, started: false };
  }

  const room = rooms[roomId];
  const existingPlayer = room.players.find((p) => p.name === playerName);

  // If game has started, only allow rejoining for existing players
  // This enables reconnection after disconnect/refresh
  if (room.started && !existingPlayer) {
    return { error: 'ROOM_STARTED', message: 'Game already started' };
  }

  // Add player to the room if not already present
  if (!existingPlayer) {
    room.players.push({ name: playerName, race: undefined, ready: false });
  }

  // NOTE: Don't assign host here - only createRoom should set the host
  // This prevents joiners from accidentally becoming host

  persistRooms();
  return { success: true };
}

/**
 * Update the map configuration for a room
 * Only the host can change map settings
 *
 * @param {string} roomId - The room ID
 * @param {string} playerName - Name of the player making the request
 * @param {Object} map - Map configuration {radius, density, smooth, size, seed}
 * @returns {boolean} True if successful, false if not authorized or room not found
 */
export function setMapConfig(roomId, playerName, map) {
  const room = rooms[roomId];
  if (!room) return false;

  // Only host can set map configuration
  if (room.host !== playerName) return false;

  room.map = map;
  persistRooms();
  return true;
}

/**
 * Set a player's selected race
 * Any player can change their own race
 *
 * @param {string} roomId - The room ID
 * @param {string} playerName - Name of the player
 * @param {string} race - The selected race (e.g., 'Humans', 'Elves', 'Orcs')
 * @returns {boolean} True if successful, false if player not found
 */
export function setPlayerRace(roomId, playerName, race) {
  const room = rooms[roomId];
  if (!room) return false;

  const player = room.players.find((p) => p.name === playerName);
  if (!player) return false;

  player.race = race;
  persistRooms();
  return true;
}

/**
 * Set a player's ready status
 * Players toggle this to indicate they're ready to start the game
 *
 * @param {string} roomId - The room ID
 * @param {string} playerName - Name of the player
 * @param {boolean} ready - Ready status (true/false)
 * @returns {boolean} True if successful, false if player not found
 */
export function setPlayerReady(roomId, playerName, ready) {
  const room = rooms[roomId];
  if (!room) return false;

  const player = room.players.find((p) => p.name === playerName);
  if (!player) return false;

  player.ready = ready;
  persistRooms();
  return true;
}

/**
 * Start the game
 * Only the host can start, and typically all players should be ready
 *
 * @param {string} roomId - The room ID
 * @param {string} playerName - Name of the player (must be host)
 * @returns {boolean} True if successful, false if not authorized
 */
export function startGame(roomId, playerName) {
  const room = rooms[roomId];
  if (!room) return false;

  // Only the host can start the game
  if (room.host !== playerName) return false;

  room.started = true;
  persistRooms();
  return true;
}

/**
 * Remove a player from a room
 * Called when a player disconnects (closes browser/tab)
 * Only removes player if game hasn't started (to allow reconnection during game)
 *
 * @param {string} roomId - The room ID
 * @param {string} playerName - Name of the player to remove
 */
export function removePlayer(roomId, playerName) {
  const room = rooms[roomId];
  if (!room) return;

  // Only remove player if game hasn't started yet
  // Once game starts, players can disconnect/reconnect without being removed
  if (room.started) {
    return;
  }

  // Remove the player from the players array
  room.players = room.players.filter((p) => p.name !== playerName);

  // If the removed player was host, assign a new host
  if (room.host === playerName) {
    room.host = room.players[0]?.name;  // First remaining player becomes host
  }

  persistRooms();
}

/**
 * Get the current state of a room for broadcasting to clients
 * Returns a formatted state object that clients can use to update their UI
 *
 * @param {string} roomId - The room ID
 * @returns {Object|null} Room state object or null if room not found
 */
export function getRoomState(roomId) {
  const room = rooms[roomId];
  if (!room) return null;

  return {
    type: 'state',           // Message type for WebSocket
    players: room.players,   // Array of player objects
    host: room.host,         // Name of the host player
    map: room.map,           // Map configuration
    started: !!room.started, // Whether game has started
  };
}

// Load rooms from disk when this module is imported
loadRooms();
