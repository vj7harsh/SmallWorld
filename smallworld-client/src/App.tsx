import { useState } from "react";
import Home from "./components/Home";
import MapPage from "./components/MapPage";

function App() {
  const [players, setPlayers] = useState<number | null>(null);
  const [mode, setMode] = useState<"create" | "join" | null>(null);

  const handleStart = (m: "create" | "join", p: number) => {
    console.log(`Mode: ${m}, players: ${p}`);
    setMode(m);
    setPlayers(p);
  };

  if (players !== null && mode !== null) {
    return <MapPage players={players} mode={mode} />;
  }

  return <Home onStart={handleStart} />;
}

export default App;
