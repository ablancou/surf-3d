import { del, list, put } from "@vercel/blob";
import type { LeaderboardEntry } from "@/lib/leaderboard/types";

const BLOB_PATH = "surf-3d/leaderboard.json";

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

export function blobPersistenceEnabled(): boolean {
  return Boolean(blobToken());
}

export async function loadLeaderboardFromBlob(): Promise<LeaderboardEntry[] | null> {
  const token = blobToken();
  if (!token) return null;

  try {
    const { blobs } = await list({ prefix: BLOB_PATH, token });
    const blob = blobs.find((b) => b.pathname === BLOB_PATH);
    if (!blob) return [];

    const res = await fetch(blob.url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const data = (await res.json()) as LeaderboardEntry[];
    return Array.isArray(data) ? data : [];
  } catch {
    return null;
  }
}

export async function saveLeaderboardToBlob(entries: LeaderboardEntry[]): Promise<boolean> {
  const token = blobToken();
  if (!token) return false;

  try {
    const { blobs } = await list({ prefix: BLOB_PATH, token });
    const existing = blobs.find((b) => b.pathname === BLOB_PATH);
    if (existing) await del(existing.url, { token });

    await put(BLOB_PATH, JSON.stringify(entries), {
      access: "public",
      token,
      addRandomSuffix: false,
      contentType: "application/json",
    });
    return true;
  } catch {
    return false;
  }
}