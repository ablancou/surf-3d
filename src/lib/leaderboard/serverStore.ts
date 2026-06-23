import {
  blobPersistenceEnabled,
  loadLeaderboardFromBlob,
  saveLeaderboardToBlob,
} from "@/lib/leaderboard/blobStore";
import type { LeaderboardEntry, SubmitScorePayload } from "@/lib/leaderboard/types";

const MAX_ENTRIES = 100;

let entries: LeaderboardEntry[] = [];
let hydrated = false;

async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;

  if (!blobPersistenceEnabled()) return;

  const loaded = await loadLeaderboardFromBlob();
  if (loaded) entries = loaded.slice(0, MAX_ENTRIES);
}

async function persist(): Promise<void> {
  if (!blobPersistenceEnabled()) return;
  await saveLeaderboardToBlob(entries);
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  await hydrate();
  return [...entries]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function submitScore(payload: SubmitScorePayload): Promise<LeaderboardEntry> {
  await hydrate();

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

  await persist();
  return entry;
}

/** Replace store (sync from external WS server) */
export function replaceLeaderboard(next: LeaderboardEntry[]) {
  entries = next.slice(0, MAX_ENTRIES);
  hydrated = true;
}