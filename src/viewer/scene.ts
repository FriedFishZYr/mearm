import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { Point3, RobotProfile } from "../core/types";
import { MeArmModel, type ViewerStatus } from "./arm-model";
import type { PlaybackFrame } from "./playback";
import { TaskSpaceBoundary } from "./task-space";

export type CameraPreset = "isometric" | "front" | "back" | "left" | "right" | "top";

export class MeArmScene {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1200);
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  private readonly labelRenderer = new CSS2DRenderer();
  private readonly controls: OrbitControls;
  private readonly model: MeArmModel;
  private readonly taskSpace: TaskSpaceBoundary;
  private readonly grid = new THREE.GridHelper(420, 21, 0xa9b1b7, 0xd9dee1);
  private readonly axes = new THREE.AxesHelper(55);
  private readonly pathLabels = new THREE.Group();
  private readonly resizeObserver: ResizeObserver;

  constructor(private readonly container: HTMLElement, profile: RobotProfile) {
    this.scene.background = new THREE.Color(0xf1f3f4);
    this.scene.fog = new THREE.FogExp2(0xf1f3f4, 0.0012);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute("role", "img");
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Interactive three-dimensional preview of the MeArm robot dance and reachable task space",
    );
    this.labelRenderer.domElement.className = "scene-label-layer";
    this.labelRenderer.domElement.setAttribute("aria-hidden", "true");
    container.append(this.renderer.domElement, this.labelRenderer.domElement);

    this.camera.position.set(245, 190, 260);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 120;
    this.controls.maxDistance = 620;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.target.set(0, 75, 65);

    const ambient = new THREE.HemisphereLight(0xffffff, 0xc9ced2, 2.25);
    const key = new THREE.DirectionalLight(0xfff8ec, 3.2);
    key.position.set(-140, 260, 120);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -220;
    key.shadow.camera.right = 220;
    key.shadow.camera.top = 260;
    key.shadow.camera.bottom = -80;
    this.scene.add(ambient, key);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(245, 64),
      new THREE.MeshStandardMaterial({ color: 0xf7f8f9, roughness: 0.92 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.y = -0.5;
    this.scene.add(floor, this.grid);

    this.axes.setColors(new THREE.Color(0xa93642), new THREE.Color(0x246b9e), new THREE.Color(0x246b5b));
    this.axes.position.y = 1;
    const xLabel = this.makeLabel("X", "axis-label axis-label-x");
    const yLabel = this.makeLabel("Y", "axis-label axis-label-y");
    const zLabel = this.makeLabel("Z", "axis-label axis-label-z");
    xLabel.position.set(61, 0, 0);
    yLabel.position.set(0, 0, 61);
    zLabel.position.set(0, 61, 0);
    this.axes.add(xLabel, yLabel, zLabel);
    this.scene.add(this.axes, this.pathLabels);

    this.model = new MeArmModel(profile);
    this.taskSpace = new TaskSpaceBoundary(profile, this.model.baseHeight);
    this.scene.add(this.taskSpace, this.model);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
  }

  setFrame(frame: PlaybackFrame): void {
    this.model.setPose(frame.state.angles, frame.clawOpenness);
    this.model.setStatus(frame.status);
  }

  setPath(points: Parameters<MeArmModel["setPath"]>[0]): void {
    this.model.setPath(points);
  }

  setCoordinateLabels(points: Point3[]): void {
    this.clearCoordinateLabels();
    points.forEach((point, index) => {
      const label = this.makeCoordinateLabel(point, index);
      label.position.set(point.x, point.z + this.model.baseHeight + 5, point.y);
      label.center.set(0.5, 1.15);
      this.pathLabels.add(label);
    });
  }

  setGridVisible(visible: boolean): void {
    this.grid.visible = visible;
  }

  setAxesVisible(visible: boolean): void {
    this.axes.visible = visible;
  }

  setPathVisible(visible: boolean): void {
    this.model.setPathVisible(visible);
    this.pathLabels.visible = visible;
  }

  setTaskSpaceVisible(visible: boolean): void {
    this.taskSpace.visible = visible;
  }

  setStatus(status: ViewerStatus): void {
    this.model.setStatus(status);
  }

  resetCamera(): void {
    this.camera.position.set(245, 190, 260);
    this.camera.up.set(0, 1, 0);
    this.controls.target.set(0, 75, 65);
    this.controls.update();
  }

  fitToView(): void {
    this.model.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(this.model);
    if (this.taskSpace.visible) {
      this.taskSpace.updateWorldMatrix(true, true);
      bounds.union(new THREE.Box3().setFromObject(this.taskSpace));
    }
    if (bounds.isEmpty()) return;

    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const direction = this.camera.position.clone().sub(this.controls.target);
    if (direction.lengthSq() < 0.001) direction.set(1, 0.75, 1);
    direction.normalize();

    const halfFov = THREE.MathUtils.degToRad(this.camera.fov * 0.5);
    const fittedDistance = sphere.radius / Math.sin(halfFov) * 1.18;
    const distance = THREE.MathUtils.clamp(fittedDistance, this.controls.minDistance, this.controls.maxDistance);
    this.controls.target.copy(sphere.center);
    this.camera.position.copy(sphere.center).addScaledVector(direction, distance);
    this.controls.update();
  }

  setCameraPreset(preset: CameraPreset): void {
    const distance = THREE.MathUtils.clamp(
      this.camera.position.distanceTo(this.controls.target),
      this.controls.minDistance,
      this.controls.maxDistance,
    );
    const directions: Record<CameraPreset, THREE.Vector3> = {
      isometric: new THREE.Vector3(1, 0.72, 1),
      front: new THREE.Vector3(0, 0.04, 1),
      back: new THREE.Vector3(0, 0.04, -1),
      left: new THREE.Vector3(-1, 0.04, 0),
      right: new THREE.Vector3(1, 0.04, 0),
      top: new THREE.Vector3(0, 1, 0.001),
    };

    this.camera.up.set(0, 1, 0);
    if (preset === "top") this.camera.up.set(0, 0, -1);
    this.camera.position.copy(this.controls.target).addScaledVector(directions[preset].normalize(), distance);
    this.controls.update();
  }

  getCameraViewLabel(): string {
    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    const horizontalX = Math.abs(direction.x);
    const horizontalZ = Math.abs(direction.z);

    if (direction.y > 0.9) return "Top view";
    if (direction.y > 0.22 && horizontalX > 0.35 && horizontalZ > 0.35) return "Isometric view";
    if (horizontalX > horizontalZ * 1.35) return direction.x > 0 ? "Right view" : "Left view";
    if (horizontalZ > horizontalX * 1.35) return direction.z > 0 ? "Front view" : "Back view";
    return "Perspective view";
  }

  render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.clearCoordinateLabels();
    for (const child of this.axes.children) {
      if (child instanceof CSS2DObject) child.element.remove();
    }
    this.axes.dispose();
    this.taskSpace.dispose();
    this.model.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labelRenderer.domElement.remove();
  }

  private resize(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.labelRenderer.setSize(width, height);
  }

  private makeLabel(text: string, className: string): CSS2DObject {
    const element = document.createElement("span");
    element.className = className;
    element.textContent = text;
    return new CSS2DObject(element);
  }

  private makeCoordinateLabel(point: Point3, index: number): CSS2DObject {
    const element = document.createElement("span");
    element.className = "path-coordinate-label";
    const pointName = document.createElement("strong");
    pointName.textContent = `P${index + 1}`;
    element.append(pointName);

    for (const [axis, value] of [["X", point.x], ["Y", point.y], ["Z", point.z]] as const) {
      const coordinate = document.createElement("span");
      coordinate.className = `coordinate-axis coordinate-axis-${axis.toLowerCase()}`;
      coordinate.textContent = `${axis} ${this.formatCoordinate(value)}`;
      element.append(coordinate);
    }

    const unit = document.createElement("small");
    unit.textContent = "mm";
    element.append(unit);
    return new CSS2DObject(element);
  }

  private clearCoordinateLabels(): void {
    for (const child of [...this.pathLabels.children]) {
      if (child instanceof CSS2DObject) child.element.remove();
      this.pathLabels.remove(child);
    }
  }

  private formatCoordinate(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
}
