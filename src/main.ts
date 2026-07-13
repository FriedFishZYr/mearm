import "./styles.css";
import freeFormSketch from "./samples/MeArm_Free_Form.ino?raw";
import instructorSketch from "./samples/MeArm_Dance_Instructor.ino?raw";
import studentSketch from "./samples/MeArm_Dance_Student.ino?raw";
import { highlightArduino } from "./app/highlight";
import { compilePreview, createProfile, defaultProfileValues, FREE_FORM_BOUNDS, lineRange, profileToValues, type ProfileValues } from "./app/preview";
import { DEFAULT_PROFILE, validateProfile } from "./core/profile";
import type { Command, JointAngles, Point3, RobotProfile, Timeline } from "./core/types";
import { collectPath, collectTravelPoints, sampleSegments } from "./viewer/playback";
import { MeArmScene, type CameraPreset } from "./viewer/scene";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Application root was not found.");

const presetCommand = (pose: Point3): string => `arm.moveToXYZ(${pose.x}, ${pose.y}, ${pose.z});`;
const presetCommandButtons = DEFAULT_PROFILE.approvedPoses.map((pose) => {
  const command = presetCommand(pose);
  return `<button class="copy-command preset-command" type="button" data-command="${command}" data-preset-name="${pose.name}">
    <span class="preset-name">${pose.name}</span>
    <code>${command}</code>
  </button>`;
}).join("");
const delayCommandButtons = [250, 500, 1000, 2000].map((milliseconds) => {
  const command = `delay(${milliseconds});`;
  return `<button class="copy-command delay-command" type="button" data-command="${command}" data-preset-name="${milliseconds} ms delay" aria-label="Copy ${command}" title="Copy ${command}">
    <strong>${milliseconds}</strong><small>ms</small>
  </button>`;
}).join("");
const clawCommandButtons = [
  { name: "Open claw", command: "arm.openClaw();" },
  { name: "Close claw", command: "arm.closeClaw();" },
].map(({ name, command }) => `<button class="copy-command claw-command" type="button" data-command="${command}" data-preset-name="${name}" aria-label="Copy ${command}" title="Copy ${command}"><code>${command}</code></button>`).join("");

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand"><div class="brand-mark" aria-hidden="true">M</div><div><p>MeArm Robotics</p><h1>Classroom Motion Lab</h1></div></div>
      <div class="project-actions" role="group" aria-label="Project controls">
        <label class="sample-control">Example
          <select id="sample-select" aria-label="Example sketch">
            <option value="instructor">Instructor dance</option>
            <option value="student">Student starter</option>
            <option value="freeform">Free form</option>
            <option value="custom" disabled>Edited sketch</option>
          </select>
        </label>
        <button id="settings-open" class="top-button secondary-button" type="button">Robot settings</button>
        <button id="preview" class="preview-button" type="button">Preview code</button>
      </div>
    </header>

    <main class="workspace">
      <section class="editor-panel" aria-labelledby="editor-title">
        <div class="panel-heading">
          <div><p class="eyebrow">Arduino sketch</p><h2 id="editor-title">Dance code</h2></div>
          <div class="editor-heading-actions">
            <span id="editor-state" class="editor-state">Ready</span>
            <button id="reset-code" class="reset-code-button" type="button">Reset code</button>
          </div>
        </div>
        <div id="editor-message" class="editor-message success" role="status">Instructor dance is ready to preview.</div>
        <div class="editor-wrap">
          <div class="gutter"><div id="line-numbers" role="group" aria-label="Code command markers"></div></div>
          <div class="editor-surface">
            <pre id="code-highlight" class="code-highlight" aria-hidden="true"></pre>
            <textarea id="code-editor" aria-label="Arduino dance code" wrap="off" spellcheck="false"></textarea>
          </div>
        </div>
        <div class="editor-footer"><span>Ctrl + Enter to preview</span><span id="code-count">0 lines</span></div>
      </section>

      <section class="stage" aria-label="Interactive 3D MeArm viewer">
        <div id="scene" class="scene"></div>
        <div id="freeform-constraints" class="freeform-constraints" aria-label="Free form coordinate limits" hidden>
          <strong>Free-form limits</strong>
          <span><b class="axis-x">X</b><span>−100 to +100 <small>mm</small></span></span>
          <span><b class="axis-y">Y</b><span>100 to 200 <small>mm</small></span></span>
          <span><b class="axis-z">Z</b><span>0 to 150 <small>mm</small></span></span>
        </div>
        <div class="viewport-toolbar" role="toolbar" aria-label="3D viewport tools">
          <div class="viewport-tool-group">
            <button id="fit-camera" class="viewport-tool" type="button" aria-label="Fit robot to view" title="Fit robot and path to view">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2H2v4M10 2h4v4M14 10v4h-4M6 14H2v-4" /></svg><span>Fit</span>
            </button>
            <button id="reset-camera" class="viewport-tool" type="button" aria-label="Reset view" title="Reset camera to the default view">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 6A5.2 5.2 0 1 1 3 10.3M3.2 6V2.7M3.2 6h3.3" /></svg><span>Reset</span>
            </button>
            <label class="camera-preset-control" title="Choose a camera preset">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 2 5 2.7v6.6L8 14l-5-2.7V4.7L8 2Zm0 0v5.8m5-3.1L8 7.8 3 4.7m5 3.1V14" /></svg>
              <select id="camera-preset" aria-label="Camera preset">
                <option value="isometric" selected>Isometric</option>
                <option value="front">Front</option>
                <option value="back">Back</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="top">Top</option>
                <option value="custom" disabled>Custom</option>
              </select>
            </label>
          </div>
          <span class="viewport-toolbar-divider" aria-hidden="true"></span>
          <div class="viewport-tool-group viewport-visibility-tools">
            <label class="viewport-toggle" title="Show or hide the motion path"><input id="toggle-path" type="checkbox" checked /><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 12.5c2.5-5 4.5-1.2 6.3-5.2 1-2.2 2.4-2.8 4.7-3.8" /><circle cx="2.5" cy="12.5" r="1" /><circle cx="13.5" cy="3.5" r="1" /></svg><span>Path</span></label>
            <label class="viewport-toggle" title="Show or hide the floor grid"><input id="toggle-grid" type="checkbox" checked /><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 2.5h11v11h-11zM2.5 8h11M8 2.5v11" /></svg><span>Grid</span></label>
            <label class="viewport-toggle" title="Show or hide the scene axes"><input id="toggle-axes" type="checkbox" /><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12V4m0 8h8M4 12l5-5" /></svg><span>Axes</span></label>
          </div>
        </div>
        <div class="viewport-statusbar">
          <div class="viewport-camera-state"><strong id="camera-view">Isometric view</strong><span>Robot pose <span id="pose-name">HOME</span></span></div>
          <div class="viewport-guidance">Drag to orbit · Scroll to zoom</div>
          <div class="axis-key" aria-label="Axis colors: X red, Y green, Z blue" title="Axis colors: X red, Y green, Z blue"><span class="axis-x">X</span><span class="axis-y">Y</span><span class="axis-z">Z</span></div>
        </div>
      </section>

      <aside class="inspector" aria-label="Motion inspector">
        <header class="inspector-head"><div><p class="eyebrow">Now running</p><h2 id="dance-title">Instructor dance</h2></div><span id="status" class="status valid" role="status" aria-live="polite"><span aria-hidden="true"></span>Valid</span></header>
        <section class="inspector-section command-section readout" aria-labelledby="command-title">
          <div class="section-heading-row">
            <h3 id="command-title" class="section-label">Current command</h3>
            <button id="source-line" class="source-link" type="button">Line 1</button>
          </div>
          <code id="command">arm.moveToXYZ(0, 100, 50);</code>
        </section>
        <section class="inspector-section position-section" aria-labelledby="position-title">
          <h3 id="position-title" class="section-label">Claw position</h3>
          <dl class="engineering-values" aria-label="Claw coordinates">
            <div><dt class="axis-x">X</dt><dd><strong id="x-value">0.0</strong><span class="value-unit">mm</span></dd></div>
            <div><dt class="axis-y">Y</dt><dd><strong id="y-value">100.0</strong><span class="value-unit">mm</span></dd></div>
            <div><dt class="axis-z">Z</dt><dd><strong id="z-value">50.0</strong><span class="value-unit">mm</span></dd></div>
          </dl>
        </section>
        <section class="inspector-section joints-section" aria-labelledby="joints-title">
          <h3 id="joints-title" class="section-label">Joint angles</h3>
          <dl class="engineering-values" aria-label="Joint angles">
            <div><dt>Base</dt><dd><strong id="base-angle">0.0</strong><span class="value-unit">°</span></dd></div>
            <div><dt>Shoulder</dt><dd><strong id="shoulder-angle">0.0</strong><span class="value-unit">°</span></dd></div>
            <div><dt>Elbow</dt><dd><strong id="elbow-angle">0.0</strong><span class="value-unit">°</span></dd></div>
          </dl>
        </section>
        <section class="inspector-section transport playback-section" aria-labelledby="playback-title">
          <h3 id="playback-title" class="section-label">Playback controls</h3>
          <div class="transport-buttons">
            <button id="previous-command" class="square-button" type="button" aria-label="Previous command">Back</button>
            <button id="restart" class="square-button" type="button">Restart</button>
            <button id="play" class="primary-button" type="button" aria-pressed="false">Play</button>
            <button id="next-command" class="square-button" type="button" aria-label="Next command">Next</button>
          </div>
        </section>
        <section class="inspector-section options-section" aria-labelledby="options-title">
          <h3 id="options-title" class="section-label">Playback settings</h3>
          <div class="play-options">
            <label>Speed <select id="speed" aria-label="Playback speed"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select></label>
            <label><input id="repeat" type="checkbox" /> Repeat loop</label>
          </div>
        </section>
        <section class="inspector-section timeline-section" aria-labelledby="timeline-title">
          <h3 id="timeline-title" class="section-label">Execution timeline</h3>
          <input id="timeline" class="timeline" type="range" min="0" step="1" value="0" aria-label="Dance timeline" />
          <div class="time-row">
            <span><small>Elapsed</small><strong id="current-time">0:00.0</strong></span>
            <span><small>Total</small><strong id="duration">0:00.0</strong></span>
          </div>
        </section>
        <section class="inspector-section presets-section" aria-labelledby="presets-title">
          <div class="section-heading-row">
            <h3 id="presets-title" class="section-label">Preset commands</h3>
            <span id="preset-copy-status" class="preset-copy-status" role="status" aria-live="polite">Click to copy</span>
          </div>
          <div class="preset-list" aria-label="Approved pose commands">
            ${presetCommandButtons}
          </div>
          <div class="delay-command-group">
            <span class="delay-command-label">Delay</span>
            <div class="delay-command-row" aria-label="Delay commands">
              ${delayCommandButtons}
            </div>
          </div>
          <div class="claw-command-group">
            <span class="claw-command-label">Claw</span>
            <div class="claw-command-row" aria-label="Claw commands">
              ${clawCommandButtons}
            </div>
          </div>
        </section>
        <section class="inspector-section safety-section" aria-labelledby="safety-title">
          <h3 id="safety-title" class="section-label">Physical-robot safety</h3>
          <p class="safety-note"><strong>Preview only.</strong> Confirm calibration, power, clearance, and each pose on the physical arm.</p>
        </section>
      </aside>
    </main>
  </div>

  <dialog id="settings-dialog" class="settings-dialog" aria-labelledby="settings-title">
    <form id="settings-form" method="dialog">
      <div class="settings-head"><div><p class="eyebrow">Instructor controls</p><h2 id="settings-title">Robot settings</h2></div><button id="settings-close" class="close-button secondary-button" type="button" aria-label="Close settings">Close</button></div>
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
const highlightOutput = get<HTMLElement>("code-highlight");
const sampleSelect = get<HTMLSelectElement>("sample-select");
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
let activeMode: "instructor" | "student" | "freeform" = "instructor";

