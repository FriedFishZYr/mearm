import { describe, expect, it } from "vitest";
import { solveForward, solveInverse, validatePose } from "../src/core/kinematics";
import { DEFAULT_PROFILE } from "../src/core/profile";

describe("MeArm kinematics", () => {
  it.each(DEFAULT_PROFILE.approvedPoses)("solves approved pose $name", (pose) => {
    const result = validatePose(pose, DEFAULT_PROFILE);
    expect(result.valid).toBe(true);
    expect(result.approved).toBe(true);
    expect(result.angles).toBeDefined();
    expect(result.diagnostics).toEqual([]);
  });

  it("round-trips inverse and forward kinematics within 0.5 mm", () => {
    const target = { x: -35, y: 105, z: 72 };
    const angles = solveInverse(target, DEFAULT_PROFILE);
    expect(angles).not.toBeNull();
    const reconstructed = solveForward(angles!, DEFAULT_PROFILE);
    expect(Math.hypot(
      reconstructed.x - target.x,
      reconstructed.y - target.y,
      reconstructed.z - target.z,
    )).toBeLessThan(0.5);
  });

  it("preserves left/right base-angle symmetry", () => {
    const left = solveInverse({ x: -50, y: 100, z: 80 }, DEFAULT_PROFILE)!;
    const right = solveInverse({ x: 50, y: 100, z: 80 }, DEFAULT_PROFILE)!;
    expect(left.base).toBeCloseTo(-right.base, 7);
    expect(left.shoulder).toBeCloseTo(right.shoulder, 7);
    expect(left.elbow).toBeCloseTo(right.elbow, 7);
  });

  it("rejects geometry beyond maximum reach", () => {
    const result = validatePose({ x: 0, y: 500, z: 500 }, DEFAULT_PROFILE);
    expect(result.valid).toBe(false);
    expect(result.diagnostics[0]?.code).toBe("IK_UNREACHABLE");
  });

  it("distinguishes servo-limit failures from unreachable geometry", () => {
    const result = validatePose({ x: 100, y: 0, z: 50 }, DEFAULT_PROFILE);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((item) => item.code === "SERVO_LIMIT")).toBe(true);
  });
});
