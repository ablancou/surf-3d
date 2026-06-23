"use client";

import { CuboidCollider, useBeforePhysicsStep, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { SurfboardModel } from "@/components/game/SurfboardModel";
import type { SprayParticlesHandle } from "@/components/game/SprayParticles";
import { boardVisualState } from "@/lib/game/boardVisualState";
import { audioEngine } from "@/lib/audio/AudioEngine";
import { gameClock } from "@/lib/game/clock";
import { InputManager } from "@/lib/input/InputManager";
import {
  emitCarveSpray,
  emitFoamTrail,
  emitPopSpray,
  emitTubeSpray,
  emitWipeoutSplash,
} from "@/lib/particles/emitters";
import { applySurfboardForces } from "@/lib/physics/surfboardForces";
import { WipeoutDetector } from "@/lib/physics/wipeout";
import { findOptimalSpawn, findRespawnPoint } from "@/lib/waves/spawnSystem";
import { sampleOceanHeight } from "@/lib/waves/oceanSampler";
import { TrickDetector } from "@/lib/tricks/TrickDetector";
import { buildRiderTelemetry } from "@/lib/tricks/telemetry";
import { clipToPayload } from "@/lib/replay/encode";
import { ReplayRecorder } from "@/lib/replay/ReplayRecorder";
import type { ReplayClip } from "@/lib/replay/types";
import { useTutorialStore } from "@/stores/tutorialStore";
import { useGameStore } from "@/stores/gameStore";
import { useLeaderboardStore } from "@/stores/leaderboardStore";
import { useMultiplayerStore } from "@/stores/multiplayerStore";
import { useReplayStore } from "@/stores/replayStore";
import { useSpotStore } from "@/stores/spotStore";

type SurfboardProps = {
  inputManager: InputManager;
  particlesRef: RefObject<SprayParticlesHandle | null>;
  onTransform?: (position: THREE.Vector3, rotation: THREE.Quaternion) => void;
};

const boardPosition = new THREE.Vector3();
const boardRotation = new THREE.Quaternion();

export function Surfboard({ inputManager, particlesRef, onTransform }: SurfboardProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const trickDetector = useRef(new TrickDetector());
  const wipeoutDetector = useRef(new WipeoutDetector());
  const airTimeRef = useRef(0);
  const popCooldown = useRef(0);
  const wipeoutTimer = useRef(0);
  const lastCarveSound = useRef(0);
  const spawned = useRef(false);
  const replayRecorder = useRef(new ReplayRecorder());
  const trickCountRef = useRef(0);
  const runHandled = useRef(false);
  const spawnGrace = useRef(0);

  const setSpeed = useGameStore((s) => s.setSpeed);
  const setRiding = useGameStore((s) => s.setRiding);
  const setTubeState = useGameStore((s) => s.setTubeState);
  const addRideScore = useGameStore((s) => s.addRideScore);
  const addTubeScore = useGameStore((s) => s.addTubeScore);
  const registerTrick = useGameStore((s) => s.registerTrick);
  const triggerWipeout = useGameStore((s) => s.triggerWipeout);
  const clearWipeout = useGameStore((s) => s.clearWipeout);
  const prunePopups = useGameStore((s) => s.prunePopups);
  const wipedOut = useGameStore((s) => s.wipedOut);
  const markTutorial = useTutorialStore((s) => s.markAction);

  useBeforePhysicsStep(() => {
    const body = bodyRef.current;
    if (!body) return;

    const dt = gameClock.delta;
    inputManager.update();
    const rot = body.rotation();
    boardRotation.set(rot.x, rot.y, rot.z, rot.w);

    if (!spawned.current) {
      respawnAtBest(body);
      spawnGrace.current = 2.8;
      spawned.current = true;
      replayRecorder.current.start(gameClock.time);
      trickCountRef.current = 0;
      runHandled.current = false;
      useLeaderboardStore.getState().resetSession();
    }

    if (wipedOut) {
      if (!runHandled.current) {
        runHandled.current = true;
        void finalizeRun(replayRecorder.current);
      }
      wipeoutTimer.current += dt;
      if (wipeoutTimer.current > 1.35) {
        const pos = body.translation();
        respawn(body, pos.x, pos.z);
        spawnGrace.current = 2.2;
        wipeoutTimer.current = 0;
        clearWipeout();
        wipeoutDetector.current.resetCooldown();
        replayRecorder.current.start(gameClock.time);
        trickCountRef.current = 0;
        runHandled.current = false;
        useLeaderboardStore.getState().resetSession();
      }
      return;
    }

    const result = applySurfboardForces(
      body,
      boardRotation,
      gameClock.time,
      inputManager.state,
      dt,
      false,
    );

    const pos = body.translation();
    const waterY = sampleOceanHeight(pos.x, pos.z, gameClock.time);

    if (!result.submerged) {
      airTimeRef.current += dt;
      const fellThrough = pos.y < waterY - 4 || pos.y < -8;
      const airTooLong = airTimeRef.current > 3.2 && pos.y < waterY + 1.5;
      if (fellThrough || airTooLong) {
        respawn(body, pos.x, pos.z);
        spawnGrace.current = 2.2;
        airTimeRef.current = 0;
        setSpeed(0);
        setRiding(true);
        return;
      }
    } else {
      airTimeRef.current = 0;
    }

    setSpeed(result.speed);
    setRiding(result.submerged);

    useLeaderboardStore.getState().trackSession({
      maxCombo: useGameStore.getState().combo,
      maxSpeed: result.speed,
      trickCount: trickCountRef.current,
    });

    const telemetry = buildRiderTelemetry(
      body,
      boardRotation,
      gameClock.time,
      inputManager.state,
      result.speed,
      result.submerged,
      airTimeRef.current,
    );

    boardVisualState.speed = telemetry.speed;
    boardVisualState.tiltX = telemetry.tiltX;
    boardVisualState.inTube = telemetry.inTube;
    boardVisualState.x = pos.x;
    boardVisualState.y = pos.y;
    boardVisualState.z = pos.z;

    setTubeState(telemetry.inTube, telemetry.tubeDepth);

    if (result.submerged && result.speed > 1.5) {
      const rideRate = telemetry.inTube ? 3.2 : 2.4;
      addRideScore(result.speed * dt * rideRate);
    }

    if (telemetry.inTube) {
      addTubeScore(telemetry.tubeDepth * dt * 80);
      markTutorial("tube");
    }

    if (Math.abs(inputManager.state.leanX) > 0.3 && result.speed > 2.5) {
      markTutorial("carve");
    }
    if (result.speed > 6) markTutorial("fast");

    audioEngine.updateMusic(
      result.speed,
      useGameStore.getState().combo,
      telemetry.inTube,
      dt,
    );

    const particles = particlesRef.current;

    const trick = trickDetector.current.update(telemetry, gameClock.time, dt);
    if (trick) {
      trickCountRef.current += 1;
      registerTrick(trick);
      if (trick.id === "tube_ride") {
        audioEngine.playSplash(0.9);
      } else {
        audioEngine.playTrickLand();
      }
      if (trick.id === "carve_left" || trick.id === "carve_right") {
        markTutorial("carve");
      }
      emitCarveSpray(particles, boardPosition, boardRotation, telemetry);
    }

    spawnGrace.current = Math.max(0, spawnGrace.current - dt);

    const wipeout =
      spawnGrace.current <= 0
        ? wipeoutDetector.current.update(telemetry, gameClock.time, dt)
        : null;
    if (wipeout) {
      triggerWipeout(wipeout.reason);
      emitWipeoutSplash(particles, boardPosition, result.speed);
      audioEngine.playWipeout();
      body.setLinvel({ x: 0, y: -2, z: 0 }, true);
      body.applyTorqueImpulse({ x: 3, y: 2, z: -2 }, true);
      return;
    }

    emitFoamTrail(particles, boardPosition, boardRotation, result.speed, result.submerged);

    if (telemetry.inTube) {
      emitTubeSpray(particles, boardPosition, boardRotation, telemetry.tubeDepth);
    }

    if (Math.abs(telemetry.angularVelocityZ) > 1.5 && result.submerged) {
      emitCarveSpray(particles, boardPosition, boardRotation, telemetry);
      if (gameClock.time - lastCarveSound.current > 0.15) {
        audioEngine.playCarve(Math.min(1, result.speed / 10));
        lastCarveSound.current = gameClock.time;
      }
    }

    popCooldown.current = Math.max(0, popCooldown.current - dt);
    if (inputManager.state.popUp && result.submerged && popCooldown.current <= 0) {
      emitPopSpray(particles, boardPosition, boardRotation);
      audioEngine.playSplash(0.5);
      markTutorial("pop");
      popCooldown.current = 0.35;
    }

    prunePopups(gameClock.time);
  });

  useFrame(() => {
    const body = bodyRef.current;
    if (!body) return;
    const t = body.translation();
    const r = body.rotation();
    boardPosition.set(t.x, t.y, t.z);
    boardRotation.set(r.x, r.y, r.z, r.w);
    onTransform?.(boardPosition, boardRotation);

    replayRecorder.current.sample(
      gameClock.time,
      { x: t.x, y: t.y, z: t.z },
      { x: r.x, y: r.y, z: r.z, w: r.w },
      gameClock.delta,
    );

    const mp = useMultiplayerStore.getState();
    if (mp.status === "connected") {
      mp.pushLocalState({
        x: t.x,
        y: t.y,
        z: t.z,
        qx: r.x,
        qy: r.y,
        qz: r.z,
        qw: r.w,
        speed: useGameStore.getState().speed,
        score: useGameStore.getState().score,
      });
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="dynamic"
      colliders={false}
      mass={7}
      linearDamping={0.08}
      angularDamping={0.75}
      canSleep={false}
      enabledRotations={[true, true, true]}
    >
      <CuboidCollider args={[0.28, 0.08, 1.05]} density={1.2} />
      <SurfboardModel />
    </RigidBody>
  );
}

async function finalizeRun(recorder: ReplayRecorder) {
  recorder.stop();
  const score = useGameStore.getState().score;
  const frames = recorder.getFrames();
  if (frames.length < 4 || score < 50) return;

  const spotName = useSpotStore.getState().spot.name;
  const playerName = useMultiplayerStore.getState().playerName;
  const lb = useLeaderboardStore.getState();

  const clip: ReplayClip = {
    id: `run-${Date.now()}`,
    name: playerName,
    spot: spotName,
    score,
    duration: recorder.getDuration(),
    recordedAt: Date.now(),
    frames: [...frames],
  };

  if (score >= lb.personalBest) {
    useReplayStore.getState().savePersonalBest(clip);
  }

  if (score >= Math.max(lb.personalBest, 200)) {
    const replay = clipToPayload(clip);
    replay.spot = spotName;
    await lb.submitScore(playerName, score, spotName, replay);
  }
}

function applySpawn(body: RapierRigidBody, spawn: ReturnType<typeof findOptimalSpawn>) {
  const halfYaw = spawn.yaw * 0.5;
  const sin = Math.sin(halfYaw);
  const cos = Math.cos(halfYaw);

  body.setTranslation({ x: spawn.x, y: spawn.y, z: spawn.z }, true);
  body.setRotation({ x: 0, y: sin, z: 0, w: cos }, true);
  body.setLinvel(
    { x: spawn.downhillX * spawn.boost, y: 0, z: spawn.downhillZ * spawn.boost },
    true,
  );
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
}

function respawnAtBest(body: RapierRigidBody) {
  applySpawn(body, findOptimalSpawn(gameClock.time));
}

function respawn(body: RapierRigidBody, x: number, z: number) {
  applySpawn(body, findRespawnPoint(x, z, gameClock.time));
}