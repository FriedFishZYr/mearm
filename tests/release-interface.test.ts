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
    ]) expect(interfaceSource).toContain(marker);
  });

  it("keeps error-state playback disabled and names the WebGL canvas", () => {
    expect(interfaceSource).toContain("setPlaybackEnabled(false)");
    expect(sceneSource).toContain("Interactive three-dimensional preview of the MeArm robot dance");
  });
});
