import { describe, expect, it } from "vitest";
import studentSketch from "../src/samples/MeArm_Dance_Student.ino?raw";
import instructorSketch from "../src/samples/MeArm_Dance_Instructor.ino?raw";
import freeFormSketch from "../src/samples/MeArm_Free_Form.ino?raw";
import { extractLesson } from "../src/app/lesson";

describe("lesson extraction", () => {
  it("reads the goal and every TODO from the student starter", () => {
    const lesson = extractLesson(studentSketch);
    expect(lesson).not.toBeNull();
    expect(lesson?.goal).toContain("your own short robot dance");
    expect(lesson?.steps.map((step) => step.number)).toEqual([1, 2, 3]);
    expect(lesson?.steps.map((step) => step.title)).toEqual(["RHYTHM", "ORDER", "YOUR MOVE"]);
  });

  it("keeps the prediction prompt with its step", () => {
    const [rhythm] = extractLesson(studentSketch)?.steps ?? [];
    expect(rhythm?.detail).toContain("250 through 1500 milliseconds");
    expect(rhythm?.detail).toContain("Predict");
  });

  it("points each step at the line the student must edit", () => {
    const lesson = extractLesson(studentSketch);
    const lines = studentSketch.split("\n");
    for (const step of lesson?.steps ?? []) {
      expect(lines[step.line - 1]).toContain(`TODO ${step.number}`);
    }
  });

  it("returns null for a sketch that carries no lesson", () => {
    expect(extractLesson(freeFormSketch)).toBeNull();
  });

  it("tolerates a sketch with a goal but no steps, and vice versa", () => {
    expect(extractLesson("// TODO 4 - LOOPS\n// Try it.\n")).toEqual({
      steps: [{ number: 4, title: "LOOPS", line: 1, detail: "Try it." }],
    });
    const goalOnly = extractLesson("/*\n  PROJECT GOAL\n  Do the thing.\n*/\n");
    expect(goalOnly).toEqual({ goal: "Do the thing.", steps: [] });
  });

  it("does not invent steps from ordinary comments", () => {
    // The instructor dance has explanatory comments throughout but no TODOs.
    const lesson = extractLesson(instructorSketch);
    expect(lesson?.steps ?? []).toEqual([]);
  });

  it("ignores a TODO marker that has no title", () => {
    expect(extractLesson("// TODO 1 -\n")).toBeNull();
  });
});
