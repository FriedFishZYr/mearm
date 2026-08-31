import { DEFAULT_PROFILE } from "../core/profile";
import type { Point3 } from "../core/types";

/**
 * The copyable command chips are the one part of the inspector that cannot live
 * in `index.html`: they are generated from `DEFAULT_PROFILE.approvedPoses`, so
 * adding a classroom-approved pose to the profile adds a chip without anyone
 * editing markup.
 *
 * Everything else in the workspace is static markup. This module fills the three
 * empty containers that `index.html` reserves for it, and must run before
 * `main.ts` binds its `.copy-command` click handlers.
 */

const DELAY_PRESETS_MS = [250, 500, 1000, 2000];

const CLAW_PRESETS = [
  { name: "Open claw", command: "arm.openClaw();" },
  { name: "Close claw", command: "arm.closeClaw();" },
];

const presetCommand = (pose: Point3): string =>
  `arm.moveToXYZ(${pose.x}, ${pose.y}, ${pose.z});`;

function container(id: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`#${id}`);
  if (!element) throw new Error(`Missing interface element #${id}.`);
  return element;
}

/** Populates the approved-pose, delay, and claw command chips. */
export function renderPresetCommands(): void {
  container("preset-list").innerHTML = DEFAULT_PROFILE.approvedPoses
    .map((pose) => {
      const command = presetCommand(pose);
      return `<button class="copy-command preset-command" type="button" data-command="${command}" data-preset-name="${pose.name}" aria-label="Insert ${command}" title="Insert ${command} at the cursor · Alt-click to copy">
    <span class="preset-name">${pose.name}</span>
    <code>${command}</code>
  </button>`;
    })
    .join("");

  container("delay-command-row").innerHTML = DELAY_PRESETS_MS
    .map((milliseconds) => {
      const command = `delay(${milliseconds});`;
      return `<button class="copy-command delay-command" type="button" data-command="${command}" data-preset-name="${milliseconds} ms delay" aria-label="Insert ${command}" title="Insert ${command} at the cursor · Alt-click to copy">
    <strong>${milliseconds}</strong><small>ms</small>
  </button>`;
    })
    .join("");

  container("claw-command-row").innerHTML = CLAW_PRESETS
    .map(({ name, command }) =>
      `<button class="copy-command claw-command" type="button" data-command="${command}" data-preset-name="${name}" aria-label="Insert ${command}" title="Insert ${command} at the cursor · Alt-click to copy"><code>${command}</code></button>`)
    .join("");
}
