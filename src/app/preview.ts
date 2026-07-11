import { SketchParseError, parseSketch } from "../core/parser";
import { DEFAULT_PROFILE, validateProfile } from "../core/profile";
import { buildTimeline } from "../core/timeline";
import type { ParsedSketch, RobotProfile, Timeline } from "../core/types";

export interface ProfileValues {
  l1: number;
  l2: number;
  l3: number;
  homeX: number;
  homeY: number;
  homeZ: number;
  baseMin: number;
  baseMax: number;
  shoulderMin: number;
  shoulderMax: number;
  elbowMin: number;
  elbowMax: number;
}

export type PreviewResult =
  | { ok: true; sketch: ParsedSketch; timeline: Timeline; profile: RobotProfile }
  | { ok: false; code: string; message: string; line?: number; column?: number };

const radians = (degrees: number): number => degrees * Math.PI / 180;
const degrees = (radiansValue: number): number => radiansValue * 180 / Math.PI;

export function defaultProfileValues(): ProfileValues {
  return profileToValues(DEFAULT_PROFILE);
}

export function profileToValues(profile: RobotProfile): ProfileValues {
  return {
    l1: profile.links.l1,
    l2: profile.links.l2,
    l3: profile.links.l3,
    homeX: profile.home.x,
    homeY: profile.home.y,
    homeZ: profile.home.z,
    baseMin: degrees(profile.servoLimits.base.min),
    baseMax: degrees(profile.servoLimits.base.max),
    shoulderMin: degrees(profile.servoLimits.shoulder.min),
    shoulderMax: degrees(profile.servoLimits.shoulder.max),
    elbowMin: degrees(profile.servoLimits.elbow.min),
    elbowMax: degrees(profile.servoLimits.elbow.max),
  };
}

export function createProfile(values: ProfileValues): RobotProfile {
  const profile: RobotProfile = {
    version: 1,
    name: "Instructor preview settings",
    links: { l1: values.l1, l2: values.l2, l3: values.l3 },
    home: { x: values.homeX, y: values.homeY, z: values.homeZ },
    servoLimits: {
      base: { min: radians(values.baseMin), max: radians(values.baseMax) },
      shoulder: { min: radians(values.shoulderMin), max: radians(values.shoulderMax) },
      elbow: { min: radians(values.elbowMin), max: radians(values.elbowMax) },
    },
    timing: { ...DEFAULT_PROFILE.timing },
    approvedPoses: DEFAULT_PROFILE.approvedPoses.map((pose) => ({ ...pose })),
  };
  return profile;
}

export function compilePreview(source: string, profile: RobotProfile): PreviewResult {
  const profileErrors = validateProfile(profile);
  if (profileErrors.length > 0) {
    return { ok: false, code: "INVALID_PROFILE", message: profileErrors.join(" ") };
  }
  try {
    const sketch = parseSketch(source);
    const timeline = buildTimeline(sketch, profile);
    if (timeline.loop.length === 0) {
      return { ok: false, code: "EMPTY_LOOP", message: "Add at least one supported command inside loop()." };
    }
    return { ok: true, sketch, timeline, profile };
  } catch (error) {
    if (error instanceof SketchParseError) {
      return {
        ok: false,
        code: error.code,
        message: error.message.replace(/ \(line \d+, column \d+\)$/, ""),
        line: error.location.line,
        column: error.location.column,
      };
    }
    return {
      ok: false,
      code: "PREVIEW_FAILED",
      message: error instanceof Error ? error.message : "The preview could not be created.",
    };
  }
}

export function lineRange(source: string, line: number): { start: number; end: number } {
  const safeLine = Math.max(1, Math.floor(line));
  let start = 0;
  for (let current = 1; current < safeLine; current += 1) {
    const newline = source.indexOf("\n", start);
    if (newline === -1) return { start: source.length, end: source.length };
    start = newline + 1;
  }
  const newline = source.indexOf("\n", start);
  return { start, end: newline === -1 ? source.length : newline };
}
