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
import session from 'express-session';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import playerRoutes from './routes/players.js';
import gameRoutes from './routes/games.js';
import { createWebSocketServer } from './websocket/index.js';

// Initialize Express app for REST APIs
const app = express();

// Enable CORS for cross-origin requests from the client
// credentials: true allows cookies to be sent cross-origin
app.use(cors({
  origin: 'http://localhost:5173',  // Vite dev server
  credentials: true,                 // Allow cookies
}));

// Parse JSON request bodies
app.use(express.json());

// Session middleware for authentication
// Uses in-memory store (sessions lost on server restart)
app.use(session({
  secret: 'smallworld-secret-key',  // Secret for signing session ID cookie
  resave: false,                     // Don't save session if unmodified
  saveUninitialized: false,          // Don't create session until something stored
  cookie: {
    secure: false,                   // Set to true in production with HTTPS
    httpOnly: true,                  // Prevent client-side JS access to cookie
    maxAge: 24 * 60 * 60 * 1000,     // 24 hours
    sameSite: 'lax',                 // Protect against CSRF
  },
}));

// Mount route handlers
app.use('/auth', authRoutes);        // Authentication endpoints
app.use('/players', playerRoutes);   // Player management endpoints
app.use('/games', gameRoutes);       // Game/room management endpoints

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
