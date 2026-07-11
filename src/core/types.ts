export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export interface JointAngles {
  base: number;
  shoulder: number;
  elbow: number;
}

export interface AngleRange {
  min: number;
  max: number;
}

export interface SourceLocation {
  line: number;
  column: number;
}

export interface ApprovedPose extends Point3 {
  name: string;
}

export interface RobotProfile {
  version: 1;
  name: string;
  links: { l1: number; l2: number; l3: number };
  home: Point3;
  servoLimits: {
    base: AngleRange;
    shoulder: AngleRange;
    elbow: AngleRange;
  };
  timing: {
    movementStepMm: number;
    movementStepDelayMs: number;
    clawDelayMs: number;
  };
  approvedPoses: ApprovedPose[];
}

interface LocatedCommand {
  location: SourceLocation;
}

export interface BeginCommand extends LocatedCommand {
  type: "begin";
  pins: [number, number, number, number];
}

export interface MoveCommand extends LocatedCommand {
  type: "move" | "snap";
  target: Point3;
}

export interface DelayCommand extends LocatedCommand {
  type: "delay";
  milliseconds: number;
}

export interface ClawCommand extends LocatedCommand {
  type: "openClaw" | "closeClaw";
}

export type Command = BeginCommand | MoveCommand | DelayCommand | ClawCommand;

export interface ParsedSketch {
  armVariable: string;
  pins: Record<string, number>;
  setup: Command[];
  loop: Command[];
}

export type DiagnosticSeverity = "caution" | "invalid";

export interface Diagnostic {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  location?: SourceLocation;
  point?: Point3;
}

export interface PoseValidation {
  valid: boolean;
  approved: boolean;
  angles?: JointAngles;
  reconstructed?: Point3;
  diagnostics: Diagnostic[];
}

export interface TimelineState {
  position: Point3;
  angles: JointAngles;
  claw: "open" | "closed";
  initialized: boolean;
}

export interface TimelineSample {
  offsetMs: number;
  state: TimelineState;
  validation: PoseValidation;
}

export interface TimelineSegment {
  command: Command;
  startMs: number;
  endMs: number;
  startState: TimelineState;
  endState: TimelineState;
  samples: TimelineSample[];
  diagnostics: Diagnostic[];
}

export interface Timeline {
  setup: TimelineSegment[];
  loop: TimelineSegment[];
  setupDurationMs: number;
  loopDurationMs: number;
  initialLoopState: TimelineState;
  diagnostics: Diagnostic[];
}
