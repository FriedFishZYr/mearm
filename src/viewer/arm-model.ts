import * as THREE from "three";
import type { JointAngles, Point3, RobotProfile } from "../core/types";

export type ViewerStatus = "valid" | "caution" | "invalid";

const COLORS = {
  acrylic: 0xc99a61,
  acrylicEdge: 0x5f4028,
  servo: 0x252a2e,
  servoLabel: 0xb23a48,
  joint: 0x343b40,
  metal: 0xc8d0d5,
  claw: 0xd4a05f,
  path: 0x7568c5,
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

function roundedRectangleGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
): THREE.ExtrudeGeometry {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const corner = Math.min(radius, halfWidth, halfHeight);
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + corner, -halfHeight);
  shape.lineTo(halfWidth - corner, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + corner);
  shape.lineTo(halfWidth, halfHeight - corner);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - corner, halfHeight);
  shape.lineTo(-halfWidth + corner, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - corner);
  shape.lineTo(-halfWidth, -halfHeight + corner);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + corner, -halfHeight);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 8,
  });
  geometry.center();
  return geometry;
}

function gearGeometry(radius: number, teeth: number, thickness: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const points = teeth * 2;
  for (let index = 0; index < points; index += 1) {
    const angle = index / points * Math.PI * 2;
    const pointRadius = index % 2 === 0 ? radius : radius * 0.78;
    const x = Math.cos(angle) * pointRadius;
    const y = Math.sin(angle) * pointRadius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
  });
  geometry.center();
  return geometry;
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
  private readonly pathMaterial = new THREE.LineBasicMaterial({ color: COLORS.path, transparent: true, opacity: 0.72 });
  private path: THREE.Line | null = null;
  private readonly frameMaterials: THREE.MeshStandardMaterial[] = [];

  constructor(profile: RobotProfile) {
    super();

    const acrylic = new THREE.MeshStandardMaterial({ color: COLORS.acrylic, roughness: 0.58, metalness: 0.02 });
    const acrylicEdge = new THREE.MeshStandardMaterial({ color: COLORS.acrylicEdge, roughness: 0.72 });
    const servo = new THREE.MeshStandardMaterial({ color: COLORS.servo, roughness: 0.5, metalness: 0.06 });
    const servoLabel = new THREE.MeshStandardMaterial({ color: COLORS.servoLabel, roughness: 0.62 });
    const joint = new THREE.MeshStandardMaterial({ color: COLORS.joint, roughness: 0.42, metalness: 0.12 });
    const metal = new THREE.MeshStandardMaterial({ color: COLORS.metal, roughness: 0.28, metalness: 0.72 });
    const claw = new THREE.MeshStandardMaterial({ color: COLORS.claw, roughness: 0.55, metalness: 0.02 });
    this.frameMaterials.push(acrylic, acrylicEdge, servo, servoLabel, joint, metal, claw);

    const basePlate = this.makeHorizontalPlate(98, 82, 4, 6, acrylic, acrylicEdge);
    basePlate.name = "base-plate";
    basePlate.position.y = 2.2;
    this.add(basePlate);

    for (const [x, z] of [[-40, -31], [40, -31], [-40, 31], [40, 31]] as const) {
      const foot = mesh(new THREE.CylinderGeometry(2.2, 2.2, 6, 12), metal);
      foot.position.set(x, 4.8, z);
      this.add(foot);
    }

    const baseServo = this.makeServo(27, 34, 35, servo, servoLabel, metal);
    baseServo.name = "base-servo";
    baseServo.rotation.z = -Math.PI / 2;
    baseServo.position.set(0, 13.5, -2);
    this.add(baseServo);

    const pivotPlate = this.makeHorizontalPlate(52, 46, 3.6, 4, acrylic, acrylicEdge);
    pivotPlate.name = "pivot-servo-plate";
    pivotPlate.position.y = 17.5;
    this.add(pivotPlate);

    for (const [x, z] of [[-20, -17], [20, -17], [-20, 17], [20, 17]] as const) {
      const standoff = mesh(new THREE.CylinderGeometry(1.8, 1.8, 11, 10), metal);
      standoff.position.set(x, 11, z);
      this.add(standoff);
    }

    this.basePivot.position.y = this.baseHeight;
    this.basePivot.name = "rotating-arm-assembly";
    this.add(this.basePivot);

    const rotatingDeck = this.makeHorizontalPlate(54, 48, 3.6, 4, acrylic, acrylicEdge);
    rotatingDeck.position.y = -8.8;
    this.basePivot.add(rotatingDeck);

    for (const x of [-18, 18]) {
      const sidePlate = this.makeVerticalSidePlate(40, 43, 3.4, 4, acrylic, acrylicEdge);
      sidePlate.name = x < 0 ? "left-arm-servo-plate" : "right-arm-servo-plate";
      sidePlate.position.set(x, -7, 0);
      this.basePivot.add(sidePlate);

      const plateWindow = mesh(new THREE.BoxGeometry(0.55, 15, 20), servo);
      plateWindow.position.set(x + Math.sign(x) * 2, -8, 0);
      this.basePivot.add(plateWindow);
    }

    for (const z of [-17, 17]) {
      const crossMember = mesh(new THREE.BoxGeometry(39, 5, 3.2), acrylicEdge);
      crossMember.position.set(0, -21, z);
      this.basePivot.add(crossMember);
    }

    const shoulderServo = this.makeServo(26, 25, 33, servo, servoLabel, metal);
    shoulderServo.name = "shoulder-servo";
    shoulderServo.position.set(-28, -6, 0);
    this.basePivot.add(shoulderServo);

    const elbowServo = this.makeServo(26, 25, 33, servo, servoLabel, metal);
    elbowServo.name = "elbow-servo";
    elbowServo.rotation.y = Math.PI;
    elbowServo.position.set(28, -6, 0);
    this.basePivot.add(elbowServo);

    this.basePivot.add(this.shoulderPivot);
    this.shoulderPivot.name = "shoulder-pivot";
    this.shoulderPivot.add(this.makeJoint(joint, metal, 9.5, 43));
    const upperLink = this.makeLink(profile.links.l1, acrylic, acrylicEdge, metal);
    upperLink.name = "upper-link";
    this.shoulderPivot.add(upperLink);

    const shoulderLinkage = this.makeLayeredCapsuleRail(
      profile.links.l1 * 0.82,
      7,
      2.6,
      acrylic,
      acrylicEdge,
    );
    shoulderLinkage.name = "parallel-linkage";
    shoulderLinkage.position.set(-14.5, 6, 4);
    this.shoulderPivot.add(shoulderLinkage);

    this.elbowPivot.position.z = profile.links.l1;
    this.elbowPivot.name = "elbow-pivot";
    this.shoulderPivot.add(this.elbowPivot);
    this.elbowPivot.add(this.makeJoint(joint, metal, 8.5, 35));
    const forearmLink = this.makeLink(profile.links.l2, acrylic, acrylicEdge, metal);
    forearmLink.name = "forearm-link";
    this.elbowPivot.add(forearmLink);

    const forearmLinkage = this.makeLayeredCapsuleRail(
      profile.links.l2 * 0.88,
      6.5,
      2.4,
      acrylic,
      acrylicEdge,
    );
    forearmLinkage.name = "forearm-parallel-linkage";
    forearmLinkage.position.set(14.5, -5.5, 3);
    this.elbowPivot.add(forearmLinkage);

    this.wrist.position.z = profile.links.l2;
    this.wrist.name = "wrist-assembly";
    this.elbowPivot.add(this.wrist);
    this.wrist.add(this.makeJoint(joint, metal, 7.2, 31));

    const handLength = Math.max(profile.links.l3, 8);
    const hand = this.makeHorizontalPlate(31, handLength, 3.2, 3, acrylic, acrylicEdge);
    hand.name = "wrist-link";
    hand.position.z = profile.links.l3 / 2;
    this.wrist.add(hand);

    const clawServo = this.makeServo(18, 12, 22, servo, servoLabel, metal);
    clawServo.name = "claw-servo";
    clawServo.position.set(0, 8.5, Math.max(7, profile.links.l3 * 0.45));
    clawServo.rotation.y = Math.PI / 2;
    this.wrist.add(clawServo);

    this.endpoint.position.z = profile.links.l3;
    this.endpoint.name = "kinematic-endpoint";
    this.wrist.add(this.endpoint);

    const palm = this.makeHorizontalPlate(34, 15, 3.6, 3, claw, acrylicEdge);
    palm.name = "gripper-plate";
    palm.position.z = 6;
    this.endpoint.add(palm);

    for (const x of [-11, 11]) {
      const pivotBolt = mesh(new THREE.CylinderGeometry(2.2, 2.2, 5.2, 12), metal);
      pivotBolt.position.set(x, 2.7, 3.5);
      this.endpoint.add(pivotBolt);
    }

    this.leftFinger.position.set(-11, 0, 9);
    this.rightFinger.position.set(11, 0, 9);
    this.leftFinger.name = "left-gripper-pivot";
    this.rightFinger.name = "right-gripper-pivot";
    this.endpoint.add(this.leftFinger, this.rightFinger);
    this.leftFinger.add(this.makeFinger(claw, acrylicEdge, metal, "left"));
    this.rightFinger.add(this.makeFinger(claw, acrylicEdge, metal, "right"));

    const targetMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.valid,
      emissive: COLORS.valid,
      emissiveIntensity: 0.45,
    });
    this.target = mesh(new THREE.SphereGeometry(4.5, 20, 16), targetMaterial);
    this.target.name = "target-marker";
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
    for (const material of this.frameMaterials) {
      material.emissive.setHex(status === "valid" ? 0x000000 : color);
      material.emissiveIntensity = status === "valid" ? 0 : 0.1;
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

  private makeHorizontalPlate(
    width: number,
    depth: number,
    thickness: number,
    radius: number,
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();
    const core = mesh(roundedRectangleGeometry(width, depth, thickness, radius), edgeMaterial);
    core.rotation.x = Math.PI / 2;
    group.add(core);
    for (const side of [-1, 1]) {
      const face = mesh(roundedRectangleGeometry(width - 1.2, depth - 1.2, 0.38, Math.max(0.5, radius - 0.6)), surfaceMaterial);
      face.rotation.x = Math.PI / 2;
      face.position.y = side * (thickness / 2 + 0.08);
      group.add(face);
    }
    return group;
  }

  private makeVerticalSidePlate(
    depth: number,
    height: number,
    thickness: number,
    radius: number,
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();
    const core = mesh(roundedRectangleGeometry(depth, height, thickness, radius), edgeMaterial);
    core.rotation.y = Math.PI / 2;
    group.add(core);
    for (const side of [-1, 1]) {
      const face = mesh(roundedRectangleGeometry(depth - 1.2, height - 1.2, 0.38, Math.max(0.5, radius - 0.6)), surfaceMaterial);
      face.rotation.y = Math.PI / 2;
      face.position.x = side * (thickness / 2 + 0.08);
      group.add(face);
    }
    return group;
  }

  private makeLink(
    length: number,
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
    metalMaterial: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();
    for (const x of [-9, 9]) {
      const rail = this.makeLayeredCapsuleRail(length, 11, 3.2, surfaceMaterial, edgeMaterial);
      rail.position.x = x;
      group.add(rail);
    }
    for (const amount of [0.32, 0.68]) {
      const spacer = mesh(new THREE.CylinderGeometry(2.1, 2.1, 22, 12), metalMaterial);
      spacer.rotation.z = Math.PI / 2;
      spacer.position.z = length * amount;
      group.add(spacer);
    }
    return group;
  }

  private makeLayeredCapsuleRail(
    length: number,
    width: number,
    thickness: number,
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();
    group.add(this.makeCapsuleRail(length, width, thickness, edgeMaterial));
    for (const side of [-1, 1]) {
      const face = this.makeCapsuleRail(length, width - 1.2, 0.36, surfaceMaterial);
      face.position.x = side * (thickness / 2 + 0.08);
      group.add(face);
    }
    return group;
  }

  private makeCapsuleRail(
    length: number,
    width: number,
    thickness: number,
    material: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();
    const safeLength = Math.max(length, width);
    const radius = width / 2;
    const bodyLength = Math.max(0.2, safeLength - width);
    const body = mesh(new THREE.BoxGeometry(thickness, width, bodyLength), material);
    body.position.z = safeLength / 2;
    group.add(body);
    for (const z of [radius, safeLength - radius]) {
      const end = mesh(new THREE.CylinderGeometry(radius, radius, thickness, 20), material);
      end.rotation.z = Math.PI / 2;
      end.position.z = z;
      group.add(end);
    }
    return group;
  }

  private makeLayeredHorizontalRail(
    length: number,
    width: number,
    thickness: number,
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();
    group.add(this.makeHorizontalCapsule(length, width, thickness, edgeMaterial));
    for (const side of [-1, 1]) {
      const face = this.makeHorizontalCapsule(length, width - 1.1, 0.36, surfaceMaterial);
      face.position.y = side * (thickness / 2 + 0.08);
      group.add(face);
    }
    return group;
  }

  private makeHorizontalCapsule(
    length: number,
    width: number,
    thickness: number,
    material: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();
    const safeLength = Math.max(length, width);
    const radius = width / 2;
    const bodyLength = Math.max(0.2, safeLength - width);
    const body = mesh(new THREE.BoxGeometry(width, thickness, bodyLength), material);
    body.position.z = safeLength / 2;
    group.add(body);
    for (const z of [radius, safeLength - radius]) {
      const end = mesh(new THREE.CylinderGeometry(radius, radius, thickness, 20), material);
      end.position.z = z;
      group.add(end);
    }
    return group;
  }

  private makeJoint(
    jointMaterial: THREE.Material,
    metalMaterial: THREE.Material,
    radius = 9,
    width = 34,
  ): THREE.Group {
    const group = new THREE.Group();
    const spacer = mesh(new THREE.CylinderGeometry(radius, radius, width, 24), jointMaterial);
    spacer.rotation.z = Math.PI / 2;
    group.add(spacer);
    for (const side of [-1, 1]) {
      const washer = mesh(new THREE.CylinderGeometry(radius * 0.56, radius * 0.56, 1.5, 18), metalMaterial);
      washer.rotation.z = Math.PI / 2;
      washer.position.x = side * (width / 2 + 0.8);
      group.add(washer);
      const screw = mesh(new THREE.CylinderGeometry(radius * 0.28, radius * 0.28, 1.2, 6), jointMaterial);
      screw.rotation.z = Math.PI / 2;
      screw.position.x = side * (width / 2 + 1.65);
      group.add(screw);
    }
    return group;
  }

  private makeServo(
    width: number,
    height: number,
    depth: number,
    bodyMaterial: THREE.Material,
    labelMaterial: THREE.Material,
    metalMaterial: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();
    const body = mesh(new THREE.BoxGeometry(width, height, depth), bodyMaterial);
    body.position.x = -1.5;
    group.add(body);
    const flange = mesh(new THREE.BoxGeometry(width + 7, 3.2, depth + 4), bodyMaterial);
    flange.position.set(-1.5, height * 0.26, 0);
    group.add(flange);
    const label = mesh(new THREE.BoxGeometry(0.45, height * 0.52, depth * 0.48), labelMaterial);
    label.position.set(width / 2 - 1.25, -1.5, 0);
    group.add(label);
    const hub = mesh(new THREE.CylinderGeometry(5, 5, 3.5, 22), metalMaterial);
    hub.rotation.z = Math.PI / 2;
    hub.position.x = width / 2 + 1;
    group.add(hub);
    return group;
  }

  private makeFinger(
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
    metalMaterial: THREE.Material,
    side: "left" | "right",
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = side === "left" ? "left-gripper-finger" : "right-gripper-finger";
    const gear = mesh(gearGeometry(5.4, 12, 2.4), surfaceMaterial);
    gear.name = side === "left" ? "left-gripper-gear" : "right-gripper-gear";
    gear.rotation.x = Math.PI / 2;
    gear.position.set(0, 1.65, 3.5);
    group.add(gear);
    group.add(this.makeLayeredHorizontalRail(34, 7, 3.4, surfaceMaterial, edgeMaterial));
    const innerDirection = side === "left" ? 1 : -1;
    for (const [index, z] of [19, 25, 31].entries()) {
      const tooth = mesh(new THREE.BoxGeometry(3.2, 3.6, 4.2), edgeMaterial);
      tooth.position.set(innerDirection * (4.2 + index * 0.35), 0, z);
      tooth.rotation.y = innerDirection * -0.13;
      group.add(tooth);
    }
    const pivot = mesh(new THREE.CylinderGeometry(2, 2, 4.8, 12), metalMaterial);
    pivot.position.set(0, 2.5, 3.5);
    group.add(pivot);
    return group;
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
