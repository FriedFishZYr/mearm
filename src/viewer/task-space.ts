import * as THREE from "three";
import { solveForward } from "../core/kinematics";
import type { JointAngles, RobotProfile } from "../core/types";

const DEFAULT_SEGMENTS = 20;

type Joint = keyof JointAngles;

interface BoundaryFace {
  fixed: Joint;
  value: number;
  u: Joint;
  v: Joint;
}

export interface TaskSpaceBoundaryGeometry {
  surface: THREE.BufferGeometry;
  grid: THREE.BufferGeometry;
}

function jointValue(profile: RobotProfile, joint: Joint, amount: number): number {
  const range = profile.servoLimits[joint];
  return THREE.MathUtils.lerp(range.min, range.max, amount);
}

function scenePoint(angles: JointAngles, profile: RobotProfile): THREE.Vector3 {
  const point = solveForward(angles, profile);
  return new THREE.Vector3(point.x, point.z, point.y);
}

function facePoint(
  face: BoundaryFace,
  uAmount: number,
  vAmount: number,
  profile: RobotProfile,
): THREE.Vector3 {
  const angles: JointAngles = { base: 0, shoulder: 0, elbow: 0 };
  angles[face.fixed] = face.value;
  angles[face.u] = jointValue(profile, face.u, uAmount);
  angles[face.v] = jointValue(profile, face.v, vAmount);
  return scenePoint(angles, profile);
}

export function createTaskSpaceBoundaryGeometry(
  profile: RobotProfile,
  segments = DEFAULT_SEGMENTS,
): TaskSpaceBoundaryGeometry {
  const subdivisions = Number.isFinite(segments)
    ? Math.max(2, Math.floor(segments))
    : DEFAULT_SEGMENTS;
  const limits = profile.servoLimits;
  const faces: BoundaryFace[] = [
    { fixed: "base", value: limits.base.min, u: "shoulder", v: "elbow" },
    { fixed: "base", value: limits.base.max, u: "shoulder", v: "elbow" },
    { fixed: "shoulder", value: limits.shoulder.min, u: "base", v: "elbow" },
    { fixed: "shoulder", value: limits.shoulder.max, u: "base", v: "elbow" },
    { fixed: "elbow", value: limits.elbow.min, u: "base", v: "shoulder" },
    { fixed: "elbow", value: limits.elbow.max, u: "base", v: "shoulder" },
  ];

  const surfacePositions: number[] = [];
  const surfaceIndices: number[] = [];
  const gridPositions: number[] = [];
  const rowLength = subdivisions + 1;

  const appendGridSegment = (start: THREE.Vector3, end: THREE.Vector3): void => {
    gridPositions.push(start.x, start.y, start.z, end.x, end.y, end.z);
  };

  for (const face of faces) {
    const firstVertex = surfacePositions.length / 3;
    const points: THREE.Vector3[] = [];

    for (let uIndex = 0; uIndex <= subdivisions; uIndex += 1) {
      for (let vIndex = 0; vIndex <= subdivisions; vIndex += 1) {
        const point = facePoint(
          face,
          uIndex / subdivisions,
          vIndex / subdivisions,
          profile,
        );
        points.push(point);
        surfacePositions.push(point.x, point.y, point.z);
      }
    }

    for (let uIndex = 0; uIndex < subdivisions; uIndex += 1) {
      for (let vIndex = 0; vIndex < subdivisions; vIndex += 1) {
        const lowerLeft = firstVertex + uIndex * rowLength + vIndex;
        const upperLeft = lowerLeft + rowLength;
        surfaceIndices.push(
          lowerLeft,
          upperLeft,
          lowerLeft + 1,
          lowerLeft + 1,
          upperLeft,
          upperLeft + 1,
        );
      }
    }

    for (let uIndex = 0; uIndex <= subdivisions; uIndex += 1) {
      for (let vIndex = 0; vIndex < subdivisions; vIndex += 1) {
        const index = uIndex * rowLength + vIndex;
        appendGridSegment(points[index]!, points[index + 1]!);
      }
    }
    for (let vIndex = 0; vIndex <= subdivisions; vIndex += 1) {
      for (let uIndex = 0; uIndex < subdivisions; uIndex += 1) {
        const index = uIndex * rowLength + vIndex;
        appendGridSegment(points[index]!, points[index + rowLength]!);
      }
    }
  }

  const surface = new THREE.BufferGeometry();
  surface.setAttribute("position", new THREE.Float32BufferAttribute(surfacePositions, 3));
  surface.setIndex(surfaceIndices);
  surface.computeBoundingBox();
  surface.computeBoundingSphere();

  const grid = new THREE.BufferGeometry();
  grid.setAttribute("position", new THREE.Float32BufferAttribute(gridPositions, 3));
  grid.computeBoundingBox();
  grid.computeBoundingSphere();

  return { surface, grid };
}

export class TaskSpaceBoundary extends THREE.Group {
  private readonly surfaceGeometry: THREE.BufferGeometry;
  private readonly gridGeometry: THREE.BufferGeometry;
  private readonly surfaceMaterial = new THREE.MeshBasicMaterial({
    color: 0x4fa8b3,
    transparent: true,
    opacity: 0.11,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  private readonly gridMaterial = new THREE.LineBasicMaterial({
    color: 0x4fa8b3,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });

  constructor(profile: RobotProfile, verticalOffset: number) {
    super();
    this.name = "task-space-boundary";
    this.position.y = verticalOffset;
    this.visible = false;

    const geometry = createTaskSpaceBoundaryGeometry(profile);
    this.surfaceGeometry = geometry.surface;
    this.gridGeometry = geometry.grid;

    const surface = new THREE.Mesh(this.surfaceGeometry, this.surfaceMaterial);
    surface.name = "task-space-surface";
    surface.renderOrder = 1;
    const grid = new THREE.LineSegments(this.gridGeometry, this.gridMaterial);
    grid.name = "task-space-grid";
    grid.renderOrder = 2;
    this.add(surface, grid);
  }

  dispose(): void {
    this.surfaceGeometry.dispose();
    this.gridGeometry.dispose();
    this.surfaceMaterial.dispose();
    this.gridMaterial.dispose();
  }
}
