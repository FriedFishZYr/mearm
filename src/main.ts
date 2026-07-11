import "./styles.css";
import instructorSketch from "./samples/MeArm_Dance_Instructor.ino?raw";
import studentSketch from "./samples/MeArm_Dance_Student.ino?raw";
import { compilePreview, createProfile, defaultProfileValues, lineRange, profileToValues, type ProfileValues } from "./app/preview";
import { DEFAULT_PROFILE, validateProfile } from "./core/profile";
import type { Command, JointAngles, Point3, RobotProfile, Timeline } from "./core/types";
import { collectPath, sampleSegments } from "./viewer/playback";
import { MeArmScene } from "./viewer/scene";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Application root was not found.");

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand"><div class="brand-mark" aria-hidden="true">M</div><div><p>MeArm Robotics</p><h1>Classroom Motion Lab</h1></div></div>
      <div class="project-actions">
        <label class="sample-control">Example
          <select id="sample-select" aria-label="Example sketch">
            <option value="instructor">Instructor dance</option>
            <option value="student">Student starter</option>
            <option value="custom" disabled>Edited sketch</option>
          </select>
        </label>
        <button id="settings-open" class="top-button" type="button">Robot settings</button>
        <button id="preview" class="preview-button" type="button">Preview code</button>
      </div>
    </header>

    <main class="workspace">
      <section class="editor-panel" aria-labelledby="editor-title">
        <div class="panel-heading">
          <div><p class="eyebrow">Arduino sketch</p><h2 id="editor-title">Dance code</h2></div>
          <span id="editor-state" class="editor-state">Ready</span>
        </div>
        <div id="editor-message" class="editor-message success" role="status">Instructor dance is ready to preview.</div>
        <div class="editor-wrap">
          <div class="gutter" aria-hidden="true"><div id="line-numbers"></div></div>
          <textarea id="code-editor" aria-label="Arduino dance code" wrap="off" spellcheck="false"></textarea>
        </div>
        <div class="editor-footer"><span>Ctrl + Enter to preview</span><span id="code-count">0 lines</span></div>
      </section>

      <section class="stage" aria-label="Interactive 3D MeArm viewer">
        <div id="scene" class="scene"></div>
        <div class="scene-overlay scene-label"><span>3D kinematic preview</span><strong id="pose-name">HOME</strong></div>
        <div class="scene-overlay camera-help">Drag to orbit · Scroll to zoom</div>
        <div class="view-actions" aria-label="Viewer options">
          <button id="reset-camera" type="button">Reset view</button>
          <label><input id="toggle-path" type="checkbox" checked /> Path</label>
          <label><input id="toggle-grid" type="checkbox" checked /> Grid</label>
          <label><input id="toggle-axes" type="checkbox" /> Axes</label>
        </div>
      </section>

      <aside class="inspector" aria-label="Motion inspector">
        <div class="inspector-head"><div><p class="eyebrow">Now running</p><h2 id="dance-title">Instructor dance</h2></div><span id="status" class="status valid" role="status" aria-live="polite"><span aria-hidden="true"></span>Valid</span></div>
        <section class="readout" aria-labelledby="command-title">
          <p id="command-title" class="section-label">Current command</p>
          <code id="command">arm.moveToXYZ(0, 100, 50);</code>
          <button id="source-line" class="source-link" type="button">Line 1</button>
        </section>
        <section class="metrics" aria-label="Robot position and angles">
          <div class="metric-wide"><p class="section-label">Claw position</p><div class="coordinate-row">
            <span><small>X</small><strong id="x-value">0.0</strong><em>mm</em></span><span><small>Y</small><strong id="y-value">100.0</strong><em>mm</em></span><span><small>Z</small><strong id="z-value">50.0</strong><em>mm</em></span>
          </div></div>
          <div><p class="section-label">Base</p><strong id="base-angle">0.0°</strong></div><div><p class="section-label">Shoulder</p><strong id="shoulder-angle">0.0°</strong></div><div><p class="section-label">Elbow</p><strong id="elbow-angle">0.0°</strong></div>
        </section>
        <section class="transport" aria-label="Playback controls">
          <div class="transport-buttons">
            <button id="previous-command" class="square-button" type="button" aria-label="Previous command">Back</button>
            <button id="restart" class="square-button" type="button">Restart</button>
            <button id="play" class="primary-button" type="button" aria-pressed="true">Pause</button>
            <button id="next-command" class="square-button" type="button" aria-label="Next command">Next</button>
          </div>
          <div class="play-options">
            <label>Speed <select id="speed" aria-label="Playback speed"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select></label>
            <label><input id="repeat" type="checkbox" checked /> Repeat loop</label>
          </div>
          <input id="timeline" class="timeline" type="range" min="0" step="1" value="0" aria-label="Dance timeline" />
          <div class="time-row"><span id="current-time">0:00.0</span><span id="duration">0:00.0</span></div>
        </section>
        <p class="safety-note"><strong>Preview only.</strong> Confirm calibration, power, clearance, and each pose on the physical arm.</p>
      </aside>
    </main>
  </div>

  <dialog id="settings-dialog" class="settings-dialog" aria-labelledby="settings-title">
    <form id="settings-form" method="dialog">
      <div class="settings-head"><div><p class="eyebrow">Instructor controls</p><h2 id="settings-title">Robot settings</h2></div><button id="settings-close" class="close-button" type="button" aria-label="Close settings">Close</button></div>
      <p class="settings-intro">These values change only the preview. They do not calibrate the physical robot.</p>
      <div id="settings-error" class="settings-error" role="alert" hidden></div>
      <fieldset><legend>Arm geometry <small>millimeters</small></legend><div class="field-grid three">
        <label>L1 · upper arm<input id="setting-l1" type="number" step="0.1" required /></label><label>L2 · forearm<input id="setting-l2" type="number" step="0.1" required /></label><label>L3 · hand offset<input id="setting-l3" type="number" step="0.1" required /></label>
      </div></fieldset>
      <fieldset><legend>Home position <small>millimeters</small></legend><div class="field-grid three">
        <label>Home X<input id="setting-home-x" type="number" step="0.1" required /></label><label>Home Y<input id="setting-home-y" type="number" step="0.1" required /></label><label>Home Z<input id="setting-home-z" type="number" step="0.1" required /></label>
      </div></fieldset>
      <fieldset><legend>Servo limits <small>degrees</small></legend><div class="limit-grid">
        <span></span><strong>Minimum</strong><strong>Maximum</strong>
        <label for="setting-base-min">Base</label><input id="setting-base-min" aria-label="Base minimum angle" type="number" step="0.1" required /><input id="setting-base-max" aria-label="Base maximum angle" type="number" step="0.1" required />
        <label for="setting-shoulder-min">Shoulder</label><input id="setting-shoulder-min" aria-label="Shoulder minimum angle" type="number" step="0.1" required /><input id="setting-shoulder-max" aria-label="Shoulder maximum angle" type="number" step="0.1" required />
        <label for="setting-elbow-min">Elbow</label><input id="setting-elbow-min" aria-label="Elbow minimum angle" type="number" step="0.1" required /><input id="setting-elbow-max" aria-label="Elbow maximum angle" type="number" step="0.1" required />
      </div></fieldset>
      <div class="settings-actions"><button id="settings-reset" class="secondary-button" type="button">Reset defaults</button><button class="preview-button" type="submit" value="apply">Apply and preview</button></div>
    </form>
  </dialog>
