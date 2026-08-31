import "./styles.css";
import { highlightArduino } from "./app/highlight";
import { extractLesson } from "./app/lesson";
import { compilePreview, createProfile, defaultProfileValues, FREE_FORM_BOUNDS, lineRange, profileToValues, type ProfileValues } from "./app/preview";
import { DEFAULT_PROFILE, validateProfile } from "./core/profile";
import type { Command, JointAngles, Point3, RobotProfile, Timeline } from "./core/types";
import { collectPath, collectTravelPoints, sampleSegments } from "./viewer/playback";
import { MeArmScene, type CameraPreset } from "./viewer/scene";
import { EXAMPLE_GROUPS, isSampleMode, renderExampleGallery, samples, type SampleMode } from "./views/examples";
import { renderPresetCommands } from "./views/presets";

// The workspace markup is static in index.html. Only the copyable command
// chips are generated, because they derive from DEFAULT_PROFILE.approvedPoses.
renderPresetCommands();

const get = <T extends HTMLElement>(id: string): T => {
  const element = document.querySelector<T>(`#${id}`);
  if (!element) throw new Error(`Missing interface element #${id}.`);
  return element;
};

const editor = get<HTMLTextAreaElement>("code-editor");
const highlightOutput = get<HTMLElement>("code-highlight");
const exampleDialog = get<HTMLDialogElement>("example-dialog");
const sceneContainer = get<HTMLElement>("scene");
const range = get<HTMLInputElement>("timeline");
const playButton = get<HTMLButtonElement>("play");
const repeatInput = get<HTMLInputElement>("repeat");
const cameraViewLabel = get<HTMLElement>("camera-view");
const cameraPresetSelect = get<HTMLSelectElement>("camera-preset");
const settingsDialog = get<HTMLDialogElement>("settings-dialog");
const settingsForm = get<HTMLFormElement>("settings-form");

let activeProfile: RobotProfile = DEFAULT_PROFILE;
let activeTimeline: Timeline;
let viewer: MeArmScene;
let currentTime = 0;
let activeLine = 1;
let speed = 1;
let playing = false;
let previousTimestamp = performance.now();
let dirty = false;
let previewReady = false;
let lastStatus = "";
let copyFeedbackTimer: number | undefined;
let activeMode: SampleMode = "instructor";

/** Shared by the gutter, the highlight overlay, and every scroll calculation.
 *  Must equal the 20px line height declared in src/styles.css. */
const EDITOR_LINE_HEIGHT = 20;

function loadSample(name: SampleMode): void {
  activeMode = name;
  editor.value = samples[name].source;
  lastSelection = null;
  get("example-name").textContent = samples[name].title;
  get("dance-title").textContent = samples[name].title;
  get("freeform-constraints").hidden = name !== "freeform";
  dirty = false;
  updateGutter();
  compileCurrent();
}

function resetCode(): void {
  loadSample(activeMode);
}

function compileCurrent(profile = activeProfile): boolean {
  const result = compilePreview(editor.value, profile, activeMode === "freeform" ? FREE_FORM_BOUNDS : undefined);
  if (!result.ok) {
    previewReady = false;
    playing = false;
    syncPlayButton();
    setPlaybackEnabled(false);
    showEditorMessage("error", result.message, result.line, result.code);
    if (result.line) revealLine(result.line);
    setStatus("invalid", "Code error");
    return false;
  }

  activeProfile = profile;
  activeTimeline = result.timeline;
  previewReady = true;
  viewer?.dispose();
  viewer = new MeArmScene(sceneContainer, profile);
  viewer.setPath(collectPath(activeTimeline.loop));
  viewer.setCoordinateLabels(collectTravelPoints(activeTimeline.loop));
  viewer.setAxesVisible(get<HTMLInputElement>("toggle-axes").checked);
  viewer.setGridVisible(get<HTMLInputElement>("toggle-grid").checked);
  viewer.setPathVisible(get<HTMLInputElement>("toggle-path").checked);
  viewer.setTaskSpaceVisible(get<HTMLInputElement>("toggle-task-space").checked);
  currentTime = 0;
  range.max = String(Math.max(1, activeTimeline.loopDurationMs));
  renderCommandMarkers();
  renderTimelineSegments();
  get("duration").textContent = formatTime(activeTimeline.loopDurationMs);
  dirty = false;
  get("editor-state").textContent = "Preview current";
  setPlaybackEnabled(true);

  const invalid = activeTimeline.diagnostics.find((item) => item.severity === "invalid");
  const caution = activeTimeline.diagnostics.find((item) => item.severity === "caution");
  if (invalid) showEditorMessage("error", invalid.message, invalid.location?.line, invalid.code);
  else if (caution) showEditorMessage("warning", caution.message, caution.location?.line, caution.code);
  else showEditorMessage("success", `${activeTimeline.loop.length} commands are ready to preview.`);
  updateFrame();
  return true;
}

