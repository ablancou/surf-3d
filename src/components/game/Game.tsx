"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameScene } from "@/components/game/GameScene";
import { ControlsOverlay } from "@/components/ui/ControlsOverlay";
import { GameHUD } from "@/components/ui/GameHUD";
import { LeaderboardPanel } from "@/components/ui/LeaderboardPanel";
import { MultiplayerPanel } from "@/components/ui/MultiplayerPanel";
import { SpotSelector } from "@/components/ui/SpotSelector";
import { TrickPopups } from "@/components/ui/TrickPopups";
import { TutorialOverlay } from "@/components/ui/TutorialOverlay";
import { TubeOverlay } from "@/components/ui/TubeOverlay";
import { WipeoutOverlay } from "@/components/ui/WipeoutOverlay";
import { audioEngine } from "@/lib/audio/AudioEngine";
import { createGameRenderer } from "@/lib/gpu/webgpu";
import { InputManager } from "@/lib/input/InputManager";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSpotStore } from "@/stores/spotStore";

export function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputManagerRef = useRef<InputManager | null>(null);
  const audioStarted = useRef(false);
  const [ready, setReady] = useState(false);

  const oceanMode = useSettingsStore((s) => s.oceanMode);
  const rendererKind = useSettingsStore((s) => s.rendererKind);
  const perfTier = useSettingsStore((s) => s.perfTier);
  const perf = useSettingsStore((s) => s.perf);
  const spotId = useSpotStore((s) => s.spotId);
  const initPerf = useSettingsStore((s) => s.initPerf);

  if (!inputManagerRef.current) {
    inputManagerRef.current = new InputManager();
  }

  useEffect(() => {
    initPerf();
  }, [initPerf]);

  const unlockAudio = useCallback(() => {
    if (audioStarted.current) return;
    audioStarted.current = true;
    void audioEngine.unlock();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    const input = inputManagerRef.current;
    if (!el || !input) return;

    input.bind(el);

    const onInteract = () => unlockAudio();
    window.addEventListener("pointerdown", onInteract, { once: true });
    window.addEventListener("keydown", onInteract, { once: true });

    return () => {
      input.unbind(el);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, [unlockAudio]);

  const sceneKey = `${oceanMode}-${spotId}-${perfTier}`;

  return (
    <div ref={containerRef} className="relative h-dvh w-full touch-none select-none overflow-hidden bg-sky-300">
      <Canvas
        shadows={perf.enableShadows}
        dpr={[1, perf.dprMax]}
        camera={{ fov: 55, near: 0.1, far: 500, position: [0, 4, 12] }}
        gl={async (props) => {
          const canvas = props.canvas as HTMLCanvasElement;
          const { renderer, kind } = await createGameRenderer(canvas);
          const store = useSettingsStore.getState();
          store.setRendererKind(kind);
          const tier = store.perfTier;
          if (kind === "webgpu" && tier !== "low") {
            store.setOceanMode("ifft");
          } else if (tier === "low") {
            store.setOceanMode("gerstner");
          }
          setReady(true);
          return renderer;
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        {ready && (
          <GameScene inputManager={inputManagerRef.current!} key={sceneKey} />
        )}
      </Canvas>
      <SpotSelector />
      <MultiplayerPanel />
      <LeaderboardPanel />
      <GameHUD rendererKind={rendererKind} oceanMode={oceanMode} perfTier={perfTier} />
      <TutorialOverlay />
      <TrickPopups />
      <TubeOverlay />
      <WipeoutOverlay />
      <ControlsOverlay />
    </div>
  );
}