`;

const get = <T extends HTMLElement>(id: string): T => {
  const element = document.querySelector<T>(`#${id}`);
  if (!element) throw new Error(`Missing interface element #${id}.`);
  return element;
};

const editor = get<HTMLTextAreaElement>("code-editor");
const sampleSelect = get<HTMLSelectElement>("sample-select");
const sceneContainer = get<HTMLElement>("scene");
const range = get<HTMLInputElement>("timeline");
const playButton = get<HTMLButtonElement>("play");
const repeatInput = get<HTMLInputElement>("repeat");
const settingsDialog = get<HTMLDialogElement>("settings-dialog");
const settingsForm = get<HTMLFormElement>("settings-form");

let activeProfile: RobotProfile = DEFAULT_PROFILE;
let activeTimeline: Timeline;
let viewer: MeArmScene;
let currentTime = 0;
let activeLine = 1;
let speed = 1;
let playing = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let previousTimestamp = performance.now();
let dirty = false;
let previewReady = false;
let lastStatus = "";

function loadSample(name: "instructor" | "student"): void {
  editor.value = name === "student" ? studentSketch : instructorSketch;
  sampleSelect.value = name;
  get("dance-title").textContent = name === "student" ? "Student starter" : "Instructor dance";
  dirty = false;
  updateGutter();
  compileCurrent();
}

