import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export type LbEntry = {
  id: string;
  name: string;
  score: number;
  spot: string;
  maxCombo: number;
  maxSpeed: number;
  tricks: number;
  timestamp: number;
  replay?: {
    spot: string;
    duration: number;
    interval: number;
    frames: number[];
  };
};

const MAX = 100;
const DATA_DIR = join(process.cwd(), "data");
const FILE = join(DATA_DIR, "leaderboard.json");

let cache: LbEntry[] | null = null;

function load(): LbEntry[] {
  if (cache) return cache;
  try {
    if (existsSync(FILE)) {
      cache = JSON.parse(readFileSync(FILE, "utf-8")) as LbEntry[];
      return cache;
    }
  } catch {
    // corrupt file
  }
  cache = [];
  return cache;
}

function save(entries: LbEntry[]) {
  cache = entries;
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(entries.slice(0, MAX), null, 2));
  } catch {
    // read-only fs
  }
}

export function getEntries(limit = 50): LbEntry[] {
  return [...load()].sort((a, b) => b.score - a.score).slice(0, limit);
}

export function addEntry(entry: Omit<LbEntry, "id" | "timestamp">): LbEntry {
  const full: LbEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };
  const entries = load();
  entries.push(full);
  entries.sort((a, b) => b.score - a.score);
  save(entries.slice(0, MAX));
  return full;
}