import { describe, expect, it } from "vitest";
import { parseSketch } from "../src/core/parser";
import { DEFAULT_PROFILE } from "../src/core/profile";
import { buildTimeline } from "../src/core/timeline";

const sketch = (loopBody: string) => parseSketch(`
  MeArm arm;
  void setup() { arm.begin(11, 10, 9, 6); delay(1000); }
  void loop() { ${loopBody} }
`);

describe("deterministic timeline", () => {
  it("executes setup once and records its initial loop state", () => {
    const timeline = buildTimeline(sketch("delay(250);"), DEFAULT_PROFILE);
    expect(timeline.setup).toHaveLength(2);
    expect(timeline.setupDurationMs).toBe(1300);
    expect(timeline.initialLoopState.initialized).toBe(true);
    expect(timeline.initialLoopState.position).toEqual(DEFAULT_PROFILE.home);
    expect(timeline.loopDurationMs).toBe(250);
  });

  it("gives a zero-distance move the source library's final 50 ms", () => {
    const timeline = buildTimeline(
      sketch("arm.moveToXYZ(0, 100, 50);"),
      DEFAULT_PROFILE,
    );
    const movement = timeline.loop[0]!;
    expect(movement.endMs - movement.startMs).toBe(50);
    expect(movement.samples).toHaveLength(1);
  });

  it("uses ceil(distance / 10) plus the final sample", () => {
    const timeline = buildTimeline(
      sketch("arm.moveToXYZ(0, 110, 50);"),
      DEFAULT_PROFILE,
    );
    const movement = timeline.loop[0]!;
    expect(movement.samples).toHaveLength(2);
    expect(movement.endMs - movement.startMs).toBe(100);
  });

  it("models claw commands as 300 ms state transitions", () => {
    const timeline = buildTimeline(
      sketch("arm.closeClaw(); arm.openClaw();"),
      DEFAULT_PROFILE,
    );
    expect(timeline.loop.map((segment) => segment.endMs - segment.startMs)).toEqual([300, 300]);
    expect(timeline.loop[0]?.endState.claw).toBe("closed");
    expect(timeline.loop[1]?.endState.claw).toBe("open");
  });

  it("stops the normal timeline at the first invalid pose", () => {
    const timeline = buildTimeline(
      sketch("arm.moveToXYZ(0, 500, 500); delay(999);"),
      DEFAULT_PROFILE,
    );
    expect(timeline.loop).toHaveLength(1);
    expect(timeline.diagnostics.some((item) => item.severity === "invalid")).toBe(true);
  });
});
