import { create } from "zustand";
import { MultiplayerClient } from "@/lib/multiplayer/MultiplayerClient";
import type { MultiplayerStatus, RemotePlayer } from "@/lib/multiplayer/types";

type MultiplayerStore = {
  status: MultiplayerStatus;
  error: string | null;
  roomId: string | null;
  localId: string | null;
  playerName: string;
  remotePlayers: RemotePlayer[];
  client: MultiplayerClient | null;
  initClient: () => void;
  setPlayerName: (name: string) => void;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  leaveRoom: () => void;
  pushLocalState: (state: Omit<RemotePlayer, "id" | "name">) => void;
};

let clientInstance: MultiplayerClient | null = null;

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  status: "offline",
  error: null,
  roomId: null,
  localId: null,
  playerName: "Surfer",
  remotePlayers: [],
  client: null,

  initClient: () => {
    if (clientInstance) return;
    clientInstance = new MultiplayerClient({
      onStatus: (status, message) =>
        set({
          status: status === "connected" ? "connected" : status === "error" ? "error" : "connecting",
          error: message ?? null,
          roomId: clientInstance?.getRoomId() ?? null,
        }),
      onPlayers: (players, localId) => {
        const remotes = players.filter((p) => p.id !== localId);
        set({ remotePlayers: remotes, localId, roomId: clientInstance?.getRoomId() ?? null });
      },
    });
    set({ client: clientInstance });
  },

  setPlayerName: (playerName) => set({ playerName }),

  createRoom: () => {
    get().initClient();
    clientInstance?.createRoom(get().playerName);
  },

  joinRoom: (code) => {
    get().initClient();
    clientInstance?.joinRoom(code.toUpperCase(), get().playerName);
  },

  leaveRoom: () => {
    clientInstance?.leave();
    set({ status: "offline", roomId: null, localId: null, remotePlayers: [], error: null });
  },

  pushLocalState: (state) => {
    clientInstance?.pushState({
      x: state.x,
      y: state.y,
      z: state.z,
      qx: state.qx,
      qy: state.qy,
      qz: state.qz,
      qw: state.qw,
      speed: state.speed,
      score: state.score,
    });
  },
}));