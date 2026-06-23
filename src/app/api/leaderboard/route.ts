import { NextResponse } from "next/server";
import { getLeaderboard, submitScore } from "@/lib/leaderboard/serverStore";
import type { SubmitScorePayload } from "@/lib/leaderboard/types";

const EXTERNAL_URL = process.env.LEADERBOARD_API_URL;

async function proxyGet() {
  if (!EXTERNAL_URL) return null;
  try {
    const res = await fetch(`${EXTERNAL_URL}/leaderboard`, { next: { revalidate: 10 } });
    if (!res.ok) return null;
    return (await res.json()) as { entries: unknown[] };
  } catch {
    return null;
  }
}

async function proxyPost(body: SubmitScorePayload) {
  if (!EXTERNAL_URL) return null;
  try {
    const res = await fetch(`${EXTERNAL_URL}/leaderboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const proxied = await proxyGet();
  if (proxied?.entries) {
    return NextResponse.json({ entries: proxied.entries, source: "external" });
  }

  const entries = await getLeaderboard(50);
  const source = process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local";
  return NextResponse.json({ entries, source });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitScorePayload;
    if (!body.name || typeof body.score !== "number" || body.score < 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const proxied = await proxyPost(body);
    if (proxied) {
      return NextResponse.json(proxied);
    }

    const entry = await submitScore(body);
    const board = await getLeaderboard(50);
    return NextResponse.json({ entry, rank: board.findIndex((e) => e.id === entry.id) + 1 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}