function updateFrame(): void {
  if (!previewReady || !activeTimeline || activeTimeline.loop.length === 0) return;
  const frame = sampleSegments(activeTimeline.loop, currentTime);
  viewer.setFrame(frame);
  updateReadout(frame.state.position, frame.state.angles);
  get("command").textContent = commandText(frame.segment.command);
  const line = frame.segment.command.location.line;
  get("source-line").textContent = `Line ${line} · Command ${frame.segmentIndex + 1} of ${activeTimeline.loop.length}`;
  get("current-time").textContent = formatTime(currentTime);
  range.value = String(Math.round(currentTime));
  setStatus(frame.status, frame.status === "valid" ? "Valid" : frame.status === "caution" ? "Caution" : "Invalid");
  setActiveLine(line);
}

function animationFrame(timestamp: number): void {
  const delta = Math.min(100, timestamp - previousTimestamp);
  previousTimestamp = timestamp;
  if (previewReady && playing && activeTimeline.loopDurationMs > 0) {
    const next = currentTime + delta * speed;
    if (next >= activeTimeline.loopDurationMs) {
      if (repeatInput.checked) currentTime = next % activeTimeline.loopDurationMs;
      else { currentTime = activeTimeline.loopDurationMs; playing = false; syncPlayButton(); }
    } else currentTime = next;
  }
  if (previewReady) updateFrame();
  if (viewer) {
    viewer.render();
    const cameraLabel = viewer.getCameraViewLabel();
    cameraViewLabel.textContent = cameraLabel;
    if (document.activeElement !== cameraPresetSelect) {
      const presetByLabel: Record<string, string> = {
        "Isometric view": "isometric", "Front view": "front", "Back view": "back",
        "Left view": "left", "Right view": "right", "Top view": "top",
      };
      cameraPresetSelect.value = presetByLabel[cameraLabel] ?? "custom";
    }
  }
  requestAnimationFrame(animationFrame);
}

function commandText(command: Command): string {
  switch (command.type) {
    case "move": return `arm.moveToXYZ(${command.target.x}, ${command.target.y}, ${command.target.z});`;
    case "snap": return `arm.snapToXYZ(${command.target.x}, ${command.target.y}, ${command.target.z});`;
    case "delay": return `delay(${command.milliseconds});`;
    case "openClaw": return "arm.openClaw();";
    case "closeClaw": return "arm.closeClaw();";
    case "begin": return `arm.begin(${command.pins.join(", ")});`;
  }
}

function updateReadout(point: Point3, angles: JointAngles): void {
  get("x-value").textContent = point.x.toFixed(1); get("y-value").textContent = point.y.toFixed(1); get("z-value").textContent = point.z.toFixed(1);
  const angle = (value: number) => (value * 180 / Math.PI).toFixed(1);
  get("base-angle").textContent = angle(angles.base); get("shoulder-angle").textContent = angle(angles.shoulder); get("elbow-angle").textContent = angle(angles.elbow);
  const pose = activeProfile.approvedPoses.find((item) => Math.hypot(item.x - point.x, item.y - point.y, item.z - point.z) < 0.7);
  get("pose-name").textContent = pose?.name ?? "IN MOTION";
}

function setStatus(kind: "valid" | "caution" | "invalid", label: string): void {
  const signature = `${kind}:${label}`;
  if (signature === lastStatus) return;
  lastStatus = signature;
  const element = get("status");
  element.className = `status ${kind}`;
  element.innerHTML = `<span aria-hidden="true"></span>${label}`;
}

