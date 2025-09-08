import { useEffect, useState } from "react";
import Home from "./components/Home";
import SetupPage from "./components/SetupPage";
import GamePage from "./components/GamePage";

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [route, setRoute] = useState<{ page: "home" | "setup" | "game"; roomId?: string }>(() => {
    const { pathname, search } = window.location;
    const sp = new URLSearchParams(search);
    const rid = sp.get("room-id") || undefined;
    if (pathname.startsWith("/setup")) return { page: "setup", roomId: rid };
    if (pathname.startsWith("/game")) return { page: "game", roomId: rid };
    return { page: "home" };
  });

  // Optional: carry a fixed map config when starting a game later
  const [mapConfig, setMapConfig] = useState<
    { radius: number; density: number; smooth: number; size: number; seed: number } | undefined
  >(undefined);

  useEffect(() => {
    const onPop = () => {
      const { pathname, search } = window.location;
      const sp = new URLSearchParams(search);
      const rid = sp.get("room-id") || undefined;
      if (pathname.startsWith("/setup")) setRoute({ page: "setup", roomId: rid });
      else if (pathname.startsWith("/game")) setRoute({ page: "game", roomId: rid });
      else setRoute({ page: "home" });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (page: "home" | "setup" | "game", rid?: string) => {
    if (page === "home") {
      window.history.pushState({}, "", "/home");
      setRoute({ page: "home" });
    } else if (page === "setup") {
      const qs = rid ? `?room-id=${encodeURIComponent(rid)}` : "";
      window.history.pushState({}, "", `/setup${qs}`);
      setRoute({ page: "setup", roomId: rid });
    } else {
      const qs = rid ? `?room-id=${encodeURIComponent(rid)}` : "";
      window.history.pushState({}, "", `/game${qs}`);
      setRoute({ page: "game", roomId: rid });
    }
  };

  const connectAndJoin = (room: string, name: string) => {
    const socket = new WebSocket("ws://10.0.0.234:8080");
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "join", roomId: room, playerName: name }));
    };
    setWs(socket);
    setRoomId(room);
    setPlayerName(name);
    navigate("setup", room);
  };

  if (route.page === "setup" && ws) {
    return (
      <SetupPage
        ws={ws}
        roomId={roomId || route.roomId || ""}
        playerName={playerName}
        onStart={(map) => {
          setMapConfig(map);
          navigate("game", roomId || route.roomId || "");
        }}
      />
    );
  }

  if (route.page === "game" && ws) {
    return (
      <GamePage
        ws={ws}
        roomId={roomId || route.roomId || ""}
        playerName={playerName}
        map={mapConfig}
      />
    );
  }
  // Ensure we present the home route by default at /home
  if (route.page === "home" && window.location.pathname !== "/home") navigate("home");
  return <Home onCreate={connectAndJoin} onJoin={connectAndJoin} />;
}

export default App;
