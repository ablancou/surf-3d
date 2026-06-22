import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import { addEntry, getEntries, type LbEntry } from "./leaderboard";

const PORT = Number(process.env.WS_PORT ?? 3001);

type PlayerState = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
  speed: number;
  score: number;
  lastSeen: number;
};

type Room = Map<string, PlayerState>;

const rooms = new Map<string, Room>();
const socketRoom = new Map<WebSocket, { roomId: string; playerId: string }>();

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function broadcast(roomId: string, data: unknown, except?: WebSocket) {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify(data);
  for (const [ws, meta] of socketRoom) {
    if (meta.roomId === roomId && ws !== except && ws.readyState === ws.OPEN) {
      ws.send(msg);
    }
  }
}

function roomSnapshot(room: Room) {
  return Array.from(room.values()).map(({ id, name, x, y, z, qx, qy, qz, qw, speed, score }) => ({
    id,
    name,
    x,
    y,
    z,
    qx,
    qy,
    qz,
    qw,
    speed,
    score,
  }));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

async function handleHttp(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/leaderboard" || req.url === "/leaderboard/") {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ entries: getEntries(50), source: "ws-server" }));
      return;
    }
    if (req.method === "POST") {
      try {
        const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
        const entry = addEntry({
          name: String(body.name ?? "Surfer").slice(0, 20),
          score: Math.floor(Number(body.score ?? 0)),
          spot: String(body.spot ?? "Unknown").slice(0, 32),
          maxCombo: Number(body.maxCombo ?? 0),
          maxSpeed: Number(body.maxSpeed ?? 0),
          tricks: Number(body.tricks ?? 0),
          replay: body.replay as LbEntry["replay"],
        });
        const rank = getEntries(50).findIndex((e) => e.id === entry.id) + 1;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ entry, rank }));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Bad request" }));
      }
      return;
    }
  }

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404);
  res.end();
}

const server = createServer((req, res) => {
  void handleHttp(req, res);
});
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as Record<string, unknown>;

      if (msg.type === "create_room") {
        const roomId = makeRoomCode();
        const playerId = makeId();
        const name = String(msg.name ?? "Surfer").slice(0, 16);
        rooms.set(roomId, new Map());
        const room = rooms.get(roomId)!;
        const player: PlayerState = {
          id: playerId,
          name,
          x: 0,
          y: 2,
          z: -8,
          qx: 0,
          qy: 0,
          qz: 0,
          qw: 1,
          speed: 0,
          score: 0,
          lastSeen: Date.now(),
        };
        room.set(playerId, player);
        socketRoom.set(ws, { roomId, playerId });
        ws.send(JSON.stringify({ type: "joined", roomId, playerId, players: roomSnapshot(room) }));
        return;
      }

      if (msg.type === "join_room") {
        const roomId = String(msg.roomId ?? "").toUpperCase();
        const name = String(msg.name ?? "Surfer").slice(0, 16);
        const room = rooms.get(roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
          return;
        }
        if (room.size >= 8) {
          ws.send(JSON.stringify({ type: "error", message: "Room full" }));
          return;
        }
        const playerId = makeId();
        const player: PlayerState = {
          id: playerId,
          name,
          x: 0,
          y: 2,
          z: -8,
          qx: 0,
          qy: 0,
          qz: 0,
          qw: 1,
          speed: 0,
          score: 0,
          lastSeen: Date.now(),
        };
        room.set(playerId, player);
        socketRoom.set(ws, { roomId, playerId });
        ws.send(JSON.stringify({ type: "joined", roomId, playerId, players: roomSnapshot(room) }));
        broadcast(roomId, { type: "player_joined", player: roomSnapshot(room).find((p) => p.id === playerId) });
        return;
      }

      if (msg.type === "state") {
        const meta = socketRoom.get(ws);
        if (!meta) return;
        const room = rooms.get(meta.roomId);
        if (!room) return;
        const player = room.get(meta.playerId);
        if (!player) return;

        player.x = Number(msg.x ?? player.x);
        player.y = Number(msg.y ?? player.y);
        player.z = Number(msg.z ?? player.z);
        player.qx = Number(msg.qx ?? player.qx);
        player.qy = Number(msg.qy ?? player.qy);
        player.qz = Number(msg.qz ?? player.qz);
        player.qw = Number(msg.qw ?? player.qw);
        player.speed = Number(msg.speed ?? player.speed);
        player.score = Number(msg.score ?? player.score);
        player.lastSeen = Date.now();
        return;
      }

      if (msg.type === "leave") {
        const meta = socketRoom.get(ws);
        if (!meta) return;
        const room = rooms.get(meta.roomId);
        room?.delete(meta.playerId);
        broadcast(meta.roomId, { type: "player_left", playerId: meta.playerId });
        if (room && room.size === 0) rooms.delete(meta.roomId);
        socketRoom.delete(ws);
      }
    } catch {
      // ignore malformed
    }
  });

  ws.on("close", () => {
    const meta = socketRoom.get(ws);
    if (!meta) return;
    const room = rooms.get(meta.roomId);
    room?.delete(meta.playerId);
    broadcast(meta.roomId, { type: "player_left", playerId: meta.playerId });
    if (room && room.size === 0) rooms.delete(meta.roomId);
    socketRoom.delete(ws);
  });
});

setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    for (const [id, p] of room) {
      if (now - p.lastSeen > 15000) room.delete(id);
    }
    if (room.size === 0) {
      rooms.delete(roomId);
      continue;
    }
    broadcast(roomId, { type: "sync", players: roomSnapshot(room), serverTime: now });
  }
}, 50);

server.listen(PORT, () => {
  console.log(`Surf 3D server http://localhost:${PORT} · ws://localhost:${PORT}`);
});