/**
 * Beginner-facing guidance per diagnostic code.
 *
 * The parser's own messages state what is wrong; these say what to do about it.
 * For a first programming lesson that difference matters: "delay() requires a
 * non-negative integer literal" describes a rule, while the hint shows the
 * shape of a line that works.
 */
const ERROR_HINTS: Readonly<Record<string, string>> = {
  MISSING_ARM: "Near the top of the sketch, declare the robot once: MeArm arm;",
  MISSING_SETUP: "Every Arduino sketch needs a setup() function. It runs once when the board starts.",
  MISSING_LOOP: "Every Arduino sketch needs a loop() function. It runs over and over after setup().",
  MISSING_BEGIN: "Inside setup(), start the arm with the four pin numbers: arm.begin(11, 10, 9, 6);",
  MULTIPLE_ARMS: "This preview animates one arm. Keep a single MeArm declaration.",
  DUPLICATE_SETUP: "There can only be one setup(). Merge the two into a single function.",
  DUPLICATE_LOOP: "There can only be one loop(). Merge the two into a single function.",
  UNCLOSED_FUNCTION: "A closing brace } is missing. Check that every { has a matching }.",
  INVALID_DELAY: "delay() takes a whole number of milliseconds, like delay(500);",
  INVALID_PIN: "Pin numbers must be whole numbers, like int basePin = 11;",
  UNKNOWN_PIN: "Use a pin variable you declared above setup(), or the number itself.",
  UNKNOWN_RECEIVER: "Commands start with the arm you declared, like arm.moveToXYZ(0, 100, 50);",
  UNSUPPORTED_METHOD: "This preview understands moveToXYZ, snapToXYZ, openClaw, closeClaw, begin, and delay.",
  UNSUPPORTED_FUNCTION: "Custom functions are not supported yet. Put the commands directly inside loop().",
  UNSUPPORTED_STATEMENT: "Only movement, claw, and delay commands can be previewed. Variables, loops, and if statements are not supported yet.",
  INVALID_NUMBER: "Coordinates must be plain numbers, like arm.moveToXYZ(0, 100, 50);",
  EMPTY_LOOP: "Add at least one command inside loop() — try a pose from the Preset commands strip.",
  COORDINATE_OUT_OF_BOUNDS: "Free form mode limits how far the arm may reach. Pick a coordinate inside the limits shown on the viewport.",
  INVALID_PROFILE: "Check the values in Simulation profile; one of them is not usable.",
};

/**
 * Renders a diagnostic beside the editor.
 *
 * The concise text is what the live region announces. The offending source line
 * is repeated visually and marked aria-hidden, because the editor has already
 * selected that line and reading it twice helps nobody.
 */
function showEditorMessage(kind: "success" | "warning" | "error", message: string, line?: number, code?: string): void {
  const text = line ? `Line ${line}: ${message}` : message;
  const element = get("editor-message");
  element.className = `editor-message ${kind}`;

  const parts = [`<p class="editor-message-text">${escapeHtml(text)}</p>`];
  const sourceLine = line ? editor.value.split("\n")[line - 1] : undefined;
  if (sourceLine?.trim()) {
    parts.push(`<pre class="editor-message-source" aria-hidden="true">${escapeHtml(sourceLine.trim())}</pre>`);
  }
  const hint = code ? ERROR_HINTS[code] : undefined;
  if (hint) parts.push(`<p class="editor-message-hint" aria-hidden="true">${escapeHtml(hint)}</p>`);
  element.innerHTML = parts.join("");

  const summary = get("statusbar-message");
  summary.className = `statusbar-item statusbar-message ${kind}`;
  summary.textContent = text;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character] ?? character);
}

/**
 * Mirrors the sketch's own lesson into the chrome.
 *
 * Re-read on every edit so the step line numbers stay correct as the student
 * types, but only re-rendered when the lesson actually changes — otherwise a
 * keystroke would rebuild the buttons and drop focus from one mid-use.
 */
let lessonSignature = "";
function renderLesson(): void {
  const lesson = extractLesson(editor.value);
  const strip = get("lesson-strip");
  strip.hidden = lesson === null;
  if (!lesson) { lessonSignature = ""; return; }

  const signature = JSON.stringify(lesson);
  if (signature === lessonSignature) return;
  lessonSignature = signature;

  get("lesson-goal").textContent = lesson.goal ?? "";
  get("lesson-steps").innerHTML = lesson.steps.map((step) => `
    <button class="lesson-step" type="button" data-line="${step.line}" title="Go to line ${step.line}">
      <span class="lesson-step-number">${step.number}</span>
      <span class="lesson-step-body">
        <span class="lesson-step-title">${escapeHtml(step.title)}</span>
        <span class="lesson-step-detail">${escapeHtml(step.detail)}</span>
      </span>
    </button>`).join("");
}

function updateGutter(): void {
  const count = editor.value.split("\n").length;
  get("line-numbers").innerHTML = Array.from({ length: count }, (_, index) => `<div class="line-number" data-line="${index + 1}"><span aria-hidden="true">${index + 1}</span></div>`).join("");
  get("code-count").textContent = `${count} line${count === 1 ? "" : "s"}`;
  highlightOutput.innerHTML = highlightArduino(editor.value);
  renderLesson();
  syncEditorScroll();
  setActiveLine(activeLine, true);
}

function setActiveLine(line: number, force = false): void {
  if (line === activeLine && !force) return;
  get("line-numbers").querySelector(".active")?.classList.remove("active");
  activeLine = line;
  get("line-numbers").querySelector(`[data-line="${line}"]`)?.classList.add("active");
}

function revealLine(line: number): void {
  const selected = lineRange(editor.value, line);
  editor.focus();
  editor.setSelectionRange(selected.start, selected.end);
  editor.scrollTop = Math.max(0, (line - 4) * EDITOR_LINE_HEIGHT);
  syncEditorScroll();
  setActiveLine(line, true);
}

