import React from "react";

type Player = { name: string; race?: string };

interface GameSidebarProps {
  roomId: string;
  playerName: string;
  players: Player[];
}

export default function GameSidebar({ roomId, playerName, players }: GameSidebarProps) {
  const me = players.find((p) => p.name === playerName);

  return (
    <aside className="shrink-0 h-full p-4 flex flex-col gap-3 bg-gray-100 dark:bg-neutral-900 border border-black">
      <h2 className="font-semibold text-lg">Room: {roomId}</h2>
      <div className="text-sm">
        You are: <b>{playerName}</b>
        {me?.race ? ` (${me.race})` : ""}
      </div>
      <div className="mt-2">
        <h3 className="font-semibold text-sm">Players</h3>
        <ul className="list-disc ml-5 text-sm">
          {players.map((p) => {
            const isMe = p.name === playerName;
            return (
              <li
                key={p.name}
                className={isMe ? "font-semibold text-blue-600" : undefined}
                title={isMe ? "This is you" : undefined}
              >
                {p.name}
                {isMe ? " (You)" : ""}
                {p.race ? ` — ${p.race}` : ""}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
