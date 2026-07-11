import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { RobotProfile } from "../core/types";
import { MeArmModel, type ViewerStatus } from "./arm-model";
import type { PlaybackFrame } from "./playback";

export class MeArmScene {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1200);
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  private readonly controls: OrbitControls;
  private readonly model: MeArmModel;
  private readonly grid = new THREE.GridHelper(420, 21, 0x37645c, 0x17332e);
  private readonly axes = new THREE.AxesHelper(55);
  private readonly resizeObserver: ResizeObserver;

  constructor(private readonly container: HTMLElement, profile: RobotProfile) {
    this.scene.background = new THREE.Color(0x071512);
    this.scene.fog = new THREE.FogExp2(0x071512, 0.0019);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute("role", "img");
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Interactive three-dimensional preview of the MeArm robot dance",
    );
    container.append(this.renderer.domElement);

    this.camera.position.set(245, 190, 260);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 120;
    this.controls.maxDistance = 620;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.target.set(0, 75, 65);

    const ambient = new THREE.HemisphereLight(0xc8fff4, 0x0d211d, 2.25);
    const key = new THREE.DirectionalLight(0xfff1d8, 3.2);
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
      new THREE.MeshStandardMaterial({ color: 0x0b211d, roughness: 0.92 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.y = -0.5;
    this.scene.add(floor, this.grid);

    this.axes.position.y = 1;
    this.scene.add(this.axes);

    this.model = new MeArmModel(profile);
    this.scene.add(this.model);

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

  setGridVisible(visible: boolean): void {
    this.grid.visible = visible;
  }

  setAxesVisible(visible: boolean): void {
    this.axes.visible = visible;
  }

  setPathVisible(visible: boolean): void {
    this.model.setPathVisible(visible);
  }

  setStatus(status: ViewerStatus): void {
    this.model.setStatus(status);
  }

  resetCamera(): void {
    this.camera.position.set(245, 190, 260);
    this.controls.target.set(0, 75, 65);
    this.controls.update();
  }

  render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.model.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private resize(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
}
