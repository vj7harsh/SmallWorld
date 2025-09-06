import { useState } from 'react';
import Home from './components/Home';
import IrregularHexRegions from './components/IrregularHexRegions';

function App() {
  const [started, setStarted] = useState(false);

  const handleStart = (mode: 'create' | 'join', players: number) => {
    console.log(`Mode: ${mode}, players: ${players}`);
    setStarted(true);
  };

  if (started) {
    return <IrregularHexRegions />;
  }

  return <Home onStart={handleStart} />;
}

export default App;
