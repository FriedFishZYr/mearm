import type { Point3, RobotProfile } from "./types";

const degrees = (value: number): number => (value * Math.PI) / 180;

export const DEFAULT_PROFILE: RobotProfile = Object.freeze({
  version: 1,
  name: "MeArm v3 classroom defaults",
  links: { l1: 80, l2: 80, l3: 22 },
  home: { x: 0, y: 100, z: 50 },
  servoLimits: {
    base: { min: degrees(-45), max: degrees(45) },
    shoulder: { min: degrees(45), max: degrees(135) },
    elbow: { min: degrees(-45), max: degrees(45) },
  },
  timing: {
    movementStepMm: 10,
    movementStepDelayMs: 50,
    clawDelayMs: 300,
  },
  approvedPoses: [
    { name: "HOME", x: 0, y: 100, z: 50 },
    { name: "LEFT", x: -50, y: 100, z: 80 },
    { name: "RIGHT", x: 50, y: 100, z: 80 },
    { name: "HIGH", x: 0, y: 100, z: 120 },
    { name: "LOW", x: 0, y: 120, z: 40 },
  ],
});

export function validateProfile(profile: RobotProfile): string[] {
  const errors: string[] = [];
  const positive = [
    ["L1", profile.links.l1],
    ["L2", profile.links.l2],
    ["movement step", profile.timing.movementStepMm],
    ["movement delay", profile.timing.movementStepDelayMs],
    ["claw delay", profile.timing.clawDelayMs],
  ] as const;

  for (const [name, value] of positive) {
    if (!Number.isFinite(value) || value <= 0) errors.push(`${name} must be positive and finite.`);
  }
  if (!Number.isFinite(profile.links.l3) || profile.links.l3 < 0) {
    errors.push("L3 must be non-negative and finite.");
  }
  for (const [name, range] of Object.entries(profile.servoLimits)) {
    if (!Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min > range.max) {
      errors.push(`${name} servo limits are invalid.`);
    }
  }
  if (![profile.home.x, profile.home.y, profile.home.z].every(Number.isFinite)) {
    errors.push("Home position must be finite.");
  }
  return errors;
}

export const samePoint = (a: Point3, b: Point3, tolerance = 1e-6): boolean =>
  Math.abs(a.x - b.x) <= tolerance &&
  Math.abs(a.y - b.y) <= tolerance &&
  Math.abs(a.z - b.z) <= tolerance;
