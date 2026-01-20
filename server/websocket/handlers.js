/**
 * WebSocket Message Handlers
 *
 * Handles all incoming WebSocket messages from clients.
 * Each message type has a corresponding handler function.
 *
 * Message Types:
 * - create: Create a new room or join as host
 * - join: Join an existing room as a player
 * - set_config: Update map configuration (host only)
 * - set_race: Set player's selected race
 * - set_ready: Toggle player's ready status
 * - start: Start the game (host only)
 */

import {
  createRoom,
  joinRoom,
  setMapConfig,
  setPlayerRace,
  setPlayerReady,
  startGame,
  removePlayer,
  getRoomState,
} from '../utils/roomManager.js';

/**
 * Main message handler - routes messages to specific handlers based on type
 *
 * @param {WebSocket} ws - The WebSocket connection
 * @param {Object} data - Parsed message data with 'type' field
 * @param {Function} broadcast - Function to broadcast messages to all room members
 */
export function handleMessage(ws, data, broadcast) {
  const { type } = data;

  switch (type) {
    case 'create':
      handleCreate(ws, data, broadcast);
      break;
    case 'join':
      handleJoin(ws, data, broadcast);
      break;
    case 'set_config':
      handleSetConfig(ws, data, broadcast);
      break;
    case 'set_race':
      handleSetRace(ws, data, broadcast);
      break;
    case 'set_ready':
      handleSetReady(ws, data, broadcast);
      break;
    case 'start':
      handleStart(ws, data, broadcast);
      break;
    default:
      console.warn('Unknown message type:', type);
  }
}

/**
 * Handle 'create' message - Create a new room or join existing as host
 * Sent when a player clicks "Create New Game" on the home page
 *
 * Expected data: { type: 'create', roomId: string, playerName: string, playerId: string }
 * Response: { type: 'created', roomId: string } on success
 *           { type: 'error', code: string, message: string } on failure
 *
 * @param {WebSocket} ws - The WebSocket connection
 * @param {Object} data - Message data
 * @param {Function} broadcast - Broadcast function
 */
async function handleCreate(ws, data, broadcast) {
  const { roomId, playerName } = data;

  // Validate player name is provided
  if (!playerName) {
    ws.send(JSON.stringify({
      type: 'error',
      code: 'INVALID_PLAYER_NAME',
      message: 'Player name required.',
    }));
    return;
  }

  // Create the room (or join if it already exists) - now async to fetch host from DB
  const assignedRoomId = await createRoom(roomId, playerName);

  // Store room and player info on the WebSocket connection for later use
  ws.roomId = assignedRoomId;
  ws.playerName = playerName;

  // Send confirmation back to the client
  ws.send(JSON.stringify({ type: 'created', roomId: assignedRoomId }));

  // Broadcast updated room state to all connected clients in this room
  broadcastState(assignedRoomId, broadcast);
}

/**
 * Handle 'join' message - Join an existing room as a player
 * Sent when a player clicks "Join Game" on the home page
 *
 * Expected data: { type: 'join', roomId: string, playerName: string, playerId: string }
 * Response: Broadcasts updated state on success
 *           { type: 'error', code: string, message: string } on failure
 *
 * @param {WebSocket} ws - The WebSocket connection
 * @param {Object} data - Message data
 * @param {Function} broadcast - Broadcast function
 */
async function handleJoin(ws, data, broadcast) {
  const { roomId, playerName } = data;

  // Validate player name
  if (!playerName) {
    ws.send(JSON.stringify({
      type: 'error',
      code: 'INVALID_PLAYER_NAME',
      message: 'Player name required.',
    }));
    return;
  }

  // Validate room ID
  if (!roomId) {
    ws.send(JSON.stringify({
      type: 'error',
      code: 'INVALID_ROOM_ID',
      message: 'Room ID required.',
    }));
    return;
  }

  // Attempt to join the room - now async to fetch host from DB
  const result = await joinRoom(roomId, playerName);

  // Check for errors (e.g., game already started)
  if (result.error) {
    ws.send(JSON.stringify({
      type: 'error',
      code: result.error,
      message: result.message,
    }));
    return;
  }

  // Store room and player info on the WebSocket connection
  ws.roomId = roomId;
  ws.playerName = playerName;

  // Broadcast updated state to all room members
  broadcastState(roomId, broadcast);
}

/**
 * Handle 'set_config' message - Update map configuration
 * Only the host can change map settings
 *
 * Expected data: { type: 'set_config', roomId: string, playerName: string, map: MapConfig }
 *
 * @param {WebSocket} ws - The WebSocket connection
 * @param {Object} data - Message data containing map configuration
 * @param {Function} broadcast - Broadcast function
 */
function handleSetConfig(ws, data, broadcast) {
  const { roomId, playerName, map } = data;

  // Update config and broadcast if successful (returns false if not host)
  if (setMapConfig(roomId, playerName, map)) {
    broadcastState(roomId, broadcast);
  }
}

/**
 * Handle 'set_race' message - Set player's selected race
 * Any player can change their own race selection
 *
 * Expected data: { type: 'set_race', roomId: string, playerName: string, race: string }
 *
 * @param {WebSocket} ws - The WebSocket connection
 * @param {Object} data - Message data containing race selection
 * @param {Function} broadcast - Broadcast function
 */
function handleSetRace(ws, data, broadcast) {
  const { roomId, playerName, race } = data;

  // Update race and broadcast if successful
  if (setPlayerRace(roomId, playerName, race)) {
    broadcastState(roomId, broadcast);
  }
}

/**
 * Handle 'set_ready' message - Toggle player's ready status
 * Players must be ready before the host can start the game
 *
 * Expected data: { type: 'set_ready', roomId: string, playerName: string, ready: boolean }
 *
 * @param {WebSocket} ws - The WebSocket connection
 * @param {Object} data - Message data containing ready status
 * @param {Function} broadcast - Broadcast function
 */
function handleSetReady(ws, data, broadcast) {
  const { roomId, playerName, ready } = data;

  // Update ready status and broadcast if successful
  if (setPlayerReady(roomId, playerName, ready)) {
    broadcastState(roomId, broadcast);
  }
}

/**
 * Handle 'start' message - Start the game
 * Only the host can start the game, typically after all players are ready
 *
 * Expected data: { type: 'start', roomId: string, playerName: string }
 *
 * @param {WebSocket} ws - The WebSocket connection
 * @param {Object} data - Message data
 * @param {Function} broadcast - Broadcast function
 */
function handleStart(ws, data, broadcast) {
  const { roomId, playerName } = data;

  // Start game and broadcast if successful (returns false if not host)
  if (startGame(roomId, playerName)) {
    broadcastState(roomId, broadcast);
  }
}

/**
 * Handle WebSocket disconnection
 * Called when a player closes their browser tab or loses connection
 * Removes player from room if game hasn't started
 *
 * @param {WebSocket} ws - The WebSocket connection that disconnected
 * @param {Function} broadcast - Broadcast function
 */
export function handleDisconnect(ws, broadcast) {
  const { roomId, playerName } = ws;

  // Only process if this connection was associated with a room
  if (roomId && playerName) {
    // Remove player from room (only if game hasn't started)
    removePlayer(roomId, playerName);
    // Broadcast updated state to remaining players
    broadcastState(roomId, broadcast);
  }
}

/**
 * Helper function to broadcast current room state to all clients
 *
 * @param {string} roomId - The room ID to broadcast to
 * @param {Function} broadcast - The broadcast function from websocket/index.js
 */
function broadcastState(roomId, broadcast) {
  const state = getRoomState(roomId);
  if (state) {
    broadcast(roomId, state);
  }
}
