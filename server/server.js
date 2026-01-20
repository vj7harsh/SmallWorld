/**
 * SmallWorld Server Entry Point
 *
 * This file initializes and starts both the REST API server (Express)
 * and the WebSocket server for real-time game communication.
 *
 * REST API runs on port 3000 (configurable in config.js)
 * WebSocket runs on port 8080 (configurable in config.js)
 */

import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import playerRoutes from './routes/players.js';
import gameRoutes from './routes/games.js';
import { createWebSocketServer } from './websocket/index.js';

// Initialize Express app for REST APIs
const app = express();

// Enable CORS for cross-origin requests from the client
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Mount route handlers
app.use('/players', playerRoutes);  // Player management endpoints
app.use('/games', gameRoutes);      // Game/room management endpoints

/**
 * Health check endpoint
 * Used to verify the server is running
 * GET /health -> { status: 'ok' }
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start the HTTP server for REST API
app.listen(config.httpPort, () => {
  console.log(`REST API server running at http://localhost:${config.httpPort}`);
});

// Start the WebSocket server for real-time communication
createWebSocketServer();
