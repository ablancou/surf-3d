import type { LeaderboardEntry, SubmitScorePayload } from "@/lib/leaderboard/types";

const MAX_ENTRIES = 100;

/** Singleton in-memory leaderboard — used by Next.js API routes */
let entries: LeaderboardEntry[] = [];

export function getLeaderboard(limit = 50): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function submitScore(payload: SubmitScorePayload): LeaderboardEntry {
  const entry: LeaderboardEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: payload.name.slice(0, 20),
    score: Math.floor(payload.score),
    spot: payload.spot.slice(0, 32),
    maxCombo: payload.maxCombo,
    maxSpeed: Math.round(payload.maxSpeed * 10) / 10,
    tricks: payload.tricks,
    timestamp: Date.now(),
    replay: payload.replay,
  };

  entries.push(entry);
  entries.sort((a, b) => b.score - a.score);
  if (entries.length > MAX_ENTRIES) entries = entries.slice(0, MAX_ENTRIES);

  return entry;
}

/** Replace store (sync from external WS server) */
export function replaceLeaderboard(next: LeaderboardEntry[]) {
  entries = next.slice(0, MAX_ENTRIES);
}