function syncEditorScroll(): void {
  get("line-numbers").style.transform = `translateY(${-editor.scrollTop}px)`;
  highlightOutput.scrollTop = editor.scrollTop;
  highlightOutput.scrollLeft = editor.scrollLeft;
}
function syncPlayButton(): void {
  playButton.classList.toggle("playing", playing);
  playButton.setAttribute("aria-pressed", String(playing));
  playButton.setAttribute("aria-label", playing ? "Pause" : "Play");
  playButton.title = playing ? "Pause (Space)" : "Play (Space)";
}
function setPlaybackEnabled(enabled: boolean): void {
  for (const id of ["play", "restart", "previous-command", "next-command", "timeline"]) {
    (get(id) as HTMLButtonElement | HTMLInputElement).disabled = !enabled;
  }
}
function formatTime(milliseconds: number): string { const seconds = milliseconds / 1000; return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, "0")}`; }

/**
 * Draws one proportional block per command, colored by what the robot is doing.
 *
 * The product specification asks the interface to distinguish movement time
 * from explicit delay() time. A slider cannot: it renders a program as a
 * featureless span. Blocks make the shape of the program visible without a word
 * of explanation — in the student starter sketch six of its 8.65 seconds are
 * delay(), which no student reads out of a scrubber.
 *
 * Indigo is the motion-path color from the 3D scene, so indigo consistently
 * means "the robot is doing something", with a darker step for the claw.
 * Waiting is neutral: it is the absence of motion and needs no hue of its own.
 */
function segmentKind(type: Command["type"]): "move" | "claw" | "wait" {
  switch (type) {
    case "move":
    case "snap":
    case "begin":
      return "move";
    case "openClaw":
    case "closeClaw":
      return "claw";
    case "delay":
      return "wait";
  }
}

function renderTimelineSegments(): void {
  const container = get("timeline-segments");
  if (activeTimeline.loopDurationMs <= 0) { container.innerHTML = ""; return; }
  container.innerHTML = activeTimeline.loop
    .map((segment) => {
      const durationMs = segment.endMs - segment.startMs;
      return `<span class="timeline-segment is-${segmentKind(segment.command.type)}" style="flex-grow:${durationMs}"></span>`;
    })
    .join("");
}

function renderCommandMarkers(): void {
  const commandIndicesByLine = new Map<number, number[]>();
  activeTimeline.loop.forEach((segment, index) => {
    const line = segment.command.location.line;
    const indices = commandIndicesByLine.get(line) ?? [];
    indices.push(index);
    commandIndicesByLine.set(line, indices);
  });

  for (const [line, indices] of commandIndicesByLine) {
    const lineNumber = get("line-numbers").querySelector<HTMLElement>(`[data-line="${line}"]`);
    const firstIndex = indices[0];
    if (!lineNumber || firstIndex === undefined) continue;
    const command = activeTimeline.loop[firstIndex]!.command;
    const button = document.createElement("button");
    button.className = "command-marker";
    button.type = "button";
    button.dataset.commandIndex = String(firstIndex);
    button.setAttribute("aria-label", indices.length === 1
      ? `Go to command ${firstIndex + 1}, line ${line}: ${commandText(command)}`
      : `Go to the first of ${indices.length} commands on line ${line}: ${commandText(command)}`);
    button.title = indices.length === 1 ? `Go to command ${firstIndex + 1}` : `Go to first command on line ${line}`;
    lineNumber.prepend(button);
  }
}

function visitCommand(index: number): void {
  const segment = activeTimeline.loop[index];
  if (!segment) return;
  currentTime = segment.startMs;
  playing = false;
  syncPlayButton();
  updateFrame();
}

/**
 * The preset chips are the highest-frequency control in the workspace —
 * classroom use shows students reaching for them constantly — so a click puts
 * the command straight into the sketch at the caret instead of onto the
 * clipboard. That removes the click / click / position / paste round trip that
 * was repeated dozens of times a lesson.
 *
 * It does not remove the decision that matters. The student still chooses where
 * the command goes by placing the caret, which is the actual lesson about
 * command order; only the clipboard hop disappears. Alt-click still copies, for
 * pasting somewhere else.
 */
let lastSelection: { start: number; end: number } | null = null;

function rememberSelection(): void {
  lastSelection = { start: editor.selectionStart, end: editor.selectionEnd };
}

/**
 * Where a command lands when the student has not placed a caret yet — the last
 * line inside `loop()`, which is the final block in every supported sketch.
 * Falls back to the end of the document if that shape is not found.
 */
function defaultInsertPosition(): number {
  const match = /\n[^\S\n]*\}[^\S\n]*\s*$/.exec(editor.value);
  return match ? match.index : editor.value.length;
}

function flashPreset(button: HTMLButtonElement, message: string): void {
  window.clearTimeout(copyFeedbackTimer);
  document.querySelector<HTMLButtonElement>(".copy-command.used")?.classList.remove("used");
  button.classList.add("used");
  get("preset-copy-status").textContent = message;
  copyFeedbackTimer = window.setTimeout(() => {
    button.classList.remove("used");
    get("preset-copy-status").textContent = "Click to insert";
  }, 1800);
}

function insertCommand(command: string, presetName: string, button: HTMLButtonElement): void {
  const target = document.activeElement === editor
    ? { start: editor.selectionStart, end: editor.selectionEnd }
    : lastSelection ?? { start: defaultInsertPosition(), end: defaultInsertPosition() };

  // Keep one statement per line: if the caret sits after code, start a new line
  // and match the indentation of the line the student is on.
  const lineStart = editor.value.lastIndexOf("\n", target.start - 1) + 1;
  const indent = /^[ \t]*/.exec(editor.value.slice(lineStart))?.[0] ?? "";
  const precedingText = editor.value.slice(lineStart, target.start);
  const insertion = precedingText.trim() ? `\n${indent}${command}` : command;

  editor.focus();
  editor.setRangeText(insertion, target.start, target.end, "end");
  rememberSelection();
  editor.dispatchEvent(new Event("input", { bubbles: true }));

  // Keep the insertion point on screen without stealing the caret, which
  // revealLine would do by selecting the whole line.
  const line = editor.value.slice(0, editor.selectionStart).split("\n").length;
  const visibleLines = editor.clientHeight / EDITOR_LINE_HEIGHT;
  const firstVisible = editor.scrollTop / EDITOR_LINE_HEIGHT;
  if (line - 1 < firstVisible || line > firstVisible + visibleLines - 1) {
    editor.scrollTop = Math.max(0, (line - Math.floor(visibleLines / 2)) * EDITOR_LINE_HEIGHT);
  }
  syncEditorScroll();
  setActiveLine(line, true);
  flashPreset(button, `${presetName} inserted`);
}

async function copyPresetCommand(command: string, presetName: string, button: HTMLButtonElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(command);
  } catch {
    const fallback = document.createElement("textarea");
    fallback.value = command;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.append(fallback);
    fallback.select();
    const copied = document.execCommand("copy");
    fallback.remove();
    if (!copied) {
      get("preset-copy-status").textContent = "Copy unavailable";
      return;
    }
  }
  flashPreset(button, `${presetName} copied`);
}

function stepCommand(direction: -1 | 1): void {
  const frame = sampleSegments(activeTimeline.loop, currentTime);
  let index = frame.segmentIndex + direction;
  if (direction < 0 && currentTime > frame.segment.startMs + 5) index = frame.segmentIndex;
  if (repeatInput.checked) index = (index + activeTimeline.loop.length) % activeTimeline.loop.length;
  else index = Math.max(0, Math.min(activeTimeline.loop.length - 1, index));
  currentTime = activeTimeline.loop[index]!.startMs;
  playing = false;
  syncPlayButton();
  updateFrame();
}

function setupPanelResizer(handleId: "resize-editor" | "resize-inspector"): void {
  const handle = get(handleId);
  const workspace = document.querySelector<HTMLElement>(".workspace");
  const panel = document.querySelector<HTMLElement>(handleId === "resize-editor" ? ".editor-panel" : ".inspector");
  if (!workspace || !panel) return;
  const property = handleId === "resize-editor" ? "--editor-col" : "--inspector-col";
  const minWidth = 260;
  const maxWidth = handleId === "resize-editor" ? 540 : 460;
  const applyWidth = (width: number): void => {
    workspace.style.setProperty(property, `${Math.round(Math.min(maxWidth, Math.max(minWidth, width)))}px`);
  };

  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    handle.classList.add("resizing");
    const onMove = (moveEvent: PointerEvent): void => {
      const bounds = workspace.getBoundingClientRect();
      applyWidth(handleId === "resize-editor" ? moveEvent.clientX - bounds.left : bounds.right - moveEvent.clientX);
    };
    const onStop = (): void => {
      handle.classList.remove("resizing");
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onStop);
      handle.removeEventListener("pointercancel", onStop);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onStop);
    handle.addEventListener("pointercancel", onStop);
  });

  handle.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const grow = (event.key === "ArrowRight") === (handleId === "resize-editor") ? 1 : -1;
    applyWidth(panel.getBoundingClientRect().width + grow * 16);
  });
}

const settingIds: Record<keyof ProfileValues, string> = {
  l1: "setting-l1", l2: "setting-l2", l3: "setting-l3", homeX: "setting-home-x", homeY: "setting-home-y", homeZ: "setting-home-z",
  baseMin: "setting-base-min", baseMax: "setting-base-max", shoulderMin: "setting-shoulder-min", shoulderMax: "setting-shoulder-max", elbowMin: "setting-elbow-min", elbowMax: "setting-elbow-max",
};
function writeSettings(values: ProfileValues): void { for (const key of Object.keys(settingIds) as (keyof ProfileValues)[]) get<HTMLInputElement>(settingIds[key]).value = String(values[key]); }
function readSettings(): ProfileValues { const result = {} as ProfileValues; for (const key of Object.keys(settingIds) as (keyof ProfileValues)[]) result[key] = Number(get<HTMLInputElement>(settingIds[key]).value); return result; }

editor.addEventListener("input", () => { dirty = true; get("editor-state").textContent = "Changes not previewed"; get("example-name").textContent = "Edited sketch"; updateGutter(); });
editor.addEventListener("scroll", syncEditorScroll);
for (const eventName of ["keyup", "mouseup", "blur", "select"]) {
  editor.addEventListener(eventName, rememberSelection);
}
editor.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); compileCurrent(); } });
/**
 * Measured on first open rather than written down, so a card can never claim a
 * command count or duration the sketch no longer has.
 */
const exampleStats = new Map<SampleMode, string>();
function measureExamples(): void {
  if (exampleStats.size > 0) return;
  for (const mode of EXAMPLE_GROUPS.flatMap((group) => group.modes)) {
    const result = compilePreview(
      samples[mode].source,
      DEFAULT_PROFILE,
      mode === "freeform" ? FREE_FORM_BOUNDS : undefined,
    );
    if (!result.ok) continue;
    const commands = result.timeline.loop.length;
    exampleStats.set(mode, `${commands} command${commands === 1 ? "" : "s"} · ${formatTime(result.timeline.loopDurationMs)} loop`);
  }
}

get("example-open").addEventListener("click", () => {
  measureExamples();
  renderExampleGallery(get("example-groups"), activeMode, exampleStats);
  exampleDialog.showModal();
});
get("example-close").addEventListener("click", () => exampleDialog.close());
get("example-groups").addEventListener("click", (event) => {
  const card = (event.target as HTMLElement).closest<HTMLButtonElement>(".example-card");
  const mode = card?.dataset.mode;
  if (!mode || !isSampleMode(mode)) return;
  exampleDialog.close();
  loadSample(mode);
});
get("preview").addEventListener("click", () => compileCurrent());
get("reset-code").addEventListener("click", resetCode);
playButton.addEventListener("click", () => { if (dirty && !compileCurrent()) return; playing = !playing; syncPlayButton(); });
get("restart").addEventListener("click", () => { currentTime = 0; updateFrame(); });
get("previous-command").addEventListener("click", () => stepCommand(-1));
get("next-command").addEventListener("click", () => stepCommand(1));
get<HTMLSelectElement>("speed").addEventListener("change", (event) => { speed = Number((event.currentTarget as HTMLSelectElement).value); });
range.addEventListener("input", () => { currentTime = Number(range.value); playing = false; syncPlayButton(); updateFrame(); });
get("line-numbers").addEventListener("click", (event) => {
  const marker = (event.target as HTMLElement).closest<HTMLButtonElement>(".command-marker");
  if (!marker) return;
  visitCommand(Number(marker.dataset.commandIndex));
});
get("source-line").addEventListener("click", () => revealLine(activeLine));
get("lesson-steps").addEventListener("click", (event) => {
  const step = (event.target as HTMLElement).closest<HTMLButtonElement>(".lesson-step");
  if (step?.dataset.line) revealLine(Number(step.dataset.line));
});
get("fit-camera").addEventListener("click", () => viewer.fitToView());
get("reset-camera").addEventListener("click", () => viewer.resetCamera());
cameraPresetSelect.addEventListener("change", () => {
  if (cameraPresetSelect.value !== "custom") viewer.setCameraPreset(cameraPresetSelect.value as CameraPreset);
});
get<HTMLInputElement>("toggle-path").addEventListener("change", (event) => viewer.setPathVisible((event.currentTarget as HTMLInputElement).checked));
get<HTMLInputElement>("toggle-task-space").addEventListener("change", (event) => viewer.setTaskSpaceVisible((event.currentTarget as HTMLInputElement).checked));
get<HTMLInputElement>("toggle-grid").addEventListener("change", (event) => viewer.setGridVisible((event.currentTarget as HTMLInputElement).checked));
get<HTMLInputElement>("toggle-axes").addEventListener("change", (event) => viewer.setAxesVisible((event.currentTarget as HTMLInputElement).checked));
for (const button of document.querySelectorAll<HTMLButtonElement>(".copy-command")) {
  button.addEventListener("click", (event) => {
    const command = button.dataset.command;
    const presetName = button.dataset.presetName;
    if (!command || !presetName) return;
    if (event.altKey) void copyPresetCommand(command, presetName, button);
    else insertCommand(command, presetName, button);
  });
}

get("settings-open").addEventListener("click", () => { writeSettings(profileToValues(activeProfile)); get("settings-error").hidden = true; settingsDialog.showModal(); });
get("settings-close").addEventListener("click", () => settingsDialog.close());
get("settings-reset").addEventListener("click", () => { writeSettings(defaultProfileValues()); get("settings-error").hidden = true; });
settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const profile = createProfile(readSettings());
  const errors = validateProfile(profile);
  if (errors.length) { const output = get("settings-error"); output.textContent = errors.join(" "); output.hidden = false; return; }
  settingsDialog.close();
  compileCurrent(profile);
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && document.activeElement !== editor && !(document.activeElement instanceof HTMLInputElement) && !(document.activeElement instanceof HTMLSelectElement)) {
    event.preventDefault(); playing = !playing; syncPlayButton();
  }
});

setupPanelResizer("resize-editor");
setupPanelResizer("resize-inspector");

loadSample("instructor");
syncPlayButton();
requestAnimationFrame(animationFrame);
