import { solveInverse, validatePose } from "./kinematics";
import type {
  Command,
  Diagnostic,
  ParsedSketch,
  Point3,
  RobotProfile,
  Timeline,
  TimelineSample,
  TimelineSegment,
  TimelineState,
} from "./types";

const copyPoint = (point: Point3): Point3 => ({ ...point });
const copyState = (state: TimelineState): TimelineState => ({
  ...state,
  position: copyPoint(state.position),
  angles: { ...state.angles },
});

function distance(a: Point3, b: Point3): number {
  return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
}

function interpolate(a: Point3, b: Point3, fraction: number): Point3 {
  return {
    x: a.x + (b.x - a.x) * fraction,
    y: a.y + (b.y - a.y) * fraction,
    z: a.z + (b.z - a.z) * fraction,
  };
}

function segmentForCommand(
  command: Command,
  state: TimelineState,
  startMs: number,
  profile: RobotProfile,
): TimelineSegment {
  const startState = copyState(state);
  const samples: TimelineSample[] = [];
  const diagnostics: Diagnostic[] = [];
  let durationMs = 0;
  let endState = copyState(state);

  const addPose = (point: Point3, offsetMs: number, includeCautions = true): boolean => {
    const validation = validatePose(point, profile, command.location);
    samples.push({ offsetMs, state: copyState(endState), validation });
    diagnostics.push(
      ...validation.diagnostics.filter((item) => includeCautions || item.severity === "invalid"),
    );
    if (!validation.valid || !validation.angles) return false;
    endState = {
      ...endState,
      position: copyPoint(point),
      angles: { ...validation.angles },
    };
    samples[samples.length - 1]!.state = copyState(endState);
    return true;
  };

  switch (command.type) {
    case "begin": {
      const validation = validatePose(profile.home, profile, command.location);
      diagnostics.push(...validation.diagnostics);
      if (!validation.valid || !validation.angles) {
        diagnostics.push({
          code: "INVALID_HOME",
          severity: "invalid",
          message: "The configured HOME position is invalid, so the arm cannot initialize.",
          location: command.location,
          point: profile.home,
        });
        break;
      }
      endState = {
        position: copyPoint(profile.home),
        angles: { ...validation.angles },
        claw: "open",
        initialized: true,
      };
      durationMs = profile.timing.clawDelayMs;
      samples.push({ offsetMs: 0, state: copyState(endState), validation });
      break;
    }
    case "delay":
      durationMs = command.milliseconds;
      break;
    case "openClaw":
    case "closeClaw":
      if (!state.initialized) {
        diagnostics.push(uninitialized(command));
        break;
      }
      endState.claw = command.type === "openClaw" ? "open" : "closed";
      durationMs = profile.timing.clawDelayMs;
      break;
    case "snap":
      if (!state.initialized) {
        diagnostics.push(uninitialized(command));
        break;
      }
      addPose(command.target, 0);
      break;
    case "move": {
      if (!state.initialized) {
        diagnostics.push(uninitialized(command));
        break;
      }
      const totalDistance = distance(state.position, command.target);
      let offset = 0;
      for (let traveled = 0; traveled < totalDistance; traveled += profile.timing.movementStepMm) {
        if (!addPose(interpolate(state.position, command.target, traveled / totalDistance), offset, false)) break;
        offset += profile.timing.movementStepDelayMs;
      }
      if (!diagnostics.some((item) => item.severity === "invalid")) {
        addPose(command.target, offset);
        offset += profile.timing.movementStepDelayMs;
      }
      durationMs = offset;
      break;
    }
  }

  return {
    command,
    startMs,
    endMs: startMs + durationMs,
    startState,
    endState,
    samples,
    diagnostics,
  };
}

function uninitialized(command: Command): Diagnostic {
  return {
    code: "ARM_NOT_INITIALIZED",
    severity: "invalid",
    message: "The arm must be initialized with begin() before this command.",
    location: command.location,
  };
}

function buildSegments(
  commands: Command[],
  initialState: TimelineState,
  profile: RobotProfile,
): { segments: TimelineSegment[]; durationMs: number; state: TimelineState; diagnostics: Diagnostic[] } {
  const segments: TimelineSegment[] = [];
  const diagnostics: Diagnostic[] = [];
  let state = copyState(initialState);
  let time = 0;

  for (const command of commands) {
    const segment = segmentForCommand(command, state, time, profile);
    segments.push(segment);
    diagnostics.push(...segment.diagnostics);
    state = copyState(segment.endState);
    time = segment.endMs;
    if (segment.diagnostics.some((item) => item.severity === "invalid")) break;
  }

  return { segments, durationMs: time, state, diagnostics };
}

export function buildTimeline(sketch: ParsedSketch, profile: RobotProfile): Timeline {
  const homeAngles = solveInverse(profile.home, profile);
  if (!homeAngles) throw new Error("Cannot create a timeline with an unreachable HOME position.");

  const uninitialized: TimelineState = {
    position: copyPoint(profile.home),
    angles: homeAngles,
    claw: "open",
    initialized: false,
  };
  const setup = buildSegments(sketch.setup, uninitialized, profile);
  const loop = buildSegments(sketch.loop, setup.state, profile);

  return {
    setup: setup.segments,
    loop: loop.segments,
    setupDurationMs: setup.durationMs,
    loopDurationMs: loop.durationMs,
    initialLoopState: copyState(setup.state),
    diagnostics: [...setup.diagnostics, ...loop.diagnostics],
  };
}
