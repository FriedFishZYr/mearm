import { describe, expect, it } from "vitest";
import interfaceSource from "../src/main.ts?raw";
import sceneSource from "../src/viewer/scene.ts?raw";

describe("release interface contract", () => {
  it("keeps the required classroom controls and accessible names", () => {
    for (const marker of [
      'aria-label="Arduino dance code"',
      'aria-label="Code command markers"',
      'aria-label="Dance timeline"',
      'aria-label="Base maximum angle"',
      'aria-label="Shoulder maximum angle"',
      'aria-label="Elbow maximum angle"',
      'role="status"',
      'id="settings-dialog"',
      'id="previous-command"',
      'id="next-command"',
      'id="reset-code"',
      'id="preset-copy-status"',
      'aria-label="Approved pose commands"',
      'aria-label="Delay commands"',
      '<option value="freeform">Free form</option>',
      'aria-label="Free form coordinate limits"',
    ]) expect(interfaceSource).toContain(marker);
  });

  it("builds copyable preset commands from the approved robot poses", () => {
    expect(interfaceSource).toContain("DEFAULT_PROFILE.approvedPoses.map");
    expect(interfaceSource).toContain("[250, 500, 1000, 2000].map");
    expect(interfaceSource).toContain('navigator.clipboard.writeText(command)');
    expect(interfaceSource).toContain('document.querySelectorAll<HTMLButtonElement>(".copy-command")');
  });

  it("builds direct command markers in the code gutter", () => {
    expect(interfaceSource).toContain('button.className = "command-marker"');
    expect(interfaceSource).toContain('button.dataset.commandIndex = String(firstIndex)');
    expect(interfaceSource).toContain('visitCommand(Number(marker.dataset.commandIndex))');
    expect(interfaceSource).toContain('range.addEventListener("input"');
  });

  it("keeps error-state playback disabled and names the WebGL canvas", () => {
    expect(interfaceSource).toContain("setPlaybackEnabled(false)");
    expect(sceneSource).toContain("Interactive three-dimensional preview of the MeArm robot dance");
  });
});
