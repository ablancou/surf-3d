"use client";

import { CuboidCollider, useBeforePhysicsStep, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { SurfboardModel } from "@/components/game/SurfboardModel";
import type { SprayParticlesHandle } from "@/components/game/SprayParticles";
import { boardVisualState } from "@/lib/game/boardVisualState";
import { audioEngine } from "@/lib/audio/AudioEngine";
import { hapticPop, hapticTrick, hapticTubeEntry, hapticWipeout } from "@/lib/input/haptics";
import { gameClock } from "@/lib/game/clock";
import { InputManager } from "@/lib/input/InputManager";
import {
  emitAirborneMist,
  emitCarveSpray,
  emitFoamTrail,
  emitPopSpray,
  emitTubeSpray,
  emitLandingSplash,
  emitPumpSpray,
  emitTrickSpray,
  emitWipeoutSplash,
} from "@/lib/particles/emitters";
import {
  applySurfboardForces,
  POP_COOLDOWN_SEC,
  popImpulseForSpeed,
} from "@/lib/physics/surfboardForces";
import { WipeoutDetector } from "@/lib/physics/wipeout";
import { getSpotTube } from "@/lib/spots/spotPhysics";
import type { RideRecap } from "@/lib/game/rideSession";
import {
  canCatchWave,
  shouldCompleteRide,
  STAND_UP_BOOST,
  WIPE_TO_RECAP_SEC,
} from "@/lib/game/rideSession";
import {
  catchBoostForSpawn,
  findOptimalSpawn,
  findRespawnPoint,
  type SpawnPoint,
} from "@/lib/waves/spawnSystem";
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
const boardForward = new THREE.Vector3();

export function Surfboard({ inputManager, particlesRef, onTransform }: SurfboardProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const trickDetector = useRef(new TrickDetector());
  const wipeoutDetector = useRef(new WipeoutDetector());
  const airTimeRef = useRef(0);
  const popCooldown = useRef(0);
  const wasPopUp = useRef(false);
  const wipeoutTimer = useRef(0);
  const lastCarveSound = useRef(0);
  const lastPumpSpray = useRef(0);
  const spawned = useRef(false);
  const replayRecorder = useRef(new ReplayRecorder());
  const trickCountRef = useRef(0);
  const runHandled = useRef(false);
  const spawnGrace = useRef(0);
  const wasInTube = useRef(false);
  const paddleTimer = useRef(0);
  const lastSpawn = useRef<SpawnPoint | null>(null);
  const rideStart = useRef(0);
  const peakSpeed = useRef(0);
  const slowTimer = useRef(0);
  const recapPending = useRef<RideRecap | null>(null);

  const setSpeed = useGameStore((s) => s.setSpeed);
  const setAirTime = useGameStore((s) => s.setAirTime);
  const setRiding = useGameStore((s) => s.setRiding);
  const setTubeState = useGameStore((s) => s.setTubeState);
  const addRideScore = useGameStore((s) => s.addRideScore);
  const addTubeScore = useGameStore((s) => s.addTubeScore);
  const registerTrick = useGameStore((s) => s.registerTrick);
  const clearWipeout = useGameStore((s) => s.clearWipeout);
  const prunePopups = useGameStore((s) => s.prunePopups);
  const tickComboDecay = useGameStore((s) => s.tickComboDecay);
  const setPopReady = useGameStore((s) => s.setPopReady);
  const triggerDropBanner = useGameStore((s) => s.triggerDropBanner);
  const triggerWipeout = useGameStore((s) => s.triggerWipeout);
  const wipedOut = useGameStore((s) => s.wipedOut);
  const ridePhase = useGameStore((s) => s.ridePhase);
  const startNewRide = useGameStore((s) => s.startNewRide);
  const endRideWithRecap = useGameStore((s) => s.endRideWithRecap);
  const setRidePhase = useGameStore((s) => s.setRidePhase);
  const markTutorial = useTutorialStore((s) => s.markAction);

  useBeforePhysicsStep(() => {
    const body = bodyRef.current;
    if (!body) return;

    const dt = gameClock.delta;
    inputManager.update();
    const rot = body.rotation();
    boardRotation.set(rot.x, rot.y, rot.z, rot.w);

    const phase = useGameStore.getState().ridePhase;
    if (phase === "menu") return;

    if (!spawned.current) {
      const spawn = findOptimalSpawn(gameClock.time);
      applyPaddleSpawn(body, spawn);
      lastSpawn.current = spawn;
      rideStart.current = gameClock.time;
      spawnGrace.current = 4.5;
      paddleTimer.current = 0;
      wasInTube.current = false;
      peakSpeed.current = 0;
      slowTimer.current = 0;
      recapPending.current = null;
      spawned.current = true;
      replayRecorder.current.start(gameClock.time);
      trickCountRef.current = 0;
      runHandled.current = false;
      useLeaderboardStore.getState().resetSession();
    }

    if (phase === "wiped") {
      wipeoutTimer.current += dt;
      if (recapPending.current && wipeoutTimer.current >= WIPE_TO_RECAP_SEC) {
        endRideWithRecap(recapPending.current);
        recapPending.current = null;
        wipeoutTimer.current = 0;
      }
      return;
    }

    if (phase === "recap") {
      if (!runHandled.current) {
        runHandled.current = true;
        void finalizeRun(replayRecorder.current);
      }
      wipeoutTimer.current += dt;
      if (wipeoutTimer.current > 2.4) {
        const spawn = findRespawnPoint(body.translation().x, body.translation().z, gameClock.time);
        applyPaddleSpawn(body, spawn);
        lastSpawn.current = spawn;
        startNewRide(gameClock.time);
        rideStart.current = gameClock.time;
        spawnGrace.current = 4;
        paddleTimer.current = 0;
        wasInTube.current = false;
        peakSpeed.current = 0;
        slowTimer.current = 0;
        recapPending.current = null;
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
    boardPosition.set(pos.x, pos.y, pos.z);
    const waterY = sampleOceanHeight(pos.x, pos.z, gameClock.time);

    const prevAirTime = airTimeRef.current;
    if (!result.submerged) {
      airTimeRef.current += dt;
      const fellThrough = pos.y < waterY - 4 || pos.y < -8;
      const airTooLong = airTimeRef.current > 3.2 && pos.y < waterY + 1.5;
      if (fellThrough || airTooLong) {
        const lb = useLeaderboardStore.getState();
        recapPending.current = {
          score: useGameStore.getState().score,
          trickCount: lb.trickCount,
          maxCombo: lb.maxCombo,
          maxSpeed: lb.maxSpeed,
          reason: "fall",
          durationSec: gameClock.time - rideStart.current,
        };
        setRidePhase("wiped");
        triggerWipeout("bail");
        wipeoutTimer.current = 0;
        runHandled.current = false;
        airTimeRef.current = 0;
        return;
      }
    } else {
      if (prevAirTime > 0.22) {
        emitLandingSplash(particlesRef.current, boardPosition, boardRotation, prevAirTime, result.speed);
        if (prevAirTime > 0.3) audioEngine.playTrickLand();
      }
      airTimeRef.current = 0;
    }

    setSpeed(result.speed);
    setAirTime(airTimeRef.current);
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
    boardVisualState.paddling = ridePhase === "paddling";
    boardVisualState.inTube = telemetry.inTube;
    boardVisualState.airborne = !result.submerged;
    boardVisualState.airTime = airTimeRef.current;
    boardVisualState.verticalVelocity = telemetry.verticalVelocity;
    boardVisualState.x = pos.x;
    boardVisualState.y = pos.y;
    boardVisualState.z = pos.z;

    setTubeState(telemetry.inTube, telemetry.tubeDepth);

    if (ridePhase === "paddling") {
      if (inputManager.state.leanZ > 0.12) {
        paddleTimer.current += dt;
      } else {
        paddleTimer.current = Math.max(0, paddleTimer.current - dt * 0.5);
      }
      if (
        canCatchWave(
          result.speed,
          telemetry.waveFaceAlignment,
          inputManager.state.leanZ,
          paddleTimer.current,
        )
      ) {
        setRidePhase("riding");
        triggerDropBanner(gameClock.time);
        rideStart.current = gameClock.time;
        const spawn = lastSpawn.current;
        if (spawn) {
          const boost = catchBoostForSpawn(spawn) + STAND_UP_BOOST;
          body.applyImpulse(
            { x: spawn.downhillX * boost, y: 0.45, z: spawn.downhillZ * boost },
            true,
          );
        }
        paddleTimer.current = 0;
      }
    }

    if (ridePhase === "riding") {
      peakSpeed.current = Math.max(peakSpeed.current, result.speed);
      if (
        result.speed < 1.6 ||
        telemetry.waveFaceAlignment < 0.15
      ) {
        slowTimer.current += dt;
      } else {
        slowTimer.current = Math.max(0, slowTimer.current - dt * 0.45);
      }

      if (
        shouldCompleteRide({
          phase: ridePhase,
          speed: result.speed,
          faceAlignment: telemetry.waveFaceAlignment,
          rideSec: gameClock.time - rideStart.current,
          peakSpeed: peakSpeed.current,
          slowSec: slowTimer.current,
        })
      ) {
        const lb = useLeaderboardStore.getState();
        endRideWithRecap({
          score: useGameStore.getState().score,
          trickCount: lb.trickCount,
          maxCombo: lb.maxCombo,
          maxSpeed: lb.maxSpeed,
          reason: "completed",
          durationSec: gameClock.time - rideStart.current,
        });
        wipeoutTimer.current = 0;
        runHandled.current = false;
        return;
      }
    }

    if (ridePhase === "riding" && result.submerged && result.speed > 1.2) {
      const tubeTune = getSpotTube();
      const rideRate = telemetry.inTube ? tubeTune.rideScoreMultiplier : 3.2;
      addRideScore(result.speed * dt * rideRate);
    }

    if (telemetry.inTube) {
      if (!wasInTube.current) {
        hapticTubeEntry();
        audioEngine.playTubeRush(0.5 + telemetry.tubeDepth * 0.4);
      }
      addTubeScore(telemetry.tubeDepth * dt * 80);
      markTutorial("tube");
    }
    wasInTube.current = telemetry.inTube;

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

    tickComboDecay(gameClock.time);

    const trick =
      ridePhase === "riding"
        ? trickDetector.current.update(telemetry, gameClock.time, dt)
        : null;
    if (trick) {
      trickCountRef.current += 1;
      registerTrick(trick, gameClock.time);
      const comboNow = useGameStore.getState().combo;
      audioEngine.playTrick(trick.id, comboNow);
      hapticTrick(trick.id, comboNow);
      boardVisualState.lastTrick = trick.id;
      if (trick.id === "aerial") {
        boardVisualState.flipUntil = gameClock.time + 0.75;
      }
      if (trick.id === "carve_left" || trick.id === "carve_right") {
        markTutorial("carve");
      }
      emitTrickSpray(particles, boardPosition, boardRotation, telemetry, trick.id, comboNow);
    }

    spawnGrace.current = Math.max(0, spawnGrace.current - dt);

    const wipeout =
      ridePhase === "riding" && spawnGrace.current <= 0
        ? wipeoutDetector.current.update(telemetry, gameClock.time, dt)
        : null;
    if (wipeout) {
      const lb = useLeaderboardStore.getState();
      recapPending.current = {
        score: useGameStore.getState().score,
        trickCount: lb.trickCount,
        maxCombo: lb.maxCombo,
        maxSpeed: lb.maxSpeed,
        reason: wipeout.reason,
        durationSec: gameClock.time - rideStart.current,
      };
      setRidePhase("wiped");
      triggerWipeout(wipeout.reason);
      wipeoutTimer.current = 0;
      emitWipeoutSplash(particles, boardPosition, result.speed);
      audioEngine.playWipeout();
      hapticWipeout();
      body.setLinvel({ x: 0, y: -2, z: 0 }, true);
      body.applyTorqueImpulse({ x: 3, y: 2, z: -2 }, true);
      return;
    }

    emitFoamTrail(particles, boardPosition, boardRotation, result.speed, result.submerged);

    if (!result.submerged) {
      emitAirborneMist(particles, boardPosition, boardRotation, airTimeRef.current, result.speed);
    }

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

    if (
      result.submerged &&
      result.speed > 3.5 &&
      Math.abs(inputManager.state.leanZ) > 0.28 &&
      gameClock.time - lastPumpSpray.current > 0.14
    ) {
      emitPumpSpray(particles, boardPosition, boardRotation, result.speed, inputManager.state.leanZ);
      lastPumpSpray.current = gameClock.time;
    }

    const wantsPop = inputManager.state.popUp;
    const popEdge = wantsPop && !wasPopUp.current;
    wasPopUp.current = wantsPop;

    popCooldown.current = Math.max(0, popCooldown.current - dt);
    setPopReady(
      popCooldown.current <= 0 ? 1 : 1 - popCooldown.current / POP_COOLDOWN_SEC,
    );

    if (popEdge && ridePhase === "riding" && result.submerged && popCooldown.current <= 0) {
      const popPower = popImpulseForSpeed(result.speed);
      body.applyImpulse({ x: 0, y: popPower, z: 0 }, true);
      if (result.speed > 4) {
        boardForward.set(0, 0, 1).applyQuaternion(boardRotation);
        body.applyImpulse(
          { x: boardForward.x * 0.35, y: 0, z: boardForward.z * 0.35 },
          true,
        );
      }
      emitPopSpray(particles, boardPosition, boardRotation);
      audioEngine.playSplash(0.45 + Math.min(result.speed / 20, 0.25));
      hapticPop();
      markTutorial("pop");
      popCooldown.current = POP_COOLDOWN_SEC;
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
      linearDamping={0.06}
      angularDamping={0.62}
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

function applyPaddleSpawn(body: RapierRigidBody, spawn: SpawnPoint) {
  const q = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0.38, spawn.yaw, 0, "YXZ"),
  );

  body.setTranslation({ x: spawn.x, y: spawn.y, z: spawn.z }, true);
  body.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
}