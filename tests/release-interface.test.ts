import { describe, expect, it } from "vitest";
import indexMarkup from "../index.html?raw";
import interfaceSource from "../src/main.ts?raw";
import presetsSource from "../src/views/presets.ts?raw";
import sceneSource from "../src/viewer/scene.ts?raw";
import examplesSource from "../src/views/examples.ts?raw";
import stylesSource from "../src/styles.css?raw";
import parserSource from "../src/core/parser.ts?raw";
import previewSource from "../src/app/preview.ts?raw";

/**
 * The workspace markup lives in index.html. These assertions read the shipped
 * document rather than the source text of whichever module happens to build it,
 * so moving markup between files cannot break the contract and cannot silently
 * drop a control either.
 */
const attribute = (name: string): string[] =>
  Array.from(indexMarkup.matchAll(new RegExp(`\\s${name}="([^"]+)"`, "g")), (match) => match[1] ?? "");

const ids = attribute("id");
const idSet = new Set(ids);
const ariaLabels = new Set(attribute("aria-label"));

describe("release interface contract", () => {
  it("keeps every required control in the shipped document", () => {
    for (const id of [
      "app",
      "code-editor",
      "code-highlight",
      "line-numbers",
      "example-open",
      "example-name",
      "example-dialog",
      "example-groups",
      "lesson-strip",
      "lesson-goal",
      "lesson-steps",
      "preview",
      "reset-code",
      "editor-message",
      "scene",
      "freeform-constraints",
      "fit-camera",
      "reset-camera",
      "camera-preset",
      "toggle-path",
      "toggle-task-space",
      "toggle-grid",
      "toggle-axes",
      "play",
      "restart",
      "previous-command",
      "next-command",
      "speed",
      "repeat",
      "timeline",
      "timeline-segments",
      "current-time",
      "duration",
      "command",
      "source-line",
      "preset-list",
      "delay-command-row",
      "claw-command-row",
      "preset-copy-status",
      "status",
      "editor-state",
      "statusbar-message",
      "pose-name",
      "camera-view",
      "code-count",
      "settings-dialog",
      "settings-form",
      "settings-open",
      "settings-close",
      "settings-reset",
      "settings-error",
      "resize-editor",
      "resize-inspector",
    ]) expect(idSet, `#${id} must exist in index.html`).toContain(id);
  });

  it("keeps the twelve instructor profile fields", () => {
    for (const id of [
      "setting-l1", "setting-l2", "setting-l3",
      "setting-home-x", "setting-home-y", "setting-home-z",
      "setting-base-min", "setting-base-max",
      "setting-shoulder-min", "setting-shoulder-max",
      "setting-elbow-min", "setting-elbow-max",
    ]) expect(idSet, `#${id} must exist in index.html`).toContain(id);
  });

  it("keeps the accessible names that assistive technology depends on", () => {
    for (const label of [
      "Arduino dance code",
      "Code command markers",
      "Dance timeline",
      "Base maximum angle",
      "Shoulder maximum angle",
      "Elbow maximum angle",
      "Approved pose commands",
      "Delay commands",
      "Claw commands",
      "Free form coordinate limits",
      "Playback speed",
      "Camera preset",
    ]) expect(ariaLabels, `aria-label="${label}" must exist`).toContain(label);
  });

  it("offers every bundled example, grouped by what to do with it", () => {
    // A flat dropdown gave no way to tell an exercise from a demonstration.
    const modes = ["instructor", "student", "pick-place", "sorting",
                   "palletizing", "house", "cyberpunk", "freeform"];
    for (const mode of modes) {
      expect(examplesSource, `${mode} must be registered`).toContain(`${/^[a-z]+$/.test(mode) ? mode : `"${mode}"`}: {`);
    }
    // Every sketch belongs to exactly one group, and every group is non-empty.
    const grouped = Array.from(examplesSource.matchAll(/modes: \[([^\]]+)\]/g), (m) => m[1] ?? "")
      .flatMap((list) => list.split(",").map((entry) => entry.trim().replace(/"/g, "")))
      .filter(Boolean);
    expect(grouped.sort()).toEqual([...modes].sort());
    expect(examplesSource).toContain("House shape dance");
    expect(examplesSource).toContain("Cyberpunk beat dance");
    // Each card carries a description written for a student, not a filename.
    expect((examplesSource.match(/description: "/g) ?? []).length).toBe(modes.length);
  });

  it("measures example statistics instead of hard-coding them", () => {
    // A hand-written "16 commands" goes stale the moment a sketch is edited.
    expect(interfaceSource).toContain("function measureExamples()");
    expect(interfaceSource).toContain("result.timeline.loop.length");
    expect(interfaceSource).toContain("formatTime(result.timeline.loopDurationMs)");
  });

  it("declares no duplicate element ids", () => {
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it("resolves every aria-labelledby reference to a real element", () => {
    const referenced = attribute("aria-labelledby").flatMap((value) => value.split(/\s+/));
    expect(referenced.length).toBeGreaterThan(0);
    expect(referenced.filter((id) => !idSet.has(id))).toEqual([]);
  });

  it("keeps a live region for status and a named WebGL canvas", () => {
    expect(indexMarkup).toContain('role="status"');
    expect(sceneSource).toContain("Interactive three-dimensional preview of the MeArm robot dance");
    expect(sceneSource).toContain("setTaskSpaceVisible(visible: boolean)");
  });

  it("builds copyable preset commands from the approved robot poses", () => {
    expect(presetsSource).toContain("DEFAULT_PROFILE.approvedPoses");
    expect(presetsSource).toContain("DELAY_PRESETS_MS = [250, 500, 1000, 2000]");
    expect(presetsSource).toContain('{ name: "Open claw", command: "arm.openClaw();" }');
    expect(presetsSource).toContain('{ name: "Close claw", command: "arm.closeClaw();" }');
    expect(presetsSource).toContain('class="copy-command preset-command"');
  });

  it("keeps the clipboard, gutter, and playback wiring", () => {
    expect(interfaceSource).toContain("renderPresetCommands()");
    expect(interfaceSource).toContain("navigator.clipboard.writeText(command)");
    expect(interfaceSource).toContain('document.querySelectorAll<HTMLButtonElement>(".copy-command")');
    expect(interfaceSource).toContain('button.className = "command-marker"');
    expect(interfaceSource).toContain("button.dataset.commandIndex = String(firstIndex)");
    expect(interfaceSource).toContain("visitCommand(Number(marker.dataset.commandIndex))");
    expect(interfaceSource).toContain('range.addEventListener("input"');
    expect(interfaceSource).toContain("setPlaybackEnabled(false)");
  });

  it("resolves every element the application looks up at runtime", () => {
    // main.ts throws "Missing interface element #id" on any miss, so a markup
    // edit that drops an element crashes the app at boot. This is the guard.
    const looked_up = new Set(
      Array.from(interfaceSource.matchAll(/get(?:<[^>]+>)?\("([a-z0-9-]+)"\)/g), (m) => m[1] ?? ""),
    );
    expect(looked_up.size).toBeGreaterThan(40);
    expect([...looked_up].filter((id) => !idSet.has(id))).toEqual([]);
  });

  it("keeps the class hooks the application queries by selector", () => {
    for (const className of ["workspace", "editor-panel", "inspector"]) {
      expect(interfaceSource, `main.ts should query .${className}`).toContain(`".${className}"`);
      expect(indexMarkup, `.${className} must exist in index.html`)
        .toMatch(new RegExp(`class="[^"]*\\b${className}\\b`));
    }
  });

  it("puts the transport under the viewport, not in the inspector", () => {
    // The primary action of the product is "play the program". It belongs at
    // full width beneath the viewport, not two-thirds down a 300px sidebar.
    const stage = indexMarkup.indexOf('class="stage"');
    const transport = indexMarkup.indexOf('class="transport-bar"');
    const inspector = indexMarkup.indexOf("<aside");
    expect(transport).toBeGreaterThan(stage);
    expect(transport).toBeLessThan(inspector);
    expect(indexMarkup.indexOf('class="viewport-column"')).toBeLessThan(stage);
  });

  it("draws the timeline as proportional blocks coloured by command kind", () => {
    // PRODUCT_SPEC requires movement time to be distinguishable from explicit
    // delay() time. A bare range input cannot show that; blocks can.
    expect(interfaceSource).toContain("renderTimelineSegments()");
    expect(interfaceSource).toContain('class="timeline-segment is-');
    expect(interfaceSource).toContain("flex-grow:");
    for (const kind of ['"move"', '"claw"', '"wait"']) {
      expect(interfaceSource, `segmentKind must return ${kind}`).toContain(kind);
    }
    // The blocks are decorative; the range input keeps every interaction.
    expect(indexMarkup).toMatch(/id="timeline-segments"[^>]*aria-hidden="true"/);
    expect(indexMarkup).toMatch(/id="timeline"[^>]*type="range"/);
  });

  it("inserts a preset command at the caret, keeping copy as the alternate", () => {
    // Classroom use shows students reaching for these chips constantly, so the
    // click / click / position / paste round trip is the thing worth removing.
    expect(interfaceSource).toContain("function insertCommand(");
    expect(interfaceSource).toContain("editor.setRangeText(insertion");
    expect(interfaceSource).toContain("if (event.altKey) void copyPresetCommand(");
    expect(interfaceSource).toContain("else insertCommand(");
    // The insertion must drive the same update path as typing.
    expect(interfaceSource).toContain('editor.dispatchEvent(new Event("input", { bubbles: true }))');
    // The clipboard path and its execCommand fallback both survive.
    expect(interfaceSource).toContain("navigator.clipboard.writeText(command)");
    expect(interfaceSource).toContain('document.execCommand("copy")');
    expect(presetsSource).toContain("aria-label=\"Insert ${command}\"");
    expect(presetsSource).toContain("Alt-click to copy");
  });

  it("keeps the copyable commands in the editor column", () => {
    // The chips are an authoring aid: you copy a command and paste it into the
    // code. They sat in the inspector, on the far side of the viewport from the
    // editor they feed. Assert the document order that fixed that.
    const editor = indexMarkup.indexOf('class="editor-wrap"');
    const presets = indexMarkup.indexOf('id="presets-section"');
    const inspector = indexMarkup.indexOf("<aside");
    expect(editor).toBeGreaterThan(-1);
    expect(presets).toBeGreaterThan(editor);
    expect(presets).toBeLessThan(inspector);
  });

  it("confirms a successful compile visibly", () => {
    // The success message was clipped to a single pixel, so a beginner got no
    // sign that anything had worked. That is the most important message in a
    // first programming lesson.
    const rule = /\.editor-message\.success \{([^}]*)\}/.exec(stylesSource)?.[1] ?? "";
    expect(rule).not.toBe("");
    expect(rule).not.toContain("clip-path");
    expect(rule).not.toContain("height: 1px");
  });

  it("attaches beginner guidance to real diagnostic codes only", () => {
    // A hint keyed to a code nothing emits is dead text that nobody will notice
    // has gone stale. Every key must correspond to a code the app can produce.
    const emitted = new Set([
      ...Array.from(parserSource.matchAll(/fail\("([A-Z_]+)"/g), (m) => m[1]),
      ...Array.from(previewSource.matchAll(/code: "([A-Z_]+)"/g), (m) => m[1]),
      "UNSUPPORTED_STATEMENT", // emitted via the unsupported() helper
    ]);
    const hinted = Array.from(interfaceSource.matchAll(/^ {2}([A-Z_]+):/gm), (m) => m[1] ?? "");
    expect(hinted.length).toBeGreaterThan(10);
    expect(hinted.filter((code) => !emitted.has(code))).toEqual([]);
  });

  it("escapes the student source line it echoes back", () => {
    // The offending line is rendered into innerHTML. It is student-authored
    // text, and this app's whole safety claim is that pasted source is never
    // executed.
    expect(interfaceSource).toContain("function escapeHtml(");
    expect(interfaceSource).toContain("escapeHtml(sourceLine.trim())");
    expect(interfaceSource).toContain("escapeHtml(text)");
  });

  it("names the profile dialog for what it changes", () => {
    // It configures the simulation, not the robot. The old title contradicted
    // the paragraph directly beneath it.
    expect(indexMarkup).toContain("Simulation profile");
    expect(indexMarkup).not.toContain("Robot settings");
  });

  it("surfaces the lesson the sketch already carries", () => {
    // The teaching prompts were written into the .ino comments and were
    // invisible unless a student scrolled the source. Extracting rather than
    // duplicating means an instructor authors a lesson by editing the sketch.
    expect(interfaceSource).toContain("extractLesson(editor.value)");
    expect(interfaceSource).toContain("renderLesson()");
    expect(interfaceSource).toContain('revealLine(Number(step.dataset.line))');
    // Re-read every edit so line numbers stay right, re-rendered only on change
    // so a keystroke cannot drop focus from a step button mid-use.
    expect(interfaceSource).toContain("if (signature === lessonSignature) return;");
    // Sketches without a lesson hide the strip rather than showing an empty one.
    expect(indexMarkup).toMatch(/id="lesson-strip"[^>]*hidden/);
    // "What to do" sits above "what is happening"; the authoring column keeps
    // its height for the code and the insert chips.
    const inspector = indexMarkup.indexOf("<aside");
    const lesson = indexMarkup.indexOf('id="lesson-strip"');
    const command = indexMarkup.indexOf("command-section");
    expect(lesson).toBeGreaterThan(inspector);
    expect(lesson).toBeLessThan(command);
  });

  it("uses the arm silhouette as the mark, and ships it with no external asset", () => {
    // A blue square holding the letter M was the first thing anyone saw and read
    // as a placeholder. The app already draws an arm; that silhouette is the mark.
    expect(indexMarkup).toMatch(/class="brand-mark"[^>]*>\s*<svg/);
    expect(indexMarkup).not.toMatch(/class="brand-mark"[^>]*>M</);
    // The tab icon is the same glyph, inlined so the page stays offline-capable.
    expect(indexMarkup).toContain('<link rel="icon" href="data:image/svg+xml,');
    expect(indexMarkup).not.toMatch(/rel="icon"[^>]*href="(?:https?:)?\/\//);
  });

  it("keeps the workspace markup out of the application module", () => {
    // The previous contract string-matched markup inside main.ts, which made the
    // markup unmovable. Assert the inverse so it cannot drift back.
    expect(interfaceSource).not.toContain("app.innerHTML");
    expect(interfaceSource).not.toContain('<div class="app-shell">');
  });
});
