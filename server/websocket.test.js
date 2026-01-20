import { jest } from "@jest/globals";
import { WebSocket, WebSocketServer } from "ws";

// Mock pg and fs before any imports
jest.unstable_mockModule("pg", () => ({
  default: {
    Pool: jest.fn(() => ({
      query: jest.fn().mockResolvedValue({ rows: [] }),
    })),
  },
}));

jest.unstable_mockModule("fs", () => ({
  default: {
    existsSync: jest.fn(() => false),
    readFileSync: jest.fn(() => "{}"),
    writeFileSync: jest.fn(),
  },
}));

// Test helper to create a WebSocket client connected to our server
function createClient(port) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    ws.on("open", () => resolve(ws));
    ws.on("error", reject);
  });
}

// Helper to wait for a message from WebSocket
function waitForMessage(ws, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timeout waiting for message")), timeout);
    ws.once("message", (data) => {
      clearTimeout(timer);
      resolve(JSON.parse(data.toString()));
    });
  });
}

// Helper to send a message and wait for response
async function sendAndWait(ws, message, timeout = 2000) {
  ws.send(JSON.stringify(message));
  return waitForMessage(ws, timeout);
}

describe("WebSocket Server Tests", () => {
  let wss;
  let rooms;
  const TEST_PORT = 8090;

  beforeEach(() => {
    rooms = {};
    wss = new WebSocketServer({ port: TEST_PORT });

    wss.on("connection", (ws) => {
      ws.on("message", (msg) => {
        try {
          const data = JSON.parse(msg);
          handleMessage(ws, data, rooms, wss);
        } catch (e) {
          console.error("Invalid message:", e);
        }
      });

      ws.on("close", () => {
        const { roomId, playerName } = ws;
        if (roomId && rooms[roomId]) {
          rooms[roomId].players = rooms[roomId].players.filter((p) => p.name !== playerName);
          if (rooms[roomId].host === playerName) {
            rooms[roomId].host = rooms[roomId].players[0]?.name;
          }
          broadcastState(roomId, rooms, wss);
        }
      });
    });
  });

  afterEach((done) => {
    wss.clients.forEach((client) => client.close());
    wss.close(done);
  });

  // Message handler (simplified version of server logic)
  function handleMessage(ws, data, rooms, wss) {
    if (data.type === "create") {
      const { roomId, playerName } = data;
      if (!playerName) {
        ws.send(JSON.stringify({ type: "error", code: "INVALID_PLAYER_NAME", message: "Player name required." }));
        return;
      }

      const rid = roomId || generateRoomId();
      if (rooms[rid]) {
        if (!rooms[rid].players.find((p) => p.name === playerName)) {
          rooms[rid].players.push({ name: playerName, race: undefined, ready: false });
        }
        if (!rooms[rid].host) rooms[rid].host = playerName;
      } else {
        rooms[rid] = { players: [{ name: playerName, race: undefined, ready: false }], host: playerName, map: undefined, started: false };
      }

      ws.roomId = rid;
      ws.playerName = playerName;
      ws.send(JSON.stringify({ type: "created", roomId: rid }));
      broadcastState(rid, rooms, wss);
    }

    if (data.type === "join") {
      const { roomId, playerName } = data;
      if (!playerName) {
        ws.send(JSON.stringify({ type: "error", code: "INVALID_PLAYER_NAME", message: "Player name required." }));
        return;
      }
      if (!roomId) {
        ws.send(JSON.stringify({ type: "error", code: "INVALID_ROOM_ID", message: "Room ID required." }));
        return;
      }

      if (!rooms[roomId]) {
        rooms[roomId] = { players: [], host: undefined, map: undefined, started: false };
      }

      if (rooms[roomId].started) {
        ws.send(JSON.stringify({ type: "error", code: "ROOM_STARTED", message: "Game already started for this room." }));
        return;
      }

      if (!rooms[roomId].players.find((p) => p.name === playerName)) {
        rooms[roomId].players.push({ name: playerName, race: undefined, ready: false });
      }
      if (!rooms[roomId].host) rooms[roomId].host = playerName;

      ws.roomId = roomId;
      ws.playerName = playerName;
      broadcastState(roomId, rooms, wss);
    }

    if (data.type === "set_config") {
      const { roomId, playerName, map } = data;
      const room = rooms[roomId];
      if (!room || room.host !== playerName) return;
      room.map = map;
      broadcastState(roomId, rooms, wss);
    }

    if (data.type === "set_race") {
      const { roomId, playerName, race } = data;
      const room = rooms[roomId];
      if (!room) return;
      const player = room.players.find((p) => p.name === playerName);
      if (player) player.race = race;
      broadcastState(roomId, rooms, wss);
    }

    if (data.type === "set_ready") {
      const { roomId, playerName, ready } = data;
      const room = rooms[roomId];
      if (!room) return;
      const player = room.players.find((p) => p.name === playerName);
      if (player) player.ready = ready;
      broadcastState(roomId, rooms, wss);
    }

    if (data.type === "start") {
      const { roomId, playerName } = data;
      const room = rooms[roomId];
      if (!room || room.host !== playerName) return;
      room.started = true;
      broadcastState(roomId, rooms, wss);
    }
  }

  function broadcastState(roomId, rooms, wss) {
    const room = rooms[roomId];
    if (!room) return;
    const message = JSON.stringify({
      type: "state",
      players: room.players,
      host: room.host,
      map: room.map,
      started: !!room.started,
    });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
        client.send(message);
      }
    });
  }

  function generateRoomId() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 4; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
  }

  describe("create message", () => {
    it("should create a room and set player as host", async () => {
      const client = await createClient(TEST_PORT);

      const response = await sendAndWait(client, {
        type: "create",
        roomId: "TEST1",
        playerName: "Alice",
      });

      expect(response.type).toBe("created");
      expect(response.roomId).toBe("TEST1");

      // Wait for state broadcast
      const state = await waitForMessage(client);
      expect(state.type).toBe("state");
      expect(state.host).toBe("Alice");
      expect(state.players).toHaveLength(1);
      expect(state.players[0].name).toBe("Alice");

      client.close();
    });

    it("should return error when playerName is missing", async () => {
      const client = await createClient(TEST_PORT);

      const response = await sendAndWait(client, {
        type: "create",
        roomId: "TEST2",
      });

      expect(response.type).toBe("error");
      expect(response.code).toBe("INVALID_PLAYER_NAME");

      client.close();
    });

    it("should generate roomId if not provided", async () => {
      const client = await createClient(TEST_PORT);

      const response = await sendAndWait(client, {
        type: "create",
        playerName: "Alice",
      });

      expect(response.type).toBe("created");
      expect(response.roomId).toMatch(/^[A-Z0-9]{4}$/);

      client.close();
    });

    it("should add player to existing room if room already exists", async () => {
      const client1 = await createClient(TEST_PORT);
      const client2 = await createClient(TEST_PORT);

      // First player creates room
      await sendAndWait(client1, { type: "create", roomId: "ROOM1", playerName: "Alice" });
      await waitForMessage(client1); // state

      // Second player tries to create same room
      const response = await sendAndWait(client2, { type: "create", roomId: "ROOM1", playerName: "Bob" });
      expect(response.type).toBe("created");

      // Both should receive state with 2 players
      const state = await waitForMessage(client2);
      expect(state.players).toHaveLength(2);
      expect(state.host).toBe("Alice"); // First player remains host

      client1.close();
      client2.close();
    });
  });

  describe("join message", () => {
    it("should join an existing room", async () => {
      const host = await createClient(TEST_PORT);
      const joiner = await createClient(TEST_PORT);

      // Host creates room
      await sendAndWait(host, { type: "create", roomId: "JOIN1", playerName: "Host" });
      await waitForMessage(host); // state

      // Player joins
      joiner.send(JSON.stringify({ type: "join", roomId: "JOIN1", playerName: "Joiner" }));

      // Wait for state on joiner
      const state = await waitForMessage(joiner);
      expect(state.type).toBe("state");
      expect(state.players).toHaveLength(2);
      expect(state.players.map((p) => p.name)).toContain("Joiner");

      host.close();
      joiner.close();
    });

    it("should return error when playerName is missing", async () => {
      const client = await createClient(TEST_PORT);

      const response = await sendAndWait(client, {
        type: "join",
        roomId: "TEST",
      });

      expect(response.type).toBe("error");
      expect(response.code).toBe("INVALID_PLAYER_NAME");

      client.close();
    });

    it("should return error when roomId is missing", async () => {
      const client = await createClient(TEST_PORT);

      const response = await sendAndWait(client, {
        type: "join",
        playerName: "Test",
      });

      expect(response.type).toBe("error");
      expect(response.code).toBe("INVALID_ROOM_ID");

      client.close();
    });

    it("should create room if it does not exist (for REST API compatibility)", async () => {
      const client = await createClient(TEST_PORT);

      client.send(JSON.stringify({ type: "join", roomId: "NEWROOM", playerName: "Player" }));
      const state = await waitForMessage(client);

      expect(state.type).toBe("state");
      expect(state.players).toHaveLength(1);
      expect(state.host).toBe("Player");

      client.close();
    });

    it("should not allow joining a started game", async () => {
      const host = await createClient(TEST_PORT);

      // Create and start game
      await sendAndWait(host, { type: "create", roomId: "STARTED", playerName: "Host" });
      await waitForMessage(host);
      host.send(JSON.stringify({ type: "start", roomId: "STARTED", playerName: "Host" }));
      await waitForMessage(host);

      // Try to join
      const joiner = await createClient(TEST_PORT);
      const response = await sendAndWait(joiner, { type: "join", roomId: "STARTED", playerName: "Late" });

      expect(response.type).toBe("error");
      expect(response.code).toBe("ROOM_STARTED");

      host.close();
      joiner.close();
    });

    it("should not duplicate player when rejoining", async () => {
      const client = await createClient(TEST_PORT);

      // Join twice
      client.send(JSON.stringify({ type: "join", roomId: "DUP", playerName: "Player" }));
      await waitForMessage(client);

      client.send(JSON.stringify({ type: "join", roomId: "DUP", playerName: "Player" }));
      const state = await waitForMessage(client);

      expect(state.players).toHaveLength(1);

      client.close();
    });
  });

  describe("set_config message", () => {
    it("should allow host to set map config", async () => {
      const host = await createClient(TEST_PORT);

      await sendAndWait(host, { type: "create", roomId: "CFG1", playerName: "Host" });
      await waitForMessage(host);

      const mapConfig = { radius: 12, density: 0.5, smooth: 3, size: 30, seed: 99999 };
      host.send(JSON.stringify({ type: "set_config", roomId: "CFG1", playerName: "Host", map: mapConfig }));

      const state = await waitForMessage(host);
      expect(state.map).toEqual(mapConfig);

      host.close();
    });

    it("should not allow non-host to set config", async () => {
      const host = await createClient(TEST_PORT);
      const player = await createClient(TEST_PORT);

      await sendAndWait(host, { type: "create", roomId: "CFG2", playerName: "Host" });
      await waitForMessage(host);

      player.send(JSON.stringify({ type: "join", roomId: "CFG2", playerName: "Player" }));
      await waitForMessage(player);
      await waitForMessage(host); // Host also gets state

      // Non-host tries to set config
      const mapConfig = { radius: 12, density: 0.5, smooth: 3, size: 30, seed: 99999 };
      player.send(JSON.stringify({ type: "set_config", roomId: "CFG2", playerName: "Player", map: mapConfig }));

      // Give it a moment to process
      await new Promise((r) => setTimeout(r, 100));

      // Map should still be undefined
      expect(rooms["CFG2"].map).toBeUndefined();

      host.close();
      player.close();
    });
  });

  describe("set_race message", () => {
    it("should allow player to set their own race", async () => {
      const client = await createClient(TEST_PORT);

      await sendAndWait(client, { type: "create", roomId: "RACE1", playerName: "Player" });
      await waitForMessage(client);

      client.send(JSON.stringify({ type: "set_race", roomId: "RACE1", playerName: "Player", race: "Elves" }));

      const state = await waitForMessage(client);
      expect(state.players[0].race).toBe("Elves");

      client.close();
    });

    it("should broadcast race change to all players", async () => {
      const host = await createClient(TEST_PORT);
      const player = await createClient(TEST_PORT);

      await sendAndWait(host, { type: "create", roomId: "RACE2", playerName: "Host" });
      await waitForMessage(host);

      player.send(JSON.stringify({ type: "join", roomId: "RACE2", playerName: "Player" }));
      await waitForMessage(player);
      await waitForMessage(host);

      // Player sets race
      player.send(JSON.stringify({ type: "set_race", roomId: "RACE2", playerName: "Player", race: "Orcs" }));

      // Both should receive update
      const hostState = await waitForMessage(host);
      const playerState = await waitForMessage(player);

      const playerInHost = hostState.players.find((p) => p.name === "Player");
      expect(playerInHost.race).toBe("Orcs");

      const playerInPlayer = playerState.players.find((p) => p.name === "Player");
      expect(playerInPlayer.race).toBe("Orcs");

      host.close();
      player.close();
    });
  });

  describe("set_ready message", () => {
    it("should allow player to set ready status to true", async () => {
      const client = await createClient(TEST_PORT);

      await sendAndWait(client, { type: "create", roomId: "RDY1", playerName: "Player" });
      await waitForMessage(client);

      client.send(JSON.stringify({ type: "set_ready", roomId: "RDY1", playerName: "Player", ready: true }));

      const state = await waitForMessage(client);
      expect(state.players[0].ready).toBe(true);

      client.close();
    });

    it("should allow player to toggle ready status", async () => {
      const client = await createClient(TEST_PORT);

      await sendAndWait(client, { type: "create", roomId: "RDY2", playerName: "Player" });
      await waitForMessage(client);

      // Set ready
      client.send(JSON.stringify({ type: "set_ready", roomId: "RDY2", playerName: "Player", ready: true }));
      let state = await waitForMessage(client);
      expect(state.players[0].ready).toBe(true);

      // Unset ready
      client.send(JSON.stringify({ type: "set_ready", roomId: "RDY2", playerName: "Player", ready: false }));
      state = await waitForMessage(client);
      expect(state.players[0].ready).toBe(false);

      client.close();
    });

    it("should broadcast ready status to all players", async () => {
      const host = await createClient(TEST_PORT);
      const player = await createClient(TEST_PORT);

      await sendAndWait(host, { type: "create", roomId: "RDY3", playerName: "Host" });
      await waitForMessage(host);

      player.send(JSON.stringify({ type: "join", roomId: "RDY3", playerName: "Player" }));
      await waitForMessage(player);
      await waitForMessage(host);

      // Player sets ready
      player.send(JSON.stringify({ type: "set_ready", roomId: "RDY3", playerName: "Player", ready: true }));

      // Both should receive update
      const hostState = await waitForMessage(host);
      const playerInHost = hostState.players.find((p) => p.name === "Player");
      expect(playerInHost.ready).toBe(true);

      host.close();
      player.close();
    });
  });

  describe("start message", () => {
    it("should allow host to start the game", async () => {
      const host = await createClient(TEST_PORT);

      await sendAndWait(host, { type: "create", roomId: "START1", playerName: "Host" });
      await waitForMessage(host);

      host.send(JSON.stringify({ type: "start", roomId: "START1", playerName: "Host" }));

      const state = await waitForMessage(host);
      expect(state.started).toBe(true);

      host.close();
    });

    it("should not allow non-host to start game", async () => {
      const host = await createClient(TEST_PORT);
      const player = await createClient(TEST_PORT);

      await sendAndWait(host, { type: "create", roomId: "START2", playerName: "Host" });
      await waitForMessage(host);

      player.send(JSON.stringify({ type: "join", roomId: "START2", playerName: "Player" }));
      await waitForMessage(player);
      await waitForMessage(host);

      // Non-host tries to start
      player.send(JSON.stringify({ type: "start", roomId: "START2", playerName: "Player" }));

      // Give it a moment
      await new Promise((r) => setTimeout(r, 100));

      expect(rooms["START2"].started).toBe(false);

      host.close();
      player.close();
    });

    it("should broadcast started state to all players", async () => {
      const host = await createClient(TEST_PORT);
      const player = await createClient(TEST_PORT);

      await sendAndWait(host, { type: "create", roomId: "START3", playerName: "Host" });
      await waitForMessage(host);

      player.send(JSON.stringify({ type: "join", roomId: "START3", playerName: "Player" }));
      await waitForMessage(player);
      await waitForMessage(host);

      // Host starts
      host.send(JSON.stringify({ type: "start", roomId: "START3", playerName: "Host" }));

      const hostState = await waitForMessage(host);
      const playerState = await waitForMessage(player);

      expect(hostState.started).toBe(true);
      expect(playerState.started).toBe(true);

      host.close();
      player.close();
    });
  });

  describe("player disconnect", () => {
    it("should remove player from room on disconnect", async () => {
      const host = await createClient(TEST_PORT);
      const player = await createClient(TEST_PORT);

      await sendAndWait(host, { type: "create", roomId: "DC1", playerName: "Host" });
      await waitForMessage(host);

      player.send(JSON.stringify({ type: "join", roomId: "DC1", playerName: "Player" }));
      await waitForMessage(player);
      await waitForMessage(host);

      // Player disconnects
      player.close();

      // Host should receive updated state
      const state = await waitForMessage(host);
      expect(state.players).toHaveLength(1);
      expect(state.players[0].name).toBe("Host");

      host.close();
    });

    it("should reassign host when host disconnects", async () => {
      const host = await createClient(TEST_PORT);
      const player = await createClient(TEST_PORT);

      await sendAndWait(host, { type: "create", roomId: "DC2", playerName: "Host" });
      await waitForMessage(host);

      player.send(JSON.stringify({ type: "join", roomId: "DC2", playerName: "Player" }));
      await waitForMessage(player);
      await waitForMessage(host);

      // Host disconnects
      host.close();

      // Player should receive state with new host
      const state = await waitForMessage(player);
      expect(state.host).toBe("Player");
      expect(state.players).toHaveLength(1);

      player.close();
    });
  });
});
