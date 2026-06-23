"use client";

import { DynamicEffects } from "@/components/game/DynamicEffects";
import { useSettingsStore } from "@/stores/settingsStore";

export function Effects() {
  const enabled = useSettingsStore((s) => s.perf.enableEffects);
  if (!enabled) return null;
  return <DynamicEffects />;
}