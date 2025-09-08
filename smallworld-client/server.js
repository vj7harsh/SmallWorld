import { WebSocketServer } from "ws";
import fs from "fs";
import path from "path";

const DATA_PATH = path.resolve(process.cwd(), "rooms.json");

function loadRoomsFromDisk() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (e) {
    console.error("Failed to load rooms.json:", e);
  }
  return {};
}

let persistTimer = null;
function persistRoomsDebounced(obj) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DATA_PATH, JSON.stringify(obj, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write rooms.json:", e);
    }
  }, 100);
}

const wss = new WebSocketServer({ port: 8080 });

// Track rooms & players
// rooms = { [roomId]: { players: { name: string, race?: string }[], host?: string, map?: any, started?: boolean } }
const rooms = loadRoomsFromDisk();

wss.on("connection", (ws) => {
  console.log("Player connected");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "join") {
        const { roomId, playerName } = data;
        if (!roomId || !playerName) return;

        if (!rooms[roomId]) rooms[roomId] = { players: [], host: undefined, map: undefined, started: false };

        // Avoid duplicates
        if (!rooms[roomId].players.find((p) => p.name === playerName)) {
          rooms[roomId].players.push({ name: playerName, race: undefined });
        }

        // Assign host if missing
        if (!rooms[roomId].host) rooms[roomId].host = playerName;

        ws.roomId = roomId;
        ws.playerName = playerName;

        broadcastState(roomId);
        persistRoomsDebounced(rooms);
      }

      if (data.type === "set_config") {
        const { roomId, playerName, map } = data;
        const room = rooms[roomId];
        if (!room) return;
        if (room.host !== playerName) return; // only host can set config
        room.map = map;
        broadcastState(roomId);
        persistRoomsDebounced(rooms);
      }

      if (data.type === "set_race") {
        const { roomId, playerName, race } = data;
        const room = rooms[roomId];
        if (!room) return;
        const player = room.players.find((p) => p.name === playerName);
        if (!player) return;
        player.race = race;
        broadcastState(roomId);
        persistRoomsDebounced(rooms);
      }

      if (data.type === "start") {
        const { roomId, playerName } = data;
        const room = rooms[roomId];
        if (!room) return;
        if (room.host !== playerName) return; // only host can start
        room.started = true;
        broadcastState(roomId);
        persistRoomsDebounced(rooms);
      }
    } catch (e) {
      console.error("Invalid message:", e);
    }
  });

  ws.on("close", () => {
    const { roomId, playerName } = ws;
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      room.players = room.players.filter((p) => p.name !== playerName);
      if (room.host === playerName) {
        room.host = room.players[0]?.name; // reassign host to first player if available
      }
      broadcastState(roomId);
      persistRoomsDebounced(rooms);
    }
  });
});

function broadcast(roomId, message) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.roomId === roomId) {
      client.send(JSON.stringify(message));
    }
  });
}

function broadcastState(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  broadcast(roomId, {
    type: "state",
    players: room.players,
    host: room.host,
    map: room.map,
    started: !!room.started,
  });
}

console.log("WebSocket server running at ws://localhost:8080");
