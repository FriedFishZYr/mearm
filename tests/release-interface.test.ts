import { describe, expect, it } from "vitest";
import interfaceSource from "../src/main.ts?raw";
import sceneSource from "../src/viewer/scene.ts?raw";

describe("release interface contract", () => {
  it("keeps the required classroom controls and accessible names", () => {
    for (const marker of [
      'aria-label="Arduino dance code"',
      'aria-label="Dance timeline"',
      'aria-label="Base maximum angle"',
      'aria-label="Shoulder maximum angle"',
      'aria-label="Elbow maximum angle"',
      'role="status"',
      'id="settings-dialog"',
      'id="previous-command"',
      'id="next-command"',
      'id="preset-copy-status"',
      'aria-label="Approved pose commands"',
    ]) expect(interfaceSource).toContain(marker);
  });

  it("builds copyable preset commands from the approved robot poses", () => {
    expect(interfaceSource).toContain("DEFAULT_PROFILE.approvedPoses.map");
    expect(interfaceSource).toContain('navigator.clipboard.writeText(command)');
    expect(interfaceSource).toContain('button.addEventListener("click", () => void copyPresetCommand(button))');
  });

  it("keeps error-state playback disabled and names the WebGL canvas", () => {
    expect(interfaceSource).toContain("setPlaybackEnabled(false)");
    expect(sceneSource).toContain("Interactive three-dimensional preview of the MeArm robot dance");
  });
});
