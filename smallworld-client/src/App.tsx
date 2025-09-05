import { Client } from 'boardgame.io/react';
import { SmallWorldGame } from './game';
import Board from './components/Board';
import './App.css';

const SmallWorldClient = Client({
  game: SmallWorldGame,
  board: Board,
});

function App() {
  return (
    <div className="App">
      <h1>Small World Prototype</h1>
      <SmallWorldClient />
    </div>
  );
}

export default App;
