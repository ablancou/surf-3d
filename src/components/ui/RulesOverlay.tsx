"use client";

import { useEffect } from "react";
import { useRulesStore } from "@/stores/rulesStore";
import { cn } from "@/lib/utils";

export function RulesOverlay() {
  const activeEvents = useRulesStore((s) => s.activeEvents);
  const clearEvent = useRulesStore((s) => s.clearEvent);

  // Auto-clear events after 4 seconds
  useEffect(() => {
    activeEvents.forEach((ev) => {
      const timeout = setTimeout(() => {
        clearEvent(ev.id);
      }, 4000);
      return () => clearTimeout(timeout);
    });
  }, [activeEvents, clearEvent]);

  if (activeEvents.length === 0) return null;

  return (
    <div className="pointer-events-none absolute bottom-32 right-8 flex flex-col gap-3 z-50">
      {activeEvents.map((ev) => (
        <div
          key={ev.id}
          className={cn(
            "animate-in slide-in-from-right-10 fade-in zoom-in-95 duration-300",
            "rounded-xl border p-4 shadow-2xl backdrop-blur-md max-w-xs",
            ev.points > 0 
              ? "bg-green-500/20 border-green-500/50 text-green-100" 
              : "bg-red-500/20 border-red-500/50 text-red-100"
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold uppercase tracking-wider">{ev.title}</h4>
            <span className={cn("font-black", ev.points > 0 ? "text-green-400" : "text-red-400")}>
              {ev.points > 0 ? "+" : ""}{ev.points} pts
            </span>
          </div>
          <p className="text-sm opacity-90 leading-tight">
            {ev.description}
          </p>
        </div>
      ))}
    </div>
  );
}
