const BASE_URL = "http://localhost:3000";

async function request(method, path, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

describe("Game API Tests", () => {
  let player1, player2, gameId;

  describe("Player Creation", () => {
    test("should create a new player", async () => {
      const { status, data } = await request("POST", "/players", {
        player_name: "TestPlayer1",
      });

      expect(status).toBe(201);
      expect(data).toHaveProperty("player_id");
      expect(data).toHaveProperty("player_name", "TestPlayer1");
      player1 = data;
    });

    test("should create a second player", async () => {
      const { status, data } = await request("POST", "/players", {
        player_name: "TestPlayer2",
      });

      expect(status).toBe(201);
      expect(data).toHaveProperty("player_id");
      expect(data).toHaveProperty("player_name", "TestPlayer2");
      player2 = data;
    });

    test("should fail to create player without name", async () => {
      const { status, data } = await request("POST", "/players", {});

      expect(status).toBe(400);
      expect(data).toHaveProperty("error", "player_name is required");
    });
  });

  describe("Game Creation", () => {
    test("should create a new game", async () => {
      const { status, data } = await request("POST", "/games", {
        player_id: player1.player_id,
      });

      expect(status).toBe(201);
      expect(data).toHaveProperty("game_id");
      expect(data).toHaveProperty("message", "Game room created successfully.");
      gameId = data.game_id;
    });

    test("should fail to create game without player_id", async () => {
      const { status, data } = await request("POST", "/games", {});

      expect(status).toBe(400);
      expect(data).toHaveProperty("error", "player_id is required");
    });

    test("game should have creator in players list", async () => {
      const { status, data } = await request("GET", `/games/${gameId}`);

      expect(status).toBe(200);
      expect(data.players_list).toContain(player1.player_id);
      expect(data.game_status).toBe("waiting");
    });
  });

  describe("Join Game", () => {
    test("should allow second player to join game", async () => {
      const { status, data } = await request("POST", `/games/${gameId}/join`, {
        player_id: player2.player_id,
      });

      expect(status).toBe(200);
      expect(data).toHaveProperty("message", "Joined game room successfully.");
    });

    test("game should have both players in list", async () => {
      const { status, data } = await request("GET", `/games/${gameId}`);

      expect(status).toBe(200);
      expect(data.players_list).toContain(player1.player_id);
      expect(data.players_list).toContain(player2.player_id);
      expect(data.players_list.length).toBe(2);
    });

    test("should fail to join non-existent game", async () => {
      const { status, data } = await request(
        "POST",
        "/games/00000000-0000-0000-0000-000000000000/join",
        { player_id: player2.player_id }
      );

      expect(status).toBe(404);
      expect(data).toHaveProperty("error", "Game room not found");
    });

    test("should fail to join without player_id", async () => {
      const { status, data } = await request("POST", `/games/${gameId}/join`, {});

      expect(status).toBe(400);
      expect(data).toHaveProperty("error", "player_id is required");
    });
  });

  describe("Game Status", () => {
    test("should return game status with player details", async () => {
      const { status, data } = await request("GET", `/games/${gameId}/status`);

      expect(status).toBe(200);
      expect(data).toHaveProperty("game_id", gameId);
      expect(data).toHaveProperty("game_status", "waiting");
      expect(data).toHaveProperty("player_count", 2);
      expect(data).toHaveProperty("players");
      expect(Array.isArray(data.players)).toBe(true);
      expect(data.players.length).toBe(2);

      // Verify player details are included
      const playerNames = data.players.map((p) => p.player_name);
      expect(playerNames).toContain("TestPlayer1");
      expect(playerNames).toContain("TestPlayer2");

      // Verify player fields
      data.players.forEach((player) => {
        expect(player).toHaveProperty("player_id");
        expect(player).toHaveProperty("player_name");
        expect(player).toHaveProperty("player_status");
        expect(player).toHaveProperty("score");
      });
    });

    test("should return 404 for non-existent game status", async () => {
      const { status, data } = await request(
        "GET",
        "/games/00000000-0000-0000-0000-000000000000/status"
      );

      expect(status).toBe(404);
      expect(data).toHaveProperty("error", "Game not found");
    });
  });

  describe("Player Ready Status", () => {
    test("should update player ready status to true", async () => {
      const { status, data } = await request(
        "PATCH",
        `/players/${player1.player_id}/ready`,
        { ready: true }
      );

      expect(status).toBe(200);
      expect(data).toHaveProperty("player_id", player1.player_id);
      expect(data).toHaveProperty("player_status", "ready");
    });

    test("should update player ready status to false", async () => {
      const { status, data } = await request(
        "PATCH",
        `/players/${player1.player_id}/ready`,
        { ready: false }
      );

      expect(status).toBe(200);
      expect(data).toHaveProperty("player_id", player1.player_id);
      expect(data).toHaveProperty("player_status", "not_ready");
    });

    test("should fail when ready is not a boolean", async () => {
      const { status, data } = await request(
        "PATCH",
        `/players/${player1.player_id}/ready`,
        { ready: "yes" }
      );

      expect(status).toBe(400);
      expect(data).toHaveProperty("error", "ready must be a boolean");
    });

    test("should return 404 for non-existent player", async () => {
      const { status, data } = await request(
        "PATCH",
        "/players/00000000-0000-0000-0000-000000000000/ready",
        { ready: true }
      );

      expect(status).toBe(404);
      expect(data).toHaveProperty("error", "Player not found");
    });
  });

  describe("Game Status Update", () => {
    test("should update game status to started", async () => {
      const { status, data } = await request(
        "PATCH",
        `/games/${gameId}/status`,
        { status: "started" }
      );

      expect(status).toBe(200);
      expect(data).toHaveProperty("game_id", gameId);
      expect(data).toHaveProperty("game_status", "started");
    });

    test("should fail when status is missing", async () => {
      const { status, data } = await request(
        "PATCH",
        `/games/${gameId}/status`,
        {}
      );

      expect(status).toBe(400);
      expect(data).toHaveProperty("error", "status is required");
    });

    test("should return 404 for non-existent game", async () => {
      const { status, data } = await request(
        "PATCH",
        "/games/00000000-0000-0000-0000-000000000000/status",
        { status: "started" }
      );

      expect(status).toBe(404);
      expect(data).toHaveProperty("error", "Game not found");
    });

    test("should not allow joining a started game", async () => {
      // Create a new player to try joining
      const { data: newPlayer } = await request("POST", "/players", {
        player_name: "LateJoiner",
      });

      const { status, data } = await request(
        "POST",
        `/games/${gameId}/join`,
        { player_id: newPlayer.player_id }
      );

      expect(status).toBe(400);
      expect(data).toHaveProperty("error", "Game has already started");
    });
  });
});
