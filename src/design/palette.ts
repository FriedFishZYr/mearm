/**
 * Single source of truth for every color that appears in more than one place.
 *
 * Why this module exists: before it, the X-axis red was written three times as
 * `#a93642` and once as `#8f2f39`, the Z-axis blue as `#246b9e` and `#205f8c`,
 * and none of them were connected to the `0x` numbers the 3D scene used. Chrome
 * and scene could drift silently because nothing tied them together.
 *
 * How it stays honest: `src/styles.css` still declares the CSS custom properties
 * statically — the production build must ship real CSS, and
 * `scripts/verify-offline.mjs` inspects the built stylesheet. This module does
 * NOT inject variables at runtime. Instead `tests/palette.test.ts` parses
 * `styles.css` and asserts every shared value matches the number declared here,
 * so the two representations cannot diverge without a red test.
 *
 * Three color kinds live here and must not be confused:
 *
 *   1. UNLIT  — round-trips exactly to its CSS hex. `three` has
 *      `ColorManagement.enabled` and the renderer sets `outputColorSpace =
 *      SRGBColorSpace` (scene.ts), so AxesHelper, GridHelper, LineBasicMaterial
 *      and `scene.background` render the literal value.
 *
 *   2. MATERIAL — an input to `MeshStandardMaterial`, rendered under a
 *      HemisphereLight at 2.25 plus a DirectionalLight at 3.2. The pixel on
 *      screen is nowhere near the literal. Never eyedrop a screenshot of the
 *      robot and paste the result into CSS.
 *
 *   3. SENTINEL — a number that is not a color at all (see `NO_EMISSIVE`).
 */

const hex = (value: number): string => `#${value.toString(16).padStart(6, "0")}`;

/**
 * Values used by BOTH the CSS chrome and the Three.js scene.
 * Each one has a matching custom property in styles.css, enforced by test.
 */
export const SHARED = {
  /** `.stage` background; also `scene.background` and the fog color. */
  surfaceCanvas: 0xf1f3f4,
  /** Motion path line in the scene, and the timeline waypoint ticks in chrome. */
  path: 0x7568c5,
  /** Servo-limited reachable volume. */
  taskSpace: 0x4fa8b3,
  /** Spatial identity. Never reuse an axis color to mean a status. */
  axisX: 0xa93642,
  axisY: 0x246b5b,
  axisZ: 0x246b9e,
} as const;

/**
 * Arguments for `AxesHelper.setColors()`, in Three's own X/Y/Z parameter order.
 *
 * THE ORDER IS DELIBERATE AND LOOKS WRONG. Do not "tidy" it to x, y, z.
 *
 * This app is Z-up in its own coordinate space but Three is Y-up, so the viewer
 * remaps app-Z onto Three-Y and app-Y onto Three-Z (see the Vector3 construction
 * in `task-space.ts` and the label placement in `scene.ts`). `setColors` writes
 * its first argument to Three's +X, second to Three's +Y, third to Three's +Z.
 *
 * Passing (axisX, axisZ, axisY) therefore paints app-X red, app-Z blue and
 * app-Y green — which is what the axis badges in `styles.css`, the coordinate
 * chips and the status-bar key already show. Reordering these to x, y, z swaps
 * green and blue in the viewport while every label stays put, producing a green
 * line labelled Z.
 */
export const AXES_HELPER_ARGS = [SHARED.axisX, SHARED.axisZ, SHARED.axisY] as const;

/**
 * One family per validation state, with two tuned forms.
 *
 * `text` is tuned for contrast against white chrome; `scene` is tuned to read
 * correctly on the lit robot. They cannot be collapsed into one value — the
 * scene forms are far too light to pass contrast as text, and the text forms
 * disappear under the scene lights.
 */
export const STATUS = {
  valid: { text: "#246b5b", scene: 0x2f806d },
  caution: { text: "#8a5a00", scene: 0xffc857 },
  invalid: { text: "#a33a46", scene: 0xff5f6d },
} as const;

/**
 * `MeshStandardMaterial` inputs for the robot. MATERIAL colors — see kind 2.
 *
 * `servoLabel` is a decal on the servo body. It is close to `STATUS.invalid` in
 * hue and is not related to it; merging the two reds would make every servo look
 * like an error state.
 *
 * `claw` and `wood` sit deliberately close but distinct. That gap is what lets a
 * student see the gripper move against the arm behind it.
 */
export const ROBOT = {
  wood: 0xc99a61,
  woodEdge: 0x5f4028,
  servo: 0x252a2e,
  servoLabel: 0xb23a48,
  joint: 0x343b40,
  metal: 0xc8d0d5,
  claw: 0xd4a05f,
  floor: 0xf7f8f9,
} as const;

/** Lighting parameters. These describe illumination, not surface color. */
export const LIGHT = {
  sky: 0xffffff,
  ground: 0xc9ced2,
  key: 0xfff8ec,
} as const;

/** Ground grid. `line` is one step off `--border` and is intentionally its own value. */
export const GRID = {
  center: 0xa9b1b7,
  line: 0xd9dee1,
} as const;

/**
 * Not a color: the "no emission" value passed to `material.emissive.setHex()`
 * when a pose is valid. Kept named so a future color sweep does not mistake a
 * black sentinel for a brand value.
 */
export const NO_EMISSIVE = 0x000000;

/**
 * The custom properties in `styles.css` that must equal a value declared above.
 * `tests/palette.test.ts` reads the stylesheet and checks each of these.
 */
export const SHARED_CSS_TOKENS: Readonly<Record<string, string>> = {
  "--surface-canvas": hex(SHARED.surfaceCanvas),
  "--path": hex(SHARED.path),
  "--task-space": hex(SHARED.taskSpace),
  "--axis-x": hex(SHARED.axisX),
  "--axis-y": hex(SHARED.axisY),
  "--axis-z": hex(SHARED.axisZ),
  "--status-valid-text": STATUS.valid.text,
  "--status-caution-text": STATUS.caution.text,
  "--status-invalid-text": STATUS.invalid.text,
};
