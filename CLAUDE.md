# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SmallWorld is a multiplayer board game application inspired by the Small World board game. It features procedurally generated hex-based maps with real-time multiplayer room management.

## Development Commands

### Client (smallworld-client/)
```bash
cd smallworld-client
npm run dev      # Start Vite dev server (accessible on local network via host: true)
npm run build    # TypeScript compile + Vite build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Server (server/)
```bash
cd server
npm run dev      # Start server (REST API on port 3000, WebSocket on port 8080)
npm start        # Same as dev
npm test         # Run Jest tests
```

### Database
```bash
cd server
docker-compose up -d    # Start PostgreSQL on port 5433
```

## Project Structure

```
SmallWorld/
├── smallworld-client/              # React + TypeScript + Vite frontend
│   └── src/
│       ├── App.tsx                 # Main router with session management
│       ├── config.ts               # API/WebSocket URLs
│       ├── types.ts                # Shared TypeScript types
│       ├── hooks/
│       │   ├── useSession.ts       # Session persistence (sessionStorage)
│       │   └── useGameSocket.ts    # WebSocket connection manager
│       ├── pages/
│       │   ├── HomePage.tsx        # Landing page (create/join game)
│       │   ├── LobbyPage.tsx       # Pre-game setup, map config, ready status
│       │   └── GamePage.tsx        # Active gameplay
│       └── components/
│           ├── PlayerList.tsx      # Reusable player list
│           ├── MapControls.tsx     # Map configuration sliders
│           └── IrregularHexRegions.tsx  # Hex map renderer
│
└── server/                         # Node.js backend
    ├── server.js                   # Entry point
    ├── config.js                   # Configuration (ports, DB)
    ├── db.js                       # PostgreSQL connection pool
    ├── routes/
    │   ├── players.js              # Player API routes
    │   └── games.js                # Game API routes
    ├── websocket/
    │   ├── index.js                # WebSocket server setup
    │   └── handlers.js             # Message handlers
    └── utils/
        └── roomManager.js          # Room state management
```

## Architecture

### Client-Server Communication
- **REST API** on `http://localhost:3000` for player/game creation
- **WebSocket** on `ws://localhost:8080` for real-time game state
- URLs configured in `smallworld-client/src/config.ts`
- Server persists room state to `rooms.json` with debounced writes

### Client Routing
Manual URL-based routing in App.tsx using `window.history.pushState`:
- `/` - Home page (create/join game)
- `/lobby?room=X` - Pre-game setup, map config, race selection
- `/game?room=X` - Active gameplay

Session persisted to `sessionStorage` to survive page refresh.

### WebSocket Message Types
- `create` - Create or join a room (assigns host)
- `join` - Join existing room
- `set_config` - Host updates map configuration
- `set_race` - Player selects race
- `set_ready` - Player toggles ready status
- `start` - Host starts the game

Server broadcasts `state` messages to all clients in a room on any change.

### Map Generation (IrregularHexRegions.tsx)
Procedural hex map using:
1. Pointy-top axial coordinate system
2. Seeded random noise (Mulberry32 RNG)
3. Cellular automata smoothing for organic shapes
4. Connected component detection for region grouping

Map configuration parameters:
- `radius` - Hex grid radius
- `density` - Initial noise fill probability
- `smooth` - Number of smoothing passes
- `size` - Pixel size per hex tile
- `seed` - RNG seed for reproducibility

### Room/Player Model
```typescript
// Server-side room structure (roomManager.js)
{
  players: { name: string, race?: string, ready?: boolean }[],
  host?: string,        // Player name of host
  map?: MapConfig,      // Map configuration
  started?: boolean     // Game state
}
```

Host-only actions: `set_config`, `start`

## REST API Endpoints

### Players
- `POST /players` - Create player (`{ player_name }`)
- `PATCH /players/:id/ready` - Update ready status (`{ ready: boolean }`)

### Games
- `POST /games` - Create game (`{ player_id }`)
- `POST /games/:id/join` - Join game (`{ player_id }`)
- `GET /games/:id` - Get game details
- `GET /games/:id/status` - Get game status with player details
- `PATCH /games/:id/status` - Update game status

## Tech Stack
- **Client**: React 19, TypeScript, Vite 7, Tailwind-like utilities
- **Server**: Node.js (ES modules), Express 5, ws 8.18
- **Database**: PostgreSQL 16 (Docker)
- **Testing**: Jest 30
