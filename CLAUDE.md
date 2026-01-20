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
npm run dev      # Start WebSocket server on port 8080
npm start        # Same as dev
```

## Architecture

### Client-Server Communication
- WebSocket connection on `ws://10.0.0.234:8080` (hardcoded in App.tsx:53)
- Server persists room state to `rooms.json` with debounced writes
- Message types: `create`, `join`, `set_config`, `set_race`, `start`
- Server broadcasts `state` messages to all clients in a room

### Client Routing
Manual URL-based routing in App.tsx using `window.history.pushState`:
- `/home` - Room creation/joining (Home.tsx)
- `/setup?room-id=X` - Pre-game setup, map config, race selection (SetupPage.tsx)
- `/game?room-id=X` - Active gameplay (GamePage.tsx)

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
// Server-side room structure
{
  players: { name: string, race?: string }[],
  host?: string,        // Player name of host
  map?: MapCfg,         // Map configuration
  started?: boolean     // Game state
}
```

Host-only actions: `set_config`, `start`

## Tech Stack
- **Client**: React 19, TypeScript, Vite 7, Bootstrap 5
- **Server**: Node.js with `ws` WebSocket library
