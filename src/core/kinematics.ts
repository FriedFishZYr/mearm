import { samePoint } from "./profile";
import type { JointAngles, Point3, PoseValidation, RobotProfile, SourceLocation } from "./types";

const EPSILON = 1e-7;

function cartToPolar(a: number, b: number): { radius: number; angle: number } {
  const radius = Math.hypot(a, b);
  if (radius === 0) return { radius: 0, angle: 0 };
  const cosine = Math.max(-1, Math.min(1, a / radius));
  const sine = Math.max(-1, Math.min(1, b / radius));
  const angle = Math.acos(cosine) * (sine < 0 ? -1 : 1);
  return { radius, angle };
}

function cosineAngle(opposite: number, adjacent1: number, adjacent2: number): number | null {
  const denominator = 2 * adjacent1 * adjacent2;
  if (denominator === 0) return null;
  const cosine =
    (adjacent1 * adjacent1 + adjacent2 * adjacent2 - opposite * opposite) / denominator;
  if (cosine > 1 + EPSILON || cosine < -1 - EPSILON) return null;
  return Math.acos(Math.max(-1, Math.min(1, cosine)));
}

export function solveInverse(point: Point3, profile: RobotProfile): JointAngles | null {
  if (![point.x, point.y, point.z].every(Number.isFinite)) return null;

  const top = cartToPolar(point.y, point.x);
  const armPlane = cartToPolar(top.radius - profile.links.l3, point.z);
  const shoulderInner = cosineAngle(profile.links.l2, profile.links.l1, armPlane.radius);
  const elbowInner = cosineAngle(armPlane.radius, profile.links.l1, profile.links.l2);
  if (shoulderInner === null || elbowInner === null) return null;

  const shoulder = armPlane.angle + shoulderInner;
  return {
    base: top.angle,
    shoulder,
    elbow: elbowInner + shoulder - Math.PI,
  };
}

export function solveForward(angles: JointAngles, profile: RobotProfile): Point3 {
  const horizontal =
    profile.links.l1 * Math.cos(angles.shoulder) +
    profile.links.l2 * Math.cos(angles.elbow) +
    profile.links.l3;
  return {
    x: horizontal * Math.sin(angles.base),
    y: horizontal * Math.cos(angles.base),
    z:
      profile.links.l1 * Math.sin(angles.shoulder) +
      profile.links.l2 * Math.sin(angles.elbow),
  };
}

function inside(value: number, min: number, max: number): boolean {
  return value >= min - EPSILON && value <= max + EPSILON;
}

export function validatePose(
  point: Point3,
  profile: RobotProfile,
  location?: SourceLocation,
): PoseValidation {
  const diagnostics: PoseValidation["diagnostics"] = [];
  const angles = solveInverse(point, profile);
  if (!angles) {
    diagnostics.push({
      code: "IK_UNREACHABLE",
      severity: "invalid",
      message: `Position (${point.x}, ${point.y}, ${point.z}) cannot be reached by this arm geometry.`,
      location,
      point,
    });
    return { valid: false, approved: false, diagnostics };
  }

  const failures = (Object.keys(profile.servoLimits) as (keyof JointAngles)[]).filter(
    (joint) => !inside(angles[joint], profile.servoLimits[joint].min, profile.servoLimits[joint].max),
  );
  if (failures.length) {
    diagnostics.push({
      code: "SERVO_LIMIT",
      severity: "invalid",
      message: `Position exceeds the configured ${failures.join(", ")} servo limit${failures.length > 1 ? "s" : ""}.`,
      location,
      point,
    });
  }

  const approved = profile.approvedPoses.some((pose) => samePoint(point, pose));
  if (!approved && failures.length === 0) {
    diagnostics.push({
      code: "POSE_NOT_APPROVED",
      severity: "caution",
      message: "Position is mathematically valid but is not on the instructor-approved pose list.",
      location,
      point,
    });
  }

  return {
    valid: failures.length === 0,
    approved,
    angles,
    reconstructed: solveForward(angles, profile),
    diagnostics,
  };
}
