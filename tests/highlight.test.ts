import { describe, expect, it } from "vitest";
import { highlightArduino } from "../src/app/highlight";

describe("Arduino syntax highlighting", () => {
  it("distinguishes functions, types, and numeric values", () => {
    const output = highlightArduino("MeArm arm;\narm.moveToXYZ(-50, 100, 80);\ndelay(250);");

    expect(output).toContain('<span class="syntax-type">MeArm</span>');
    expect(output).toContain('<span class="syntax-function">moveToXYZ</span>');
    expect(output).toContain('<span class="syntax-function">delay</span>');
    expect(output).toContain('<span class="syntax-number">100</span>');
  });

  it("highlights incomplete comments without requiring valid code", () => {
    expect(highlightArduino("/* work in progress")).toBe('<span class="syntax-comment">/* work in progress</span>');
  });

  it("escapes source text before producing markup", () => {
    const output = highlightArduino('#include <Servo.h>\nconst char* label = "<script>";');

    expect(output).toContain("#include &lt;Servo.h&gt;");
    expect(output).toContain("&lt;script&gt;");
    expect(output).not.toContain("<script>");
  });
});
