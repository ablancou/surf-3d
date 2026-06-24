import { describe, expect, it, beforeAll } from "vitest";
import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { applySurfboardForces } from "@/lib/physics/surfboardForces";
import { SURF_SPOTS } from "@/lib/spots/spotConfig";
import { useSpotStore } from "@/stores/spotStore";
import { setOceanMode } from "@/lib/waves/oceanSampler";
import type { RapierRigidBody } from "@react-three/rapier";

function asSurfBody(body: RAPIER.RigidBody): RapierRigidBody {
  return body as unknown as RapierRigidBody;
}

describe("applySurfboardForces", () => {
  beforeAll(async () => {
    await RAPIER.init();
  });

  it("accelerates on wave face through real Rapier integration", () => {
    useSpotStore.setState({ spotId: "beach_break", spot: SURF_SPOTS.beach_break });
    setOceanMode("gerstner");

    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, 0.55, -12)
      .setLinearDamping(0.06)
      .setAngularDamping(0.62)
      .setCanSleep(false);
    const body = world.createRigidBody(bodyDesc);
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.28, 0.08, 1.05).setDensity(1.2),
      body,
    );

    const rot = new THREE.Quaternion();
    const dt = 1 / 60;
    let submergedFrames = 0;
    let firstSpeed = 0;
    let lastSpeed = 0;

    for (let frame = 0; frame < 120; frame++) {
      const time = 12 + frame * dt;
      const result = applySurfboardForces(
        asSurfBody(body),
        rot,
        time,
        { leanX: 0, leanZ: 1, popUp: false },
        dt,
        false,
      );
      world.step();
      if (result.submerged) submergedFrames += 1;
      if (frame === 0) firstSpeed = result.speed;
      lastSpeed = Math.hypot(body.linvel().x, body.linvel().z);
    }

    expect(submergedFrames).toBeGreaterThan(40);
    expect(lastSpeed).toBeGreaterThan(firstSpeed + 0.8);
  });
});