import { describe, expect, it } from "vitest";
import stylesSource from "../src/styles.css?raw";
import interfaceSource from "../src/main.ts?raw";
import armModelSource from "../src/viewer/arm-model.ts?raw";
import sceneSource from "../src/viewer/scene.ts?raw";
import taskSpaceSource from "../src/viewer/task-space.ts?raw";
import { AXES_HELPER_ARGS, SHARED, SHARED_CSS_TOKENS, STATUS } from "../src/design/palette";

/** The `:root` declaration block, which is the only place literals may appear. */
const rootBlock = stylesSource.slice(
  stylesSource.indexOf(":root {"),
  stylesSource.indexOf("}", stylesSource.indexOf(":root {")) + 1,
);
const styleBody = stylesSource.slice(stylesSource.indexOf(rootBlock) + rootBlock.length);

describe("shared palette", () => {
  it("declares every shared value identically in CSS and TypeScript", () => {
    for (const [token, value] of Object.entries(SHARED_CSS_TOKENS)) {
      expect(rootBlock, `${token} must be declared in :root`).toContain(`${token}: ${value};`);
    }
  });

  it("keeps the axis helper arguments in Three's Y-up order, not app order", () => {
    // The viewer maps app-Z onto Three-Y. Reordering these to x, y, z would swap
    // green and blue in the viewport while every label stayed put.
    expect(AXES_HELPER_ARGS).toEqual([SHARED.axisX, SHARED.axisZ, SHARED.axisY]);
    expect(sceneSource).toContain("AXES_HELPER_ARGS[0]");
    expect(sceneSource).toContain("AXES_HELPER_ARGS[1]");
    expect(sceneSource).toContain("AXES_HELPER_ARGS[2]");
  });

  it("keeps status text and scene forms distinct", () => {
    // The scene forms are tuned to read on the lit robot and are far too light
    // to pass contrast as chrome text. Collapsing them would break both.
    for (const state of ["valid", "caution", "invalid"] as const) {
      const sceneHex = `#${STATUS[state].scene.toString(16).padStart(6, "0")}`;
      expect(STATUS[state].text).not.toBe(sceneHex);
    }
  });

  it("declares axis identity separately from validation status", () => {
    // These share bytes today. They mean different things and must be free to
    // diverge, so both declarations have to exist independently.
    expect(rootBlock).toContain("--axis-y: #246b5b;");
    expect(rootBlock).toContain("--status-valid-text: #246b5b;");
  });

  it("keeps every color literal in the stylesheet inside :root", () => {
    expect(styleBody.match(/#[0-9a-fA-F]{3,8}\b/g)).toBeNull();
    expect(styleBody.match(/rgba?\([0-9]/g)).toBeNull();
  });

  it("keeps every color literal in the viewer inside the palette module", () => {
    for (const [name, source] of [
      ["scene.ts", sceneSource],
      ["arm-model.ts", armModelSource],
      ["task-space.ts", taskSpaceSource],
    ] as const) {
      const literals = source.match(/0x[0-9a-fA-F]{6}\b/g);
      expect(literals, `${name} must source colors from src/design/palette.ts`).toBeNull();
    }
  });

  it("declares the type scale", () => {
    for (const [name, size] of [
      ["micro", 12], ["label", 13], ["ui", 15], ["subhead", 18],
      ["readout", 20], ["title", 24], ["display", 32],
    ] as const) {
      expect(rootBlock).toContain(`--fs-${name}: ${size}px;`);
    }
  });

  it("sets no literal font size outside the editor text grid", () => {
    const sized = [...styleBody.matchAll(/font(?:-size)?:\s*([^;}]+)/g)]
      .map((match) => match[1]?.trim() ?? "")
      .filter((value) => /\d[\d.]*(?:rem|px)/.test(value));
    // The editor text grid is deliberately exempt; everything else takes a step.
    const EDITOR_GRID = ["12px/20px", "12.5px/20px"];
    expect(sized.filter((value) => !EDITOR_GRID.some((grid) => value.includes(grid)))).toEqual([]);
  });

  it("declares the spacing scale", () => {
    for (const step of [2, 4, 6, 8, 12, 16, 24, 32]) {
      expect(rootBlock).toContain(`--space-${step}: ${step}px;`);
    }
  });

  it("resolves every custom property the stylesheet references", () => {
    const declared = new Set(stylesSource.match(/--[a-z0-9-]+(?=\s*:)/g) ?? []);
    // Set from JS by setupPanelResizer rather than declared in CSS.
    declared.add("--editor-col").add("--inspector-col");
    const used = new Set((stylesSource.match(/var\(--[a-z0-9-]+/g) ?? []).map((ref) => ref.slice(4)));
    expect([...used].filter((token) => !declared.has(token))).toEqual([]);
  });
});

/**
 * The code editor is a transparent textarea sitting exactly on top of a
 * highlighted copy of the same text, beside a gutter of line numbers. Three
 * stylesheet rules and one constant in main.ts encode that grid, and none of
 * them can be derived from the others. If they drift, the caret separates from
 * the glyphs and the gutter digits slide off their lines — progressively worse
 * further down the file, so it looks fine at the top and is badly wrong at
 * line 200. The spacing scale deliberately exempts these values.
 */
describe("editor text grid", () => {
  it("keeps every copy of the 20px line height in agreement", () => {
    expect(stylesSource).toContain("font: 12.5px/20px var(--font-mono)");
    expect(stylesSource).toContain("font: 12px/20px var(--font-mono)");
    expect(stylesSource).toMatch(/\.line-number \{[^}]*height: 20px/);
    expect(interfaceSource).toContain("const EDITOR_LINE_HEIGHT = 20;");
  });

  it("keeps the gutter and code vertical padding equal", () => {
    expect(stylesSource).toMatch(/\.gutter \{[^}]*padding-top: 12px/);
    expect(stylesSource).toMatch(/\.code-highlight, #code-editor \{[^}]*padding: 12px 13px/);
  });
});
