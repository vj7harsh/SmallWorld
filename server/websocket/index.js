/**
 * WebSocket Server
 *
 * Creates and manages the WebSocket server for real-time game communication.
 * Handles player connections, message routing, and broadcasting room state
 * updates to all connected clients.
 *
 * Architecture:
 * - Each WebSocket connection is associated with a room via ws.roomId
 * - Messages are routed to handlers.js for processing
 * - State changes are broadcast to all clients in the same room
 *
 * Connection Flow:
 * 1. Client connects to WebSocket server
 * 2. Client sends 'create' or 'join' message with room/player info
 * 3. Server associates the connection with a room (sets ws.roomId)
 * 4. Server broadcasts updated room state to all clients in the room
 * 5. Subsequent messages update room state and trigger broadcasts
 * 6. On disconnect, player is removed (if game not started) and state is broadcast
 */

import { WebSocketServer } from 'ws';
import { config } from '../config.js';
import { handleMessage, handleDisconnect } from './handlers.js';

/**
 * Create and start the WebSocket server
 *
 * Initializes the WebSocket server on the configured port and sets up
 * event handlers for connection, message, close, and error events.
 *
 * @returns {WebSocketServer} The created WebSocket server instance
 */
export function createWebSocketServer() {
  // Create WebSocket server on configured port (default: 8080)
  const wss = new WebSocketServer({ port: config.wsPort });

  /**
   * Broadcast a message to all clients in a specific room
   *
   * Iterates through all connected clients and sends the message
   * only to those associated with the specified room ID.
   *
   * @param {string} roomId - The room ID to broadcast to
   * @param {Object} message - The message object to broadcast (will be JSON stringified)
   */
  function broadcast(roomId, message) {
    const payload = JSON.stringify(message);

    // Send to all clients in the specified room
    wss.clients.forEach((client) => {
      // Check if client is connected (readyState 1 = OPEN) and in the target room
      if (client.readyState === 1 && client.roomId === roomId) {
        client.send(payload);
      }
    });
  }

  /**
   * Handle new WebSocket connections
   *
   * Sets up event handlers for the individual connection to process
   * incoming messages, handle disconnection, and log errors.
   */
  wss.on('connection', (ws) => {
    console.log('Player connected');

    /**
     * Handle incoming messages from the client
     * Parses JSON and routes to the appropriate handler
     */
    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);
        // Route message to handler, passing broadcast function for state updates
        handleMessage(ws, data, broadcast);
      } catch (e) {
        console.error('Invalid message:', e.message);
      }
    });

    /**
     * Handle client disconnection
     * Cleans up player from room state if game hasn't started
     */
    ws.on('close', () => {
      handleDisconnect(ws, broadcast);
    });

    /**
     * Handle WebSocket errors
     * Logs the error for debugging purposes
     */
    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
    });
  });

  console.log(`WebSocket server running at ws://localhost:${config.wsPort}`);

  return wss;
}