function loadSample(name: "instructor" | "student" | "freeform"): void {
  activeMode = name;
  editor.value = name === "student" ? studentSketch : name === "freeform" ? freeFormSketch : instructorSketch;
  sampleSelect.value = name;
  get("dance-title").textContent = name === "student" ? "Student starter" : name === "freeform" ? "Free form" : "Instructor dance";
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
  viewer.setCoordinateLabels(collectTravelPoints(activeTimeline.loop));
  viewer.setAxesVisible(get<HTMLInputElement>("toggle-axes").checked);
  viewer.setGridVisible(get<HTMLInputElement>("toggle-grid").checked);
  viewer.setPathVisible(get<HTMLInputElement>("toggle-path").checked);
  currentTime = 0;
  range.max = String(Math.max(1, activeTimeline.loopDurationMs));
  renderCommandMarkers();
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

function showEditorMessage(kind: "success" | "warning" | "error", message: string, line?: number): void {
  const element = get("editor-message");
  element.className = `editor-message ${kind}`;
  element.textContent = line ? `Line ${line}: ${message}` : message;
}

function updateGutter(): void {
  const count = editor.value.split("\n").length;
  get("line-numbers").innerHTML = Array.from({ length: count }, (_, index) => `<div class="line-number" data-line="${index + 1}"><span aria-hidden="true">${index + 1}</span></div>`).join("");
  get("code-count").textContent = `${count} line${count === 1 ? "" : "s"}`;
  highlightOutput.innerHTML = highlightArduino(editor.value);
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
  const lineHeight = 20;
  editor.scrollTop = Math.max(0, (line - 4) * lineHeight);
  syncEditorScroll();
  setActiveLine(line, true);
}

function syncEditorScroll(): void {
  get("line-numbers").style.transform = `translateY(${-editor.scrollTop}px)`;
  highlightOutput.scrollTop = editor.scrollTop;
  highlightOutput.scrollLeft = editor.scrollLeft;
}
function syncPlayButton(): void { playButton.textContent = playing ? "Pause" : "Play"; playButton.setAttribute("aria-pressed", String(playing)); }
function setPlaybackEnabled(enabled: boolean): void {
  for (const id of ["play", "restart", "previous-command", "next-command", "timeline"]) {
    (get(id) as HTMLButtonElement | HTMLInputElement).disabled = !enabled;
  }
}
function formatTime(milliseconds: number): string { const seconds = milliseconds / 1000; return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, "0")}`; }

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

async function copyPresetCommand(button: HTMLButtonElement): Promise<void> {
  const command = button.dataset.command;
  const presetName = button.dataset.presetName;
  if (!command || !presetName) return;

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

  window.clearTimeout(copyFeedbackTimer);
  const previousButton = document.querySelector<HTMLButtonElement>(".copy-command.copied");
  previousButton?.classList.remove("copied");
  button.classList.add("copied");
  get("preset-copy-status").textContent = `${presetName} copied`;
  copyFeedbackTimer = window.setTimeout(() => {
    button.classList.remove("copied");
    get("preset-copy-status").textContent = "Click to copy";
  }, 1800);
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

const settingIds: Record<keyof ProfileValues, string> = {
  l1: "setting-l1", l2: "setting-l2", l3: "setting-l3", homeX: "setting-home-x", homeY: "setting-home-y", homeZ: "setting-home-z",
  baseMin: "setting-base-min", baseMax: "setting-base-max", shoulderMin: "setting-shoulder-min", shoulderMax: "setting-shoulder-max", elbowMin: "setting-elbow-min", elbowMax: "setting-elbow-max",
};
function writeSettings(values: ProfileValues): void { for (const key of Object.keys(settingIds) as (keyof ProfileValues)[]) get<HTMLInputElement>(settingIds[key]).value = String(values[key]); }
function readSettings(): ProfileValues { const result = {} as ProfileValues; for (const key of Object.keys(settingIds) as (keyof ProfileValues)[]) result[key] = Number(get<HTMLInputElement>(settingIds[key]).value); return result; }

editor.addEventListener("input", () => { dirty = true; get("editor-state").textContent = "Changes not previewed"; sampleSelect.value = "custom"; updateGutter(); });
editor.addEventListener("scroll", syncEditorScroll);
editor.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); compileCurrent(); } });
sampleSelect.addEventListener("change", () => {
  if (sampleSelect.value === "instructor" || sampleSelect.value === "student" || sampleSelect.value === "freeform") loadSample(sampleSelect.value);
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
get("fit-camera").addEventListener("click", () => viewer.fitToView());
get("reset-camera").addEventListener("click", () => viewer.resetCamera());
cameraPresetSelect.addEventListener("change", () => {
  if (cameraPresetSelect.value !== "custom") viewer.setCameraPreset(cameraPresetSelect.value as CameraPreset);
});
get<HTMLInputElement>("toggle-path").addEventListener("change", (event) => viewer.setPathVisible((event.currentTarget as HTMLInputElement).checked));
get<HTMLInputElement>("toggle-grid").addEventListener("change", (event) => viewer.setGridVisible((event.currentTarget as HTMLInputElement).checked));
get<HTMLInputElement>("toggle-axes").addEventListener("change", (event) => viewer.setAxesVisible((event.currentTarget as HTMLInputElement).checked));
for (const button of document.querySelectorAll<HTMLButtonElement>(".copy-command")) {
  button.addEventListener("click", () => void copyPresetCommand(button));
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

loadSample("instructor");
syncPlayButton();
requestAnimationFrame(animationFrame);
