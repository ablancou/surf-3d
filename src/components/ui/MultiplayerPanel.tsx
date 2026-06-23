"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMultiplayerStore } from "@/stores/multiplayerStore";

export function MultiplayerPanel() {
  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const status = useMultiplayerStore((s) => s.status);
  const roomId = useMultiplayerStore((s) => s.roomId);
  const error = useMultiplayerStore((s) => s.error);
  const playerName = useMultiplayerStore((s) => s.playerName);
  const remotePlayers = useMultiplayerStore((s) => s.remotePlayers);
  const setPlayerName = useMultiplayerStore((s) => s.setPlayerName);
  const createRoom = useMultiplayerStore((s) => s.createRoom);
  const joinRoom = useMultiplayerStore((s) => s.joinRoom);
  const leaveRoom = useMultiplayerStore((s) => s.leaveRoom);
  const initClient = useMultiplayerStore((s) => s.initClient);

  const connected = status === "connected";

  return (
    <div className="pointer-events-auto absolute top-16 left-4 z-10 md:top-4 md:left-auto md:right-44">
      <Button
        variant="secondary"
        size="sm"
        className="bg-black/40 text-white backdrop-blur hover:bg-black/55"
        onClick={() => {
          setOpen((v) => !v);
          initClient();
        }}
      >
        {connected ? `Sala ${roomId}` : "Multijugador"}
      </Button>
      {open && (
        <div className="mt-2 w-72 rounded-xl border border-white/20 bg-black/55 p-4 text-sm text-white backdrop-blur-md">
          {!connected ? (
            <>
              <label className="mb-1 block text-xs text-white/60">Tu nombre</label>
              <input
                className="mb-3 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white outline-none"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={createRoom}>
                  Crear sala
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 uppercase text-white outline-none"
                  placeholder="CODE"
                  maxLength={4}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />
                <Button size="sm" variant="secondary" onClick={() => joinRoom(joinCode)}>
                  Unirse
                </Button>
              </div>
              {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
              <p className="mt-2 text-xs text-white/50">Local: npm run dev:mp</p>
            </>
          ) : (
            <>
              <p className="font-semibold">Sala {roomId}</p>
              <p className="mb-2 text-xs text-white/60">
                {remotePlayers.length + 1} surfers conectados
              </p>
              <ul className="mb-3 space-y-1 text-xs text-white/80">
                <li>Tú ({playerName})</li>
                {remotePlayers.map((p) => (
                  <li key={p.id}>
                    {p.name} — {p.score} pts
                  </li>
                ))}
              </ul>
              <Button size="sm" variant="destructive" className="w-full" onClick={leaveRoom}>
                Salir de la sala
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}