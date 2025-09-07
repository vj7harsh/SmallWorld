import { useState } from 'react';

interface HomeProps {
  onCreate: (roomId: string, playerName: string) => void;
  onJoin: (roomId: string, playerName: string) => void;
}

export default function Home({ onCreate, onJoin }: HomeProps) {
  const [roomId, setRoomId] = useState('game123');
  const [playerName, setPlayerName] = useState('');

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col gap-4 p-6 rounded-xl border bg-white/80 shadow-sm min-w-[320px]">
        <h2 className="text-lg font-semibold">SmallWorld</h2>
        <input
          type="text"
          placeholder="Your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="border p-2 rounded"
        />
        <div className="flex gap-3">
          <button
            onClick={() => onCreate(roomId, playerName)}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            disabled={!playerName || !roomId}
          >
            Create Game
          </button>
          <button
            onClick={() => onJoin(roomId, playerName)}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={!playerName || !roomId}
          >
            Join Game
          </button>
        </div>
      </div>
    </div>
  );
}
