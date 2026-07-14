import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { solveInverse } from "../src/core/kinematics";
import { DEFAULT_PROFILE } from "../src/core/profile";
import { MeArmModel } from "../src/viewer/arm-model";

describe("3D MeArm transform hierarchy", () => {
  it.each(DEFAULT_PROFILE.approvedPoses)("places the endpoint at $name within 0.5 mm", (pose) => {
    const model = new MeArmModel(DEFAULT_PROFILE);
    const angles = solveInverse(pose, DEFAULT_PROFILE);
    expect(angles).not.toBeNull();
    model.setPose(angles!, 1);
    const endpoint = model.getEndEffectorSourcePoint();
    expect(Math.hypot(endpoint.x - pose.x, endpoint.y - pose.y, endpoint.z - pose.z)).toBeLessThan(0.5);
    model.dispose();
  });

  it("accepts the full claw openness range", () => {
    const model = new MeArmModel(DEFAULT_PROFILE);
    const angles = solveInverse(DEFAULT_PROFILE.home, DEFAULT_PROFILE)!;
    expect(() => {
      model.setPose(angles, 0);
      model.setPose(angles, 0.5);
      model.setPose(angles, 1);
    }).not.toThrow();
    model.dispose();
  });

  it("includes the assembly-inspired base, servos, linkages, and gripper", () => {
    const model = new MeArmModel(DEFAULT_PROFILE);
    for (const name of [
      "base-plate",
      "base-servo",
      "base-drive-hub",
      "rotating-deck",
      "shoulder-servo",
      "elbow-servo",
      "upper-link",
      "main-arm-cross-web",
      "shoulder-servo-horn",
      "parallel-linkage",
      "forearm-link",
      "elbow-servo-horn",
      "forearm-parallel-linkage",
      "claw-servo",
      "left-gripper-gear",
      "right-gripper-gear",
      "left-gripper-finger",
      "right-gripper-finger",
    ]) {
      expect(model.getObjectByName(name), `${name} should be present`).toBeDefined();
    }
    model.dispose();
  });

  it("keeps fixed base parts below the rotating deck", () => {
    const model = new MeArmModel(DEFAULT_PROFILE);
    const fixedPlate = model.getObjectByName("pivot-servo-plate")!;
    const baseServoBody = model.getObjectByName("base-servo-body")!;
    const baseServoFlange = model.getObjectByName("base-servo-flange")!;
    const rotatingDeck = model.getObjectByName("rotating-deck")!;
    model.updateMatrixWorld(true);

    const deckBounds = new THREE.Box3().setFromObject(rotatingDeck);
    for (const fixedPart of [fixedPlate, baseServoBody, baseServoFlange]) {
      const fixedBounds = new THREE.Box3().setFromObject(fixedPart);
      expect(fixedBounds.max.y, `${fixedPart.name} should remain below the rotating deck`).toBeLessThan(deckBounds.min.y);
    }

    model.dispose();
  });

  it("opens side bays in the rotating deck for the horizontal servos", () => {
    const model = new MeArmModel(DEFAULT_PROFILE);
    const deckCore = model.getObjectByName("rotating-deck-core") as THREE.Mesh;
    const positions = deckCore.geometry.getAttribute("position");
    model.updateMatrixWorld(true);

    for (let index = 0; index < positions.count; index += 1) {
      const vertex = new THREE.Vector3().fromBufferAttribute(positions, index).applyMatrix4(deckCore.matrixWorld);
      if (Math.abs(vertex.z) < 17.4) {
        expect(Math.abs(vertex.x)).toBeLessThanOrEqual(14.01);
      }
    }

    model.dispose();
  });
});
