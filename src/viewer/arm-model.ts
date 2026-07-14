import * as THREE from "three";
import type { JointAngles, Point3, RobotProfile } from "../core/types";

export type ViewerStatus = "valid" | "caution" | "invalid";

const COLORS = {
  wood: 0xc99a61,
  woodEdge: 0x5f4028,
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

const V41_VISUAL_DIMENSIONS = Object.freeze({
  plateThickness: 3.2,
  principalPlateWidth: 11.5,
  principalPivotHoleRadius: 2.15,
  principalIntermediatePivot: 24.11,
  parallelLinkPivotSpan: 55.12,
  parallelLinkWidth: 5.6,
  parallelLinkHoleRadius: 1.65,
});

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  const result = new THREE.Mesh(geometry, material);
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}

function roundedRectangleShape(width: number, height: number, radius: number): THREE.Shape {
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
  shape.closePath();
  return shape;
}

function addCircularHole(shape: THREE.Shape, x: number, y: number, radius: number): void {
  const hole = new THREE.Path();
  hole.absarc(x, y, radius, 0, Math.PI * 2, true);
  shape.holes.push(hole);
}

function addRectangularHole(
  shape: THREE.Shape,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const hole = new THREE.Path();
  hole.moveTo(x - halfWidth, y - halfHeight);
  hole.lineTo(x - halfWidth, y + halfHeight);
  hole.lineTo(x + halfWidth, y + halfHeight);
  hole.lineTo(x + halfWidth, y - halfHeight);
  hole.closePath();
  shape.holes.push(hole);
}

