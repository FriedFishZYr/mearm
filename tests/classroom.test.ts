import { describe, expect, it } from "vitest";
import instructorSketch from "./fixtures/MeArm_Dance_Instructor.ino?raw";
import studentSketch from "./fixtures/MeArm_Dance_Student.ino?raw";
import { parseSketch } from "../src/core/parser";
import { DEFAULT_PROFILE } from "../src/core/profile";
import { buildTimeline } from "../src/core/timeline";

describe("classroom dance integration", () => {
  it.each([
    ["instructor", instructorSketch, 29],
    ["student", studentSketch, 16],
  ])("builds the complete %s dance without invalid motion", (_name, source, commandCount) => {
    const timeline = buildTimeline(parseSketch(source), DEFAULT_PROFILE);
    expect(timeline.loop).toHaveLength(commandCount);
    expect(timeline.diagnostics.filter((item) => item.severity === "invalid")).toEqual([]);
    expect(timeline.loopDurationMs).toBeGreaterThan(0);
  });
});
