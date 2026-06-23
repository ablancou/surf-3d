import type { RemotePlayer } from "@/lib/multiplayer/types";
import { resolveWsUrl } from "@/lib/multiplayer/wsUrl";

export type MultiplayerCallbacks = {
  onStatus: (status: "connecting" | "connected" | "error", message?: string) => void;
  onPlayers: (players: RemotePlayer[], localId: string | null) => void;
};

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private localId: string | null = null;
  private roomId: string | null = null;
  private callbacks: MultiplayerCallbacks;
  private sendTimer: ReturnType<typeof setInterval> | null = null;
  private pendingState: Record<string, number> | null = null;

  constructor(callbacks: MultiplayerCallbacks) {
    this.callbacks = callbacks;
  }

  createRoom(name: string) {
    this.connect(() => this.ws?.send(JSON.stringify({ type: "create_room", name })));
  }

  joinRoom(roomId: string, name: string) {
    this.connect(() => this.ws?.send(JSON.stringify({ type: "join_room", roomId, name })));
  }

  leave() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "leave" }));
    }
    this.cleanup();
    this.callbacks.onStatus("connecting");
    this.callbacks.onPlayers([], null);
  }

  pushState(state: {
    x: number;
    y: number;
    z: number;
    qx: number;
    qy: number;
    qz: number;
    qw: number;
    speed: number;
    score: number;
  }) {
    this.pendingState = state;
  }

  getLocalId() {
    return this.localId;
  }

  getRoomId() {
    return this.roomId;
  }

  private connect(onOpen?: () => void) {
    this.cleanup();
    this.callbacks.onStatus("connecting");

    try {
      this.ws = new WebSocket(resolveWsUrl());
    } catch {
      this.callbacks.onStatus("error", "WebSocket unavailable");
      return;
    }

    this.ws.onopen = () => {
      this.callbacks.onStatus("connected");
      onOpen?.();
      this.sendTimer = setInterval(() => {
        if (!this.pendingState || this.ws?.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({ type: "state", ...this.pendingState }));
      }, 50);
    };

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as Record<string, unknown>;
        if (msg.type === "joined") {
          this.localId = String(msg.playerId);
          this.roomId = String(msg.roomId);
          const players = (msg.players as RemotePlayer[]) ?? [];
          this.callbacks.onPlayers(players, this.localId);
        }
        if (msg.type === "sync") {
          const players = (msg.players as RemotePlayer[]) ?? [];
          this.callbacks.onPlayers(players, this.localId);
        }
        if (msg.type === "player_joined" || msg.type === "player_left") {
          // next sync will update
        }
        if (msg.type === "error") {
          this.callbacks.onStatus("error", String(msg.message));
        }
      } catch {
        // ignore
      }
    };

    this.ws.onerror = () => {
      this.callbacks.onStatus("error", "No se pudo conectar al servidor multiplayer");
    };

    this.ws.onclose = () => {
      if (this.sendTimer) this.callbacks.onStatus("error", "Disconnected");
    };
  }

  private cleanup() {
    if (this.sendTimer) clearInterval(this.sendTimer);
    this.sendTimer = null;
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }
    this.ws = null;
    this.localId = null;
    this.roomId = null;
  }
}