/**
 * Server Configuration
 *
 * Centralizes all configuration values for the SmallWorld server.
 * Includes settings for HTTP API, WebSocket, PostgreSQL database,
 * and file-based persistence.
 *
 * For production, these values should be loaded from environment
 * variables rather than hardcoded.
 */

export const config = {
  /**
   * HTTP REST API port
   * Used by Express server for player/game management endpoints
   * Client connects to: http://localhost:3000
   */
  httpPort: 3000,

  /**
   * WebSocket port
   * Used for real-time game communication
   * Client connects to: ws://localhost:8080
   */
  wsPort: 8080,

  /**
   * PostgreSQL database connection settings
   * Used for persistent storage of players and games
   */
  db: {
    host: 'localhost',
    port: 5433,           // Non-standard port to avoid conflicts
    database: 'small-world',
    user: 'postgres',
    password: 'postgres',
  },

  /**
   * Room state persistence file
   * Stores active room data for recovery after server restart
   * Written with debounced saves to avoid excessive disk I/O
   */
  roomsFile: 'rooms.json',
};
