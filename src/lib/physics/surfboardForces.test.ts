import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { applySurfboardForces } from "@/lib/physics/surfboardForces";
import { SURF_SPOTS } from "@/lib/spots/spotConfig";
import { useSpotStore } from "@/stores/spotStore";
import { setOceanMode } from "@/lib/waves/oceanSampler";
import type { RapierRigidBody } from "@react-three/rapier";

function createMockBody() {
  const linvel = { x: 0, y: 0, z: 0 };
  const impulses: { x: number; y: number; z: number }[] = [];
  const body = {
    translation: () => ({ x: 0, y: 0.5, z: -10 }),
    linvel: () => linvel,
    rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
    applyImpulse: vi.fn((imp: { x: number; y: number; z: number }) => {
      impulses.push(imp);
      linvel.x += imp.x;
      linvel.z += imp.z;
      linvel.y += imp.y;
    }),
    setLinvel: vi.fn((v: { x: number; y: number; z: number }) => {
      linvel.x = v.x;
      linvel.y = v.y;
      linvel.z = v.z;
    }),
    applyTorqueImpulse: vi.fn(),
  } as unknown as RapierRigidBody;
  return { body, linvel, impulses };
}

describe("applySurfboardForces", () => {
  it("applies forward impulse on wave face with W input", () => {
    useSpotStore.setState({ spotId: "beach_break", spot: SURF_SPOTS.beach_break });
    setOceanMode("gerstner");
    const { body, linvel } = createMockBody();
    const rot = new THREE.Quaternion();

    const r1 = applySurfboardForces(
      body,
      rot,
      12,
      { leanX: 0, leanZ: 1, popUp: false },
      0.016,
      false,
    );

    expect(r1.submerged).toBe(true);
    const r2 = applySurfboardForces(
      body,
      rot,
      12.016,
      { leanX: 0, leanZ: 1, popUp: false },
      0.016,
      false,
    );
    expect(r2.speed).toBeGreaterThan(r1.speed);
    expect(linvel.z + linvel.x).toBeGreaterThan(0);
  });
});