/**
 * Client Configuration
 *
 * Centralizes API and WebSocket URLs for the SmallWorld client.
 * Update these values when deploying to different environments
 * or when server addresses change.
 *
 * For production, consider loading these from environment variables
 * using Vite's import.meta.env feature.
 */

/**
 * REST API base URL
 * Used for player creation and game management endpoints
 * Example endpoints: POST /players, POST /games, POST /games/:id/join
 */
export const API_URL = 'http://localhost:3000';

/**
 * WebSocket server URL
 * Used for real-time game communication
 * Handles room state updates, player actions, and game events
 */
export const WS_URL = 'ws://localhost:8080';
