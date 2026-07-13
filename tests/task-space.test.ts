import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { DEFAULT_PROFILE } from "../src/core/profile";
import type { RobotProfile } from "../src/core/types";
import { createTaskSpaceBoundaryGeometry, TaskSpaceBoundary } from "../src/viewer/task-space";

describe("servo-limited task-space boundary", () => {
  it("maps all six configuration-space faces into a finite surface mesh", () => {
    const geometry = createTaskSpaceBoundaryGeometry(DEFAULT_PROFILE, 20);
    const positions = geometry.surface.getAttribute("position");
    const indices = geometry.surface.getIndex();

    expect(positions.count).toBe(6 * 21 * 21);
    expect(indices?.count).toBe(6 * 20 * 20 * 6);
    expect(Array.from(positions.array).every(Number.isFinite)).toBe(true);
    expect(Array.from(geometry.grid.getAttribute("position").array).every(Number.isFinite)).toBe(true);

    geometry.surface.dispose();
    geometry.grid.dispose();
  });

  it("matches the default workspace extrema in scene coordinates", () => {
    const geometry = createTaskSpaceBoundaryGeometry(DEFAULT_PROFILE, 20);
    const bounds = geometry.surface.boundingBox;
    expect(bounds).not.toBeNull();

    expect(bounds!.min.x).toBeCloseTo(-112.1249, 3);
    expect(bounds!.max.x).toBeCloseTo(112.1249, 3);
    expect(bounds!.min.y).toBeCloseTo(0, 3);
    expect(bounds!.max.y).toBeCloseTo(136.5685, 3);
    expect(bounds!.min.z).toBeCloseTo(15.5563, 3);
    expect(bounds!.max.z).toBeCloseTo(158.5685, 3);

    geometry.surface.dispose();
    geometry.grid.dispose();
  });

  it("derives the mesh from the active profile instead of fixed defaults", () => {
    const profile: RobotProfile = {
      ...DEFAULT_PROFILE,
      links: { l1: 100, l2: 60, l3: 30 },
      servoLimits: {
        ...DEFAULT_PROFILE.servoLimits,
        base: { min: 0, max: 0 },
      },
    };
    const geometry = createTaskSpaceBoundaryGeometry(profile, 20);
    const bounds = geometry.surface.boundingBox;

    expect(bounds).not.toBeNull();
    expect(bounds!.min.x).toBeCloseTo(0, 6);
    expect(bounds!.max.x).toBeCloseTo(0, 6);
    expect(bounds!.max.z).not.toBeCloseTo(158.5685, 3);

    geometry.surface.dispose();
    geometry.grid.dispose();
  });

  it("stays hidden by default and applies only the visual base offset", () => {
    const boundary = new TaskSpaceBoundary(DEFAULT_PROFILE, 28);
    boundary.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(boundary);

    expect(boundary.visible).toBe(false);
    expect(boundary.position.y).toBe(28);
    expect(bounds.min.y).toBeCloseTo(28, 3);
    expect(bounds.max.y).toBeCloseTo(164.5685, 3);

    boundary.dispose();
  });
});
