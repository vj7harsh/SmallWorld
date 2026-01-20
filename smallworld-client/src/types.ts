/**
 * Shared TypeScript Types
 *
 * Defines all shared type definitions used across the SmallWorld client.
 * These types ensure type safety for:
 * - Map configuration
 * - Player data
 * - Room/game state
 * - Session management
 * - WebSocket message protocols
 */

/**
 * Map Configuration
 *
 * Parameters for procedural hex map generation.
 * These values control the appearance and structure of the game board.
 */
export type MapConfig = {
  /** Hex grid radius - determines overall map size (4-18) */
  radius: number;
  /** Initial fill probability for noise generation (0-1) */
  density: number;
  /** Number of cellular automata smoothing passes (0-5) */
  smooth: number;
  /** Pixel size of each hex tile (12-48) */
  size: number;
  /** Random seed for reproducible generation */
  seed: number;
};

/**
 * Player
 *
 * Represents a player in a game room.
 * Includes their identity and game-related status.
 */
export type Player = {
  /** Display name of the player */
  name: string;
  /** Selected race (e.g., 'Humans', 'Elves', 'Orcs') */
  race?: string;
  /** Whether the player is ready to start the game */
  ready?: boolean;
};

/**
 * Room State
 *
 * Complete state of a game room as received from the server.
 * Broadcast to all connected clients whenever state changes.
 */
export type RoomState = {
  /** Array of all players in the room */
  players: Player[];
  /** Name of the host player (who created the room) */
  host?: string;
  /** Current map configuration */
  map?: MapConfig;
  /** Whether the game has started */
  started: boolean;
};

/**
 * Session
 *
 * Client-side session data stored in sessionStorage.
 * Persists across page refreshes within the same browser session.
 */
export type Session = {
  /** UUID of the player from the database */
  playerId: string;
  /** Display name chosen by the player */
  playerName: string;
  /** Room ID the player is currently in */
  roomId: string;
};

/**
 * WebSocket Message Types (Client -> Server)
 *
 * All message types that the client can send to the server.
 * Each type has specific required fields.
 */
export type WSMessage =
  /** Create a new room or join as host */
  | { type: 'create'; roomId: string; playerName: string; playerId: string }
  /** Join an existing room as a player */
  | { type: 'join'; roomId: string; playerName: string; playerId: string }
  /** Update map configuration (host only) */
  | { type: 'set_config'; roomId: string; playerName: string; map: MapConfig }
  /** Set player's race selection */
  | { type: 'set_race'; roomId: string; playerName: string; race: string }
  /** Toggle player's ready status */
  | { type: 'set_ready'; roomId: string; playerName: string; playerId: string; ready: boolean }
  /** Start the game (host only) */
  | { type: 'start'; roomId: string; playerName: string };

/**
 * WebSocket Response Types (Server -> Client)
 *
 * All message types that the server can send to clients.
 * Clients should handle each type appropriately.
 */
export type WSResponse =
  /** Confirmation that a room was created */
  | { type: 'created'; roomId: string }
  /** Updated room state broadcast to all clients */
  | { type: 'state'; players: Player[]; host?: string; map?: MapConfig; started: boolean }
  /** Error response with code and message */
  | { type: 'error'; code: string; message: string };