function extrudedShapeGeometry(shape: THREE.Shape, depth: number): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 12,
  });
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

    const wood = new THREE.MeshStandardMaterial({ color: COLORS.wood, roughness: 0.58, metalness: 0.02 });
    const woodEdge = new THREE.MeshStandardMaterial({ color: COLORS.woodEdge, roughness: 0.72 });
    const servo = new THREE.MeshStandardMaterial({ color: COLORS.servo, roughness: 0.5, metalness: 0.06 });
    const servoLabel = new THREE.MeshStandardMaterial({ color: COLORS.servoLabel, roughness: 0.62 });
    const joint = new THREE.MeshStandardMaterial({ color: COLORS.joint, roughness: 0.42, metalness: 0.12 });
    const metal = new THREE.MeshStandardMaterial({ color: COLORS.metal, roughness: 0.28, metalness: 0.72 });
    const claw = new THREE.MeshStandardMaterial({ color: COLORS.claw, roughness: 0.55, metalness: 0.02 });
    this.frameMaterials.push(wood, woodEdge, servo, servoLabel, joint, metal, claw);

    const basePlate = this.makeMountingPlate(98, 82, 4, true, wood, woodEdge);
    basePlate.name = "base-plate";
    basePlate.position.y = 2.2;
    this.add(basePlate);

    for (const [x, z] of [[-40, -31], [40, -31], [-40, 31], [40, 31]] as const) {
      const foot = mesh(new THREE.CylinderGeometry(2.2, 2.2, 6, 12), metal);
      foot.position.set(x, 4.8, z);
      this.add(foot);
    }

    const baseServo = this.makeBaseServo(27, 22, 35, servo, servoLabel, metal);
    baseServo.name = "base-servo";
    baseServo.position.set(0, 17, 0);
    this.add(baseServo);

    const pivotPlate = this.makeMountingPlate(52, 46, 3.6, false, wood, woodEdge);
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

    const rotatingDeck = this.makeRotatingDeck(54, 48, 3.6, wood, woodEdge);
    rotatingDeck.name = "rotating-deck";
    // Keep the rotating deck above the fixed pivot plate. The previous layers
    // overlapped, which made their edges clip through each other during yaw.
    rotatingDeck.position.y = -6;
    this.basePivot.add(rotatingDeck);

    for (const x of [-18, 18]) {
      const sidePlate = this.makeServoSidePlate(40, 43, 3.4, wood, woodEdge);
      sidePlate.name = x < 0 ? "left-arm-servo-plate" : "right-arm-servo-plate";
      sidePlate.position.set(x, -7, 0);
      this.basePivot.add(sidePlate);
    }

    for (const z of [-17, 17]) {
      const crossMember = mesh(new THREE.BoxGeometry(39, 5, 3.2), woodEdge);
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
    const upperLink = this.makeLink(profile.links.l1, wood, woodEdge, metal);
    upperLink.name = "upper-link";
    this.shoulderPivot.add(upperLink);

    const shoulderHorn = this.makeServoHorn(15, wood, woodEdge, metal);
    shoulderHorn.name = "shoulder-servo-horn";
    shoulderHorn.position.x = -22;
    this.shoulderPivot.add(shoulderHorn);

    const shoulderLinkage = this.makeProfiledRail(
      V41_VISUAL_DIMENSIONS.parallelLinkPivotSpan,
      V41_VISUAL_DIMENSIONS.parallelLinkWidth,
      2.6,
      [0, V41_VISUAL_DIMENSIONS.parallelLinkPivotSpan],
      V41_VISUAL_DIMENSIONS.parallelLinkHoleRadius,
      wood,
      woodEdge,
    );
    shoulderLinkage.name = "parallel-linkage";
    shoulderLinkage.position.set(-14.5, 6, 4);
    this.shoulderPivot.add(shoulderLinkage);

    this.elbowPivot.position.z = profile.links.l1;
    this.elbowPivot.name = "elbow-pivot";
    this.shoulderPivot.add(this.elbowPivot);
    this.elbowPivot.add(this.makeJoint(joint, metal, 8.5, 35));
    const forearmLink = this.makeLink(profile.links.l2, wood, woodEdge, metal);
    forearmLink.name = "forearm-link";
    this.elbowPivot.add(forearmLink);

    const elbowHorn = this.makeServoHorn(14, wood, woodEdge, metal);
    elbowHorn.name = "elbow-servo-horn";
    elbowHorn.position.x = 18;
    this.elbowPivot.add(elbowHorn);

    const forearmLinkage = this.makeProfiledRail(
      V41_VISUAL_DIMENSIONS.parallelLinkPivotSpan,
      V41_VISUAL_DIMENSIONS.parallelLinkWidth,
      2.4,
      [0, V41_VISUAL_DIMENSIONS.parallelLinkPivotSpan],
      V41_VISUAL_DIMENSIONS.parallelLinkHoleRadius,
      wood,
      woodEdge,
    );
    forearmLinkage.name = "forearm-parallel-linkage";
    forearmLinkage.position.set(14.5, -5.5, 3);
    this.elbowPivot.add(forearmLinkage);

    this.wrist.position.z = profile.links.l2;
    this.wrist.name = "wrist-assembly";
    this.elbowPivot.add(this.wrist);
    this.wrist.add(this.makeJoint(joint, metal, 7.2, 31));

    const handLength = Math.max(profile.links.l3, 8);
    const hand = this.makeWristPlate(31, handLength, 3.2, wood, woodEdge);
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

    const palm = this.makeGripperPlate(34, 15, 3.6, claw, woodEdge);
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
    this.leftFinger.add(this.makeFinger(claw, woodEdge, metal, "left"));
    this.rightFinger.add(this.makeFinger(claw, woodEdge, metal, "right"));

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

  private makeLayeredHorizontalPlate(
    shapeFactory: () => THREE.Shape,
    thickness: number,
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();
    const coreGeometry = extrudedShapeGeometry(shapeFactory(), thickness);
    coreGeometry.center();
    const core = mesh(coreGeometry, edgeMaterial);
    core.rotation.x = Math.PI / 2;
    group.add(core);

    for (const side of [-1, 1]) {
      const faceGeometry = extrudedShapeGeometry(shapeFactory(), 0.34);
      faceGeometry.center();
      const face = mesh(faceGeometry, surfaceMaterial);
      face.rotation.x = Math.PI / 2;
      face.position.y = side * (thickness / 2 + 0.08);
      group.add(face);
    }
    return group;
  }

  private makeLayeredVerticalPlate(
    shapeFactory: () => THREE.Shape,
    thickness: number,
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();
    const coreGeometry = extrudedShapeGeometry(shapeFactory(), thickness);
    coreGeometry.center();
    const core = mesh(coreGeometry, edgeMaterial);
    core.rotation.y = Math.PI / 2;
    group.add(core);

    for (const side of [-1, 1]) {
      const faceGeometry = extrudedShapeGeometry(shapeFactory(), 0.34);
      faceGeometry.center();
      const face = mesh(faceGeometry, surfaceMaterial);
      face.rotation.y = Math.PI / 2;
      face.position.x = side * (thickness / 2 + 0.08);
      group.add(face);
    }
    return group;
  }

  private makeMountingPlate(
    width: number,
    depth: number,
    thickness: number,
    includeServoCutout: boolean,
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
  ): THREE.Group {
    const shapeFactory = (): THREE.Shape => {
      const shape = roundedRectangleShape(width, depth, Math.min(6, width * 0.1));
      const x = width / 2 - Math.min(8, width * 0.16);
      const y = depth / 2 - Math.min(8, depth * 0.16);
      for (const [holeX, holeY] of [[-x, -y], [x, -y], [-x, y], [x, y]] as const) {
        addCircularHole(shape, holeX, holeY, 2.1);
      }
      if (includeServoCutout) {
        addRectangularHole(shape, 0, 0, Math.min(30, width * 0.42), Math.min(40, depth * 0.54));
        addRectangularHole(shape, -width * 0.32, 0, 8, 3.1);
        addRectangularHole(shape, width * 0.32, 0, 8, 3.1);
      } else {
        addCircularHole(shape, 0, 0, 6.2);
      }
      return shape;
    };
    return this.makeLayeredHorizontalPlate(shapeFactory, thickness, surfaceMaterial, edgeMaterial);
  }

  private makeServoSidePlate(
    depth: number,
    height: number,
    thickness: number,
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
  ): THREE.Group {
    const shapeFactory = (): THREE.Shape => {
      const shape = roundedRectangleShape(depth, height, 4);
      const x = depth / 2 - 5.2;
      const y = height / 2 - 5.2;
      for (const [holeX, holeY] of [[-x, -y], [x, -y], [-x, y], [x, y]] as const) {
        addCircularHole(shape, holeX, holeY, 1.7);
      }
      addRectangularHole(shape, 0, 0, Math.min(22, depth - 12), Math.min(29, height - 12));
      return shape;
    };
    return this.makeLayeredVerticalPlate(shapeFactory, thickness, surfaceMaterial, edgeMaterial);
  }

  private makeRotatingDeck(
    width: number,
    depth: number,
    thickness: number,
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
  ): THREE.Group {
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const spineHalfWidth = 14;
    const servoBayHalfDepth = 17.5;
    const shapeFactory = (): THREE.Shape => {
      // The v4.1 base is an open cross-frame. Its side bays clear the two
      // horizontal shoulder/elbow servo bodies while the front and rear rails
      // still connect the paired upright plates.
      const shape = new THREE.Shape();
      shape.moveTo(-halfWidth, -halfDepth);
      shape.lineTo(halfWidth, -halfDepth);
      shape.lineTo(halfWidth, -servoBayHalfDepth);
      shape.lineTo(spineHalfWidth, -servoBayHalfDepth);
      shape.lineTo(spineHalfWidth, servoBayHalfDepth);
      shape.lineTo(halfWidth, servoBayHalfDepth);
      shape.lineTo(halfWidth, halfDepth);
      shape.lineTo(-halfWidth, halfDepth);
      shape.lineTo(-halfWidth, servoBayHalfDepth);
      shape.lineTo(-spineHalfWidth, servoBayHalfDepth);
      shape.lineTo(-spineHalfWidth, -servoBayHalfDepth);
      shape.lineTo(-halfWidth, -servoBayHalfDepth);
      shape.closePath();
      addCircularHole(shape, 0, 0, 6.2);
      return shape;
    };
    const deck = this.makeLayeredHorizontalPlate(shapeFactory, thickness, surfaceMaterial, edgeMaterial);
    deck.children[0]!.name = "rotating-deck-core";
    return deck;
  }

  private makeWristPlate(
    width: number,
    depth: number,
    thickness: number,
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
  ): THREE.Group {
    const shapeFactory = (): THREE.Shape => {
      const shape = roundedRectangleShape(width, depth, 3.2);
      const y = Math.max(0, depth / 2 - 4.2);
      for (const [holeX, holeY] of [[-10.5, -y], [10.5, -y], [-10.5, y], [10.5, y]] as const) {
        addCircularHole(shape, holeX, holeY, 1.45);
      }
      addRectangularHole(shape, 0, 0, Math.min(10, width * 0.35), Math.min(7, depth * 0.32));
      return shape;
    };
    return this.makeLayeredHorizontalPlate(shapeFactory, thickness, surfaceMaterial, edgeMaterial);
  }

  private makeGripperPlate(
    width: number,
    depth: number,
    thickness: number,
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
  ): THREE.Group {
    const shapeFactory = (): THREE.Shape => {
      const shape = roundedRectangleShape(width, depth, 3);
      for (const x of [-11, 11]) addCircularHole(shape, x, 0, 2.25);
      addRectangularHole(shape, 0, 0, 6.5, 4.2);
      return shape;
    };
    return this.makeLayeredHorizontalPlate(shapeFactory, thickness, surfaceMaterial, edgeMaterial);
  }

  private makeLink(
    length: number,
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
    metalMaterial: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();
    for (const x of [-9, 9]) {
      const holes = x < 0
        ? [0, Math.min(V41_VISUAL_DIMENSIONS.principalIntermediatePivot, length * 0.4), length]
        : [0, length];
      const rail = this.makeProfiledRail(
        length,
        V41_VISUAL_DIMENSIONS.principalPlateWidth,
        V41_VISUAL_DIMENSIONS.plateThickness,
        holes,
        V41_VISUAL_DIMENSIONS.principalPivotHoleRadius,
        surfaceMaterial,
        edgeMaterial,
      );
      rail.position.x = x;
      group.add(rail);
    }

    const crossWeb = mesh(new THREE.BoxGeometry(22, 9, 3.2), edgeMaterial);
    crossWeb.name = "main-arm-cross-web";
    crossWeb.position.set(0, 0, length * 0.52);
    group.add(crossWeb);

    for (const amount of [0.32, 0.68]) {
      const spacer = mesh(new THREE.CylinderGeometry(2.1, 2.1, 22, 12), metalMaterial);
      spacer.rotation.z = Math.PI / 2;
      spacer.position.z = length * amount;
      group.add(spacer);
    }
    return group;
  }

  private makeProfiledRail(
    length: number,
    width: number,
    thickness: number,
    holePositions: number[],
    holeRadius: number,
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
  ): THREE.Group {
    const startRadius = Math.max(width * 0.82, holeRadius + 1.8);
    const endRadius = Math.max(width * 0.66, holeRadius + 1.8);
    const halfWidth = width / 2;
    const shapeFactory = (): THREE.Shape => {
      const shape = new THREE.Shape();
      shape.moveTo(0, -startRadius);
      shape.quadraticCurveTo(-startRadius, -startRadius, -startRadius, 0);
      shape.quadraticCurveTo(-startRadius, startRadius, 0, startRadius);
      shape.quadraticCurveTo(startRadius * 0.75, startRadius, startRadius * 1.35, halfWidth);
      shape.lineTo(length - endRadius * 1.35, halfWidth);
      shape.quadraticCurveTo(length - endRadius * 0.75, endRadius, length, endRadius);
      shape.quadraticCurveTo(length + endRadius, endRadius, length + endRadius, 0);
      shape.quadraticCurveTo(length + endRadius, -endRadius, length, -endRadius);
      shape.quadraticCurveTo(length - endRadius * 0.75, -endRadius, length - endRadius * 1.35, -halfWidth);
      shape.lineTo(startRadius * 1.35, -halfWidth);
      shape.quadraticCurveTo(startRadius * 0.75, -startRadius, 0, -startRadius);
      shape.closePath();
      for (const position of holePositions) addCircularHole(shape, position, 0, holeRadius);
      return shape;
    };

    const group = new THREE.Group();
    const coreGeometry = extrudedShapeGeometry(shapeFactory(), thickness);
    coreGeometry.translate(0, 0, -thickness / 2);
    const core = mesh(coreGeometry, edgeMaterial);
    core.rotation.y = -Math.PI / 2;
    group.add(core);

    for (const side of [-1, 1]) {
      const faceGeometry = extrudedShapeGeometry(shapeFactory(), 0.34);
      faceGeometry.translate(0, 0, -0.17);
      const face = mesh(faceGeometry, surfaceMaterial);
      face.rotation.y = -Math.PI / 2;
      face.position.x = side * (thickness / 2 + 0.08);
      group.add(face);
    }
    return group;
  }

  private makeServoHorn(
    length: number,
    surfaceMaterial: THREE.Material,
    edgeMaterial: THREE.Material,
    metalMaterial: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();
    const splinedDisc = mesh(gearGeometry(5.2, 12, 2.2), surfaceMaterial);
    splinedDisc.rotation.y = Math.PI / 2;
    group.add(splinedDisc);

    const horn = this.makeProfiledRail(length, 4.2, 2, [0, length], 1.1, surfaceMaterial, edgeMaterial);
    group.add(horn);

    const hub = mesh(new THREE.CylinderGeometry(2.3, 2.3, 3, 16), metalMaterial);
    hub.rotation.z = Math.PI / 2;
    group.add(hub);
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

  private makeBaseServo(
    width: number,
    height: number,
    depth: number,
    bodyMaterial: THREE.Material,
    labelMaterial: THREE.Material,
    metalMaterial: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();

    // The base servo is mounted below the fixed plate with a vertical output
    // shaft. Keeping the body beneath the yaw deck prevents it from entering
    // the rotating assembly's sweep.
    const body = mesh(new THREE.BoxGeometry(width, height, depth), bodyMaterial);
    body.name = "base-servo-body";
    body.position.y = -height / 2 - 4;
    group.add(body);

    const flange = mesh(new THREE.BoxGeometry(width + 7, 3.2, depth + 4), bodyMaterial);
    flange.name = "base-servo-flange";
    flange.position.y = -3.5;
    group.add(flange);

    const label = mesh(new THREE.BoxGeometry(width * 0.52, height * 0.48, 0.45), labelMaterial);
    label.position.set(0, -height * 0.58, depth / 2 + 0.24);
    group.add(label);

    const hub = mesh(new THREE.CylinderGeometry(5, 5, 4.8, 22), metalMaterial);
    hub.name = "base-drive-hub";
    hub.position.y = 1.5;
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
