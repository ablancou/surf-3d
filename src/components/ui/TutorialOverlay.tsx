"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TUTORIAL_STEPS, useTutorialStore } from "@/stores/tutorialStore";

export function TutorialOverlay() {
  const active = useTutorialStore((s) => s.active);
  const stepIndex = useTutorialStore((s) => s.stepIndex);
  const advance = useTutorialStore((s) => s.advance);
  const skip = useTutorialStore((s) => s.skip);
  const start = useTutorialStore((s) => s.start);

  useEffect(() => {
    const done = localStorage.getItem("surf3d-tutorial-done");
    if (done) useTutorialStore.setState({ active: false, completed: true });
  }, []);

  if (!active) return null;

  const step = TUTORIAL_STEPS[stepIndex];
  const isLast = stepIndex >= TUTORIAL_STEPS.length - 1;

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm md:items-center">
      <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-slate-900/90 p-6 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
            Tutorial {stepIndex + 1}/{TUTORIAL_STEPS.length}
          </p>
          <div className="flex gap-1">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i <= stepIndex ? "bg-cyan-400" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-bold">{step.title}</h2>
        <p className="mb-6 text-sm leading-relaxed text-white/80">{step.body}</p>
        <div className="flex gap-3">
          <Button className="flex-1" onClick={advance}>
            {isLast ? "Start Surfing!" : "Next"}
          </Button>
          <Button variant="ghost" className="text-white/60 hover:text-white" onClick={skip}>
            Skip
          </Button>
        </div>
        {stepIndex === 0 && (
          <button
            type="button"
            className="mt-3 w-full text-center text-xs text-white/40 hover:text-white/60"
            onClick={start}
          >
            Restart tutorial
          </button>
        )}
      </div>
    </div>
  );
}