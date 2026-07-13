import { describe, expect, it } from "vitest";
import instructorSketch from "./fixtures/MeArm_Dance_Instructor.ino?raw";
import { DEFAULT_PROFILE } from "../src/core/profile";
import {
  compilePreview,
  createProfile,
  defaultProfileValues,
  FREE_FORM_BOUNDS,
  lineRange,
  profileToValues,
} from "../src/app/preview";

describe("classroom preview compilation", () => {
  it("compiles a supported classroom sketch", () => {
    const result = compilePreview(instructorSketch, DEFAULT_PROFILE);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.timeline.loop).toHaveLength(29);
  });

  it("returns a line-linked parser diagnostic", () => {
    const result = compilePreview("MeArm arm;\nvoid setup(){}\nvoid loop(){ if(true){} }", DEFAULT_PROFILE);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.line).toBeGreaterThan(0);
      expect(result.message).not.toContain("(line");
    }
  });

  it("round-trips default instructor settings", () => {
    const values = defaultProfileValues();
    expect(profileToValues(createProfile(values))).toEqual(values);
  });

  it("rejects invalid robot geometry before parsing", () => {
    const values = defaultProfileValues();
    values.l1 = 0;
    const result = compilePreview(instructorSketch, createProfile(values));
    expect(result).toMatchObject({ ok: false, code: "INVALID_PROFILE" });
  });

  it("finds the exact selection range for a source line", () => {
    const source = "first\nsecond line\nthird";
    const range = lineRange(source, 2);
    expect(source.slice(range.start, range.end)).toBe("second line");
  });

  it("enforces inclusive free-form coordinate limits", () => {
    const source = instructorSketch.replace("arm.moveToXYZ(0, 100, 50);", "arm.moveToXYZ(-100, 200, 150);");
    expect(compilePreview(source, DEFAULT_PROFILE, FREE_FORM_BOUNDS).ok).toBe(true);

    const outside = source.replace("arm.moveToXYZ(-100, 200, 150);", "arm.moveToXYZ(-101, 200, 150);");
    const result = compilePreview(outside, DEFAULT_PROFILE, FREE_FORM_BOUNDS);
    expect(result).toMatchObject({ ok: false, code: "COORDINATE_OUT_OF_BOUNDS" });
    if (!result.ok) expect(result.message).toContain("X must be between -100 and 100 mm");
  });
});
