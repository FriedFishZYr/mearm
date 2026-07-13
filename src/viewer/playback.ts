import type { JointAngles, Point3, TimelineSegment, TimelineState } from "../core/types";
import type { ViewerStatus } from "./arm-model";

export interface PlaybackFrame {
  state: TimelineState;
  clawOpenness: number;
  segment: TimelineSegment;
  segmentIndex: number;
  status: ViewerStatus;
}

const mix = (a: number, b: number, amount: number): number => a + (b - a) * amount;
const mixPoint = (a: Point3, b: Point3, amount: number): Point3 => ({
  x: mix(a.x, b.x, amount),
  y: mix(a.y, b.y, amount),
  z: mix(a.z, b.z, amount),
});
const mixAngles = (a: JointAngles, b: JointAngles, amount: number): JointAngles => ({
  base: mix(a.base, b.base, amount),
  shoulder: mix(a.shoulder, b.shoulder, amount),
  elbow: mix(a.elbow, b.elbow, amount),
});
const openness = (state: TimelineState): number => state.claw === "open" ? 1 : 0;

function copyState(state: TimelineState): TimelineState {
  return { ...state, position: { ...state.position }, angles: { ...state.angles } };
}

function interpolateState(a: TimelineState, b: TimelineState, amount: number): TimelineState {
  return {
    ...a,
    position: mixPoint(a.position, b.position, amount),
    angles: mixAngles(a.angles, b.angles, amount),
    claw: amount < 0.5 ? a.claw : b.claw,
  };
}

export function sampleSegments(segments: TimelineSegment[], timeMs: number): PlaybackFrame {
  if (segments.length === 0) throw new Error("Cannot sample an empty timeline.");
  const duration = segments.at(-1)!.endMs;
  const clamped = Math.max(0, Math.min(timeMs, duration));
  const index = segments.findIndex((segment) => clamped < segment.endMs);
  const segmentIndex = index === -1 ? segments.length - 1 : index;
  const segment = segments[segmentIndex]!;
  const localTime = Math.max(0, clamped - segment.startMs);
  const segmentDuration = Math.max(0, segment.endMs - segment.startMs);
  let state = copyState(segment.startState);
  let clawOpenness = openness(state);

  if (segment.command.type === "move" && segment.samples.length > 0) {
    const samples = segment.samples;
    const nextIndex = samples.findIndex((sample) => sample.offsetMs > localTime);
    if (nextIndex === -1) {
      state = copyState(segment.endState);
    } else if (nextIndex === 0) {
      state = copyState(samples[0]!.state);
    } else {
      const before = samples[nextIndex - 1]!;
      const after = samples[nextIndex]!;
      const span = after.offsetMs - before.offsetMs;
      const amount = span === 0 ? 1 : (localTime - before.offsetMs) / span;
      state = interpolateState(before.state, after.state, amount);
    }
    clawOpenness = openness(state);
  } else if (segment.command.type === "snap" || segment.command.type === "begin") {
    state = copyState(segment.endState);
    clawOpenness = openness(state);
  } else if (segment.command.type === "openClaw" || segment.command.type === "closeClaw") {
    const amount = segmentDuration === 0 ? 1 : localTime / segmentDuration;
    clawOpenness = mix(openness(segment.startState), openness(segment.endState), amount);
    state = interpolateState(segment.startState, segment.endState, amount);
  }

  const status: ViewerStatus = segment.diagnostics.some((item) => item.severity === "invalid")
    ? "invalid"
    : segment.diagnostics.some((item) => item.severity === "caution")
      ? "caution"
      : "valid";

  return { state, clawOpenness, segment, segmentIndex, status };
}

export function collectPath(segments: TimelineSegment[]): Point3[] {
  if (segments.length === 0) return [];
  const points: Point3[] = [{ ...segments[0]!.startState.position }];
  for (const segment of segments) {
    for (const sample of segment.samples) points.push({ ...sample.state.position });
  }
  return points;
}

export function collectTravelPoints(segments: TimelineSegment[]): Point3[] {
  if (segments.length === 0) return [];
  const points: Point3[] = [];
  const seen = new Set<string>();
  const add = (point: Point3): void => {
    const key = `${point.x}:${point.y}:${point.z}`;
    if (seen.has(key)) return;
    seen.add(key);
    points.push({ ...point });
  };

  add(segments[0]!.startState.position);
  for (const segment of segments) add(segment.endState.position);
  return points;
}
