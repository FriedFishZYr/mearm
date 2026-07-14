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
      "shoulder-servo",
      "elbow-servo",
      "upper-link",
      "parallel-linkage",
      "forearm-link",
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
});
