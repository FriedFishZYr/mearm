import * as THREE from "three";
import type { JointAngles, Point3, RobotProfile } from "../core/types";

export type ViewerStatus = "valid" | "caution" | "invalid";

const COLORS = {
  frame: 0xd4d9dc,
  frameDark: 0x66727a,
  joint: 0x4f5b63,
  claw: 0xffb454,
  valid: 0x2f806d,
  caution: 0xffc857,
  invalid: 0xff5f6d,
};

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  const result = new THREE.Mesh(geometry, material);
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}

export class MeArmModel extends THREE.Group {
  readonly baseHeight = 28;

  private readonly basePivot = new THREE.Group();
  private readonly shoulderPivot = new THREE.Group();
  private readonly elbowPivot = new THREE.Group();
  private readonly wrist = new THREE.Group();
  private readonly endpoint = new THREE.Object3D();
  private readonly leftFinger = new THREE.Group();
  private readonly rightFinger = new THREE.Group();
  private readonly target: THREE.Mesh;
  private readonly pathMaterial = new THREE.LineBasicMaterial({ color: COLORS.valid, transparent: true, opacity: 0.72 });
  private path: THREE.Line | null = null;
  private readonly frameMaterials: THREE.MeshStandardMaterial[] = [];

  constructor(profile: RobotProfile) {
    super();

    const frame = new THREE.MeshStandardMaterial({ color: COLORS.frame, roughness: 0.52, metalness: 0.08 });
    const frameDark = new THREE.MeshStandardMaterial({ color: COLORS.frameDark, roughness: 0.65 });
    const joint = new THREE.MeshStandardMaterial({ color: COLORS.joint, roughness: 0.38, metalness: 0.12 });
    const claw = new THREE.MeshStandardMaterial({ color: COLORS.claw, roughness: 0.5 });
    this.frameMaterials.push(frame, frameDark, joint, claw);

    const base = mesh(new THREE.CylinderGeometry(32, 38, this.baseHeight, 32), frameDark);
    base.position.y = this.baseHeight / 2;
    this.add(base);

    const turntable = mesh(new THREE.CylinderGeometry(25, 25, 8, 32), joint);
    turntable.position.y = this.baseHeight - 2;
    this.add(turntable);

    this.basePivot.position.y = this.baseHeight;
    this.add(this.basePivot);

    const shoulderHousing = mesh(new THREE.BoxGeometry(38, 30, 30), frameDark);
    shoulderHousing.position.set(0, 0, 0);
    this.basePivot.add(shoulderHousing);

    this.basePivot.add(this.shoulderPivot);
    this.shoulderPivot.add(this.makeJoint(joint));
    this.shoulderPivot.add(this.makeLink(profile.links.l1, frame));

    this.elbowPivot.position.z = profile.links.l1;
    this.shoulderPivot.add(this.elbowPivot);
    this.elbowPivot.add(this.makeJoint(joint));
    this.elbowPivot.add(this.makeLink(profile.links.l2, frame));

    this.wrist.position.z = profile.links.l2;
    this.elbowPivot.add(this.wrist);
    this.wrist.add(this.makeJoint(joint, 8));

    const hand = mesh(new THREE.BoxGeometry(18, 9, profile.links.l3), frameDark);
    hand.position.z = profile.links.l3 / 2;
    this.wrist.add(hand);

    this.endpoint.position.z = profile.links.l3;
    this.wrist.add(this.endpoint);

    const palm = mesh(new THREE.BoxGeometry(34, 9, 13), claw);
    palm.position.z = 6;
    this.endpoint.add(palm);

    this.leftFinger.position.set(-12, 0, 10);
    this.rightFinger.position.set(12, 0, 10);
    this.endpoint.add(this.leftFinger, this.rightFinger);
    this.leftFinger.add(this.makeFinger(claw));
    this.rightFinger.add(this.makeFinger(claw));

    const targetMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.valid,
      emissive: COLORS.valid,
      emissiveIntensity: 0.45,
    });
    this.target = mesh(new THREE.SphereGeometry(4.5, 20, 16), targetMaterial);
    this.add(this.target);

    this.setClaw(1);
  }

  setPose(angles: JointAngles, clawOpenness: number): void {
    this.basePivot.rotation.y = angles.base;
    this.shoulderPivot.rotation.x = -angles.shoulder;
    this.elbowPivot.rotation.x = angles.shoulder - angles.elbow;
    // The MeArm parallelogram keeps the hand horizontal. L3 is therefore a
    // horizontal offset in the source kinematics, not an extension of L2.
    this.wrist.rotation.x = angles.elbow;
    this.setClaw(clawOpenness);
    this.updateMatrixWorld(true);
    this.target.position.copy(this.endpoint.getWorldPosition(new THREE.Vector3()));
  }

  setStatus(status: ViewerStatus): void {
    const color = status === "invalid" ? COLORS.invalid : status === "caution" ? COLORS.caution : COLORS.valid;
    const targetMaterial = this.target.material as THREE.MeshStandardMaterial;
    targetMaterial.color.setHex(color);
    targetMaterial.emissive.setHex(color);
    this.pathMaterial.color.setHex(color);
    for (const material of this.frameMaterials) {
      material.emissive.setHex(status === "valid" ? 0x000000 : color);
      material.emissiveIntensity = status === "valid" ? 0 : 0.13;
    }
  }

  setPath(points: Point3[]): void {
    if (this.path) {
      this.remove(this.path);
      this.path.geometry.dispose();
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => this.sourceToLocal(point)));
    this.path = new THREE.Line(geometry, this.pathMaterial);
    this.path.renderOrder = 1;
    this.add(this.path);
  }

  setPathVisible(visible: boolean): void {
    if (this.path) this.path.visible = visible;
  }

  getEndEffectorSourcePoint(): Point3 {
    this.updateMatrixWorld(true);
    const world = this.endpoint.getWorldPosition(new THREE.Vector3());
    return { x: world.x, y: world.z, z: world.y - this.baseHeight };
  }

  dispose(): void {
    this.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    for (const material of this.frameMaterials) material.dispose();
    (this.target.material as THREE.Material).dispose();
    this.path?.geometry.dispose();
    this.pathMaterial.dispose();
  }

  private makeLink(length: number, material: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    const leftRail = mesh(new THREE.BoxGeometry(7, 10, length), material);
    const rightRail = leftRail.clone();
    leftRail.position.set(-8, 0, length / 2);
    rightRail.position.set(8, 0, length / 2);
    group.add(leftRail, rightRail);
    return group;
  }

  private makeJoint(material: THREE.Material, radius = 10): THREE.Mesh {
    const joint = mesh(new THREE.CylinderGeometry(radius, radius, 24, 24), material);
    joint.rotation.z = Math.PI / 2;
    return joint;
  }

  private makeFinger(material: THREE.Material): THREE.Mesh {
    const finger = mesh(new THREE.BoxGeometry(6, 9, 31), material);
    finger.position.z = 15;
    return finger;
  }

  private setClaw(openness: number): void {
    const amount = THREE.MathUtils.clamp(openness, 0, 1);
    const angle = THREE.MathUtils.lerp(0.04, 0.34, amount);
    this.leftFinger.rotation.y = -angle;
    this.rightFinger.rotation.y = angle;
  }

  private sourceToLocal(point: Point3): THREE.Vector3 {
    return new THREE.Vector3(point.x, point.z + this.baseHeight, point.y);
  }
}
