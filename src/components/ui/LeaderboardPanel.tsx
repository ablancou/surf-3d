"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLeaderboardStore } from "@/stores/leaderboardStore";
import { useGameStore } from "@/stores/gameStore";
import { useMultiplayerStore } from "@/stores/multiplayerStore";
import { useSpotStore } from "@/stores/spotStore";
import { useReplayStore } from "@/stores/replayStore";
import { clipToPayload } from "@/lib/replay/encode";

export function LeaderboardPanel() {
  const [open, setOpen] = useState(false);
  const entries = useLeaderboardStore((s) => s.entries);
  const loading = useLeaderboardStore((s) => s.loading);
  const personalBest = useLeaderboardStore((s) => s.personalBest);
  const lastRank = useLeaderboardStore((s) => s.lastRank);
  const fetchLeaderboard = useLeaderboardStore((s) => s.fetchLeaderboard);
  const submitScore = useLeaderboardStore((s) => s.submitScore);
  const loadPersonalBest = useLeaderboardStore((s) => s.loadPersonalBest);
  const score = useGameStore((s) => s.score);
  const spotName = useSpotStore((s) => s.spot.name);
  const playerName = useMultiplayerStore((s) => s.playerName);
  const personalReplay = useReplayStore((s) => s.personalBest);
  const togglePersonalGhost = useReplayStore((s) => s.togglePersonalGhost);
  const toggleGlobalGhost = useReplayStore((s) => s.toggleGlobalGhost);
  const showPersonalGhost = useReplayStore((s) => s.showPersonalGhost);
  const showGlobalGhost = useReplayStore((s) => s.showGlobalGhost);

  useEffect(() => {
    loadPersonalBest();
    void fetchLeaderboard();
  }, [fetchLeaderboard, loadPersonalBest]);

  const handleSubmit = async () => {
    const replay = personalReplay ? clipToPayload(personalReplay) : undefined;
    if (replay) replay.spot = spotName;
    await submitScore(playerName, score, spotName, replay);
  };

  return (
    <div className="pointer-events-auto absolute bottom-16 left-4 z-10 md:bottom-6">
      <Button
        variant="secondary"
        size="sm"
        className="bg-black/40 text-white backdrop-blur hover:bg-black/55"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void fetchLeaderboard();
        }}
      >
        Leaderboard
      </Button>
      {open && (
        <div className="mt-2 max-h-[60vh] w-80 overflow-y-auto rounded-xl border border-white/20 bg-black/55 p-4 text-sm text-white backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">Global Top 50</p>
            {personalBest > 0 && (
              <span className="text-xs text-amber-300">PB: {personalBest}</span>
            )}
          </div>

          {loading ? (
            <p className="text-white/60">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-white/60">No scores yet — be the first!</p>
          ) : (
            <ol className="mb-3 space-y-1">
              {entries.slice(0, 15).map((e, i) => (
                <li
                  key={e.id}
                  className="flex justify-between gap-2 rounded-lg px-2 py-1 text-xs even:bg-white/5"
                >
                  <span className="truncate">
                    <span className="text-white/50">{i + 1}.</span> {e.name}{" "}
                    <span className="text-white/40">· {e.spot}</span>
                  </span>
                  <span className="font-mono font-semibold text-amber-200">{e.score}</span>
                </li>
              ))}
            </ol>
          )}

          <Button size="sm" className="mb-2 w-full" onClick={handleSubmit} disabled={score < 100}>
            Submit Score ({score})
          </Button>
          {lastRank && (
            <p className="mb-2 text-center text-xs text-green-300">Rank #{lastRank}!</p>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={showPersonalGhost ? "default" : "secondary"}
              className="flex-1 text-xs"
              onClick={togglePersonalGhost}
            >
              Your Ghost
            </Button>
            <Button
              size="sm"
              variant={showGlobalGhost ? "default" : "secondary"}
              className="flex-1 text-xs"
              onClick={toggleGlobalGhost}
            >
              #1 Ghost
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}