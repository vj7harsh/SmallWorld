import { useState } from 'react';

interface HomeProps {
  onStart: (mode: 'create' | 'join', players: number) => void;
}

export default function Home({ onStart }: HomeProps) {
  const [players, setPlayers] = useState(2);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-6">
      <div className="flex items-center gap-2">
        <label className="text-sm opacity-80">Players</label>
        <input
          type="number"
          min={2}
          max={8}
          value={players}
          onChange={(e) => setPlayers(parseInt(e.target.value, 10))}
          className="w-16 rounded-md border px-1 py-0.5 text-center bg-white/80 dark:bg-black/20"
        />
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => onStart('create', players)}
          className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 ring-1 ring-black/10 text-sm"
        >
          Create Room
        </button>
        <button
          onClick={() => onStart('join', players)}
          className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 ring-1 ring-black/10 text-sm"
        >
          Join Room
        </button>
      </div>
    </div>
  );
}

