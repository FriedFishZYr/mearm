import { describe, expect, it } from "vitest";
import { parseSketch } from "../src/core/parser";
import { DEFAULT_PROFILE } from "../src/core/profile";
import { buildTimeline } from "../src/core/timeline";
import { collectPath, sampleSegments } from "../src/viewer/playback";

const makeTimeline = (body: string) => buildTimeline(parseSketch(`
  MeArm arm;
  void setup() { arm.begin(11, 10, 9, 6); }
  void loop() { ${body} }
`), DEFAULT_PROFILE);

describe("viewer playback sampling", () => {
  it("interpolates between deterministic movement samples", () => {
    const timeline = makeTimeline("arm.moveToXYZ(0, 120, 50);");
    const frame = sampleSegments(timeline.loop, 75);
    expect(frame.state.position.y).toBeGreaterThan(100);
    expect(frame.state.position.y).toBeLessThan(120);
    expect(frame.status).toBe("caution");
  });

  it("animates claw openness during the command delay", () => {
    const timeline = makeTimeline("arm.closeClaw();");
    const frame = sampleSegments(timeline.loop, 150);
    expect(frame.clawOpenness).toBeCloseTo(0.5, 5);
    expect(frame.state.position).toEqual(DEFAULT_PROFILE.home);
  });

  it("clamps sampling to the final state", () => {
    const timeline = makeTimeline("arm.moveToXYZ(50, 100, 80);");
    const frame = sampleSegments(timeline.loop, timeline.loopDurationMs + 1000);
    expect(frame.state.position).toEqual({ x: 50, y: 100, z: 80 });
  });

  it("collects a renderable path from movement samples", () => {
    const timeline = makeTimeline("arm.moveToXYZ(-50, 100, 80); arm.moveToXYZ(50, 100, 80);");
    const points = collectPath(timeline.loop);
    expect(points[0]).toEqual(DEFAULT_PROFILE.home);
    expect(points.at(-1)).toEqual({ x: 50, y: 100, z: 80 });
    expect(points.length).toBeGreaterThan(10);
  });
});