function compileCurrent(profile = activeProfile): boolean {
  const result = compilePreview(editor.value, profile);
  if (!result.ok) {
    previewReady = false;
    playing = false;
    syncPlayButton();
    setPlaybackEnabled(false);
    showEditorMessage("error", result.message, result.line);
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
  viewer.setAxesVisible(get<HTMLInputElement>("toggle-axes").checked);
  viewer.setGridVisible(get<HTMLInputElement>("toggle-grid").checked);
  viewer.setPathVisible(get<HTMLInputElement>("toggle-path").checked);
  currentTime = 0;
  range.max = String(Math.max(1, activeTimeline.loopDurationMs));
  get("duration").textContent = formatTime(activeTimeline.loopDurationMs);
  dirty = false;
  get("editor-state").textContent = "Preview current";
  setPlaybackEnabled(true);
  sampleSelect.querySelector<HTMLOptionElement>('option[value="custom"]')!.disabled = false;

  const invalid = activeTimeline.diagnostics.find((item) => item.severity === "invalid");
  const caution = activeTimeline.diagnostics.find((item) => item.severity === "caution");
  if (invalid) showEditorMessage("error", invalid.message, invalid.location?.line);
  else if (caution) showEditorMessage("warning", caution.message, caution.location?.line);
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
  viewer?.render();
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
  const angle = (value: number) => `${(value * 180 / Math.PI).toFixed(1)}°`;
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

function showEditorMessage(kind: "success" | "warning" | "error", message: string, line?: number): void {
  const element = get("editor-message");
  element.className = `editor-message ${kind}`;
  element.textContent = line ? `Line ${line}: ${message}` : message;
}

function updateGutter(): void {
  const count = editor.value.split("\n").length;
  get("line-numbers").innerHTML = Array.from({ length: count }, (_, index) => `<span data-line="${index + 1}">${index + 1}</span>`).join("");
  get("code-count").textContent = `${count} line${count === 1 ? "" : "s"}`;
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
  const lineHeight = 20;
  editor.scrollTop = Math.max(0, (line - 4) * lineHeight);
  syncGutterScroll();
  setActiveLine(line, true);
}

function syncGutterScroll(): void { get("line-numbers").style.transform = `translateY(${-editor.scrollTop}px)`; }
function syncPlayButton(): void { playButton.textContent = playing ? "Pause" : "Play"; playButton.setAttribute("aria-pressed", String(playing)); }
function setPlaybackEnabled(enabled: boolean): void {
  for (const id of ["play", "restart", "previous-command", "next-command", "timeline"]) {
    (get(id) as HTMLButtonElement | HTMLInputElement).disabled = !enabled;
  }
}
function formatTime(milliseconds: number): string { const seconds = milliseconds / 1000; return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, "0")}`; }

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

const settingIds: Record<keyof ProfileValues, string> = {
  l1: "setting-l1", l2: "setting-l2", l3: "setting-l3", homeX: "setting-home-x", homeY: "setting-home-y", homeZ: "setting-home-z",
  baseMin: "setting-base-min", baseMax: "setting-base-max", shoulderMin: "setting-shoulder-min", shoulderMax: "setting-shoulder-max", elbowMin: "setting-elbow-min", elbowMax: "setting-elbow-max",
};
function writeSettings(values: ProfileValues): void { for (const key of Object.keys(settingIds) as (keyof ProfileValues)[]) get<HTMLInputElement>(settingIds[key]).value = String(values[key]); }
function readSettings(): ProfileValues { const result = {} as ProfileValues; for (const key of Object.keys(settingIds) as (keyof ProfileValues)[]) result[key] = Number(get<HTMLInputElement>(settingIds[key]).value); return result; }

editor.addEventListener("input", () => { dirty = true; get("editor-state").textContent = "Changes not previewed"; sampleSelect.value = "custom"; updateGutter(); });
editor.addEventListener("scroll", syncGutterScroll);
editor.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); compileCurrent(); } });
sampleSelect.addEventListener("change", () => { if (sampleSelect.value === "instructor" || sampleSelect.value === "student") loadSample(sampleSelect.value); });
get("preview").addEventListener("click", () => compileCurrent());
playButton.addEventListener("click", () => { if (dirty && !compileCurrent()) return; playing = !playing; syncPlayButton(); });
get("restart").addEventListener("click", () => { currentTime = 0; updateFrame(); });
get("previous-command").addEventListener("click", () => stepCommand(-1));
get("next-command").addEventListener("click", () => stepCommand(1));
get<HTMLSelectElement>("speed").addEventListener("change", (event) => { speed = Number((event.currentTarget as HTMLSelectElement).value); });
range.addEventListener("input", () => { currentTime = Number(range.value); playing = false; syncPlayButton(); updateFrame(); });
get("source-line").addEventListener("click", () => revealLine(activeLine));
get("reset-camera").addEventListener("click", () => viewer.resetCamera());
get<HTMLInputElement>("toggle-path").addEventListener("change", (event) => viewer.setPathVisible((event.currentTarget as HTMLInputElement).checked));
get<HTMLInputElement>("toggle-grid").addEventListener("change", (event) => viewer.setGridVisible((event.currentTarget as HTMLInputElement).checked));
get<HTMLInputElement>("toggle-axes").addEventListener("change", (event) => viewer.setAxesVisible((event.currentTarget as HTMLInputElement).checked));

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

loadSample("instructor");
syncPlayButton();
requestAnimationFrame(animationFrame);
