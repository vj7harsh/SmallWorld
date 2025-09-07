import { useState } from "react";
import Home from "./components/Home";
import SetupPage from "./components/SetupPage";
import GamePage from "./components/GamePage";

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [phase, setPhase] = useState<"home" | "setup" | "game">("home");

  // Optional: carry a fixed map config when starting a game later
  const [mapConfig, setMapConfig] = useState<
    { radius: number; density: number; smooth: number; size: number; seed: number } | undefined
  >(undefined);

  const connectAndJoin = (room: string, name: string) => {
    const socket = new WebSocket("ws://localhost:8080");
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "join", roomId: room, playerName: name }));
    };
    setWs(socket);
    setRoomId(room);
    setPlayerName(name);
    setPhase("setup");
  };

  if (phase === "setup" && ws) {
    return (
      <SetupPage
        ws={ws}
        roomId={roomId}
        playerName={playerName}
        onStart={(map) => {
          setMapConfig(map);
          setPhase("game");
        }}
      />
    );
  }

  if (phase === "game" && ws) {
    return <GamePage ws={ws} roomId={roomId} playerName={playerName} map={mapConfig} />;
  }

  return <Home onCreate={connectAndJoin} onJoin={connectAndJoin} />;
}

export default App;
