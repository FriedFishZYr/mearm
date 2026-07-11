import { describe, expect, it } from "vitest";
import instructorSketch from "./fixtures/MeArm_Dance_Instructor.ino?raw";
import studentSketch from "./fixtures/MeArm_Dance_Student.ino?raw";
import { parseSketch, SketchParseError } from "../src/core/parser";

describe("classroom sketch parser", () => {
  it("parses the instructor sketch into the expected command order", () => {
    const parsed = parseSketch(instructorSketch);
    expect(parsed.armVariable).toBe("arm");
    expect(parsed.pins).toEqual({ basePin: 11, shoulderPin: 10, elbowPin: 9, clawPin: 6 });
    expect(parsed.setup.map((command) => command.type)).toEqual(["begin", "delay"]);
    expect(parsed.loop).toHaveLength(29);
    expect(parsed.loop.at(-3)?.type).toBe("move");
    expect(parsed.loop.at(-2)?.type).toBe("openClaw");
    expect(parsed.loop.at(-1)?.type).toBe("delay");
  });

  it("ignores the commented-out TODO pose in the student sketch", () => {
    const parsed = parseSketch(studentSketch);
    expect(parsed.loop).toHaveLength(16);
    const moves = parsed.loop.filter((command) => command.type === "move");
    expect(moves).toHaveLength(5);
    expect(moves.some((command) => command.type === "move" && command.target.z === 40)).toBe(false);
  });

  it("ignores commands in both comment styles", () => {
    const parsed = parseSketch(`
      MeArm robot;
      int a = 1; int b = 2; int c = 3; int d = 4;
      void setup() { robot.begin(a, b, c, d); }
      void loop() {
        // robot.closeClaw();
        /* robot.moveToXYZ(0, 0, 0); */
        robot.openClaw();
      }
    `);
    expect(parsed.loop.map((command) => command.type)).toEqual(["openClaw"]);
  });

  it("accepts signed decimal coordinate literals", () => {
    const parsed = parseSketch(`
      MeArm arm;
      void setup() { arm.begin(11, 10, 9, 6); }
      void loop() { arm.snapToXYZ(-50.5, +100, .25); }
    `);
    expect(parsed.loop[0]).toMatchObject({ type: "snap", target: { x: -50.5, y: 100, z: 0.25 } });
  });

  it("rejects unsupported control flow with a source location", () => {
    expect(() => parseSketch(`
      MeArm arm;
      void setup() { arm.begin(11, 10, 9, 6); }
      void loop() { for (;;) { arm.openClaw(); } }
    `)).toThrowError(SketchParseError);
    try {
      parseSketch("MeArm arm; void setup(){arm.begin(1,2,3,4);} void loop(){if(true){arm.openClaw();}}");
    } catch (error) {
      expect(error).toBeInstanceOf(SketchParseError);
      expect((error as SketchParseError).location.line).toBe(1);
    }
  });

  it("rejects negative delays", () => {
    expect(() => parseSketch(`
      MeArm arm;
      void setup() { arm.begin(11, 10, 9, 6); }
      void loop() { delay(-1); }
    `)).toThrow(/non-negative integer/);
  });
});
