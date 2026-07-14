# UI refinement changelog

## 2026-07-14: engineering-workspace refinement

Implemented the adopted design principles below across the workspace chrome.
The 3D scene, parser, kinematics, timeline, playback, clipboard, and settings
behavior are unchanged; every existing control keeps its element id, event
wiring, and accessible name.

### Status bar consolidation

- Added a single slim status bar across the bottom of the application (VS
  Code pattern) containing the validity state, the preview state ("Preview
  current" / "Changes not previewed"), the compile message with command
  count, the current robot pose, the camera view, the line count, keyboard
  and orbit hints, and the axis color key.
- Removed the editor footer and the viewport camera/pose overlay; their
  contents moved into the status bar.
- The validity pill moved from the inspector header into the status bar and
  remains the polite live region.
- Success compile messages now announce through a visually collapsed live
  region instead of the previous green banner strip; warning and error
  diagnostics keep the visible line-linked strip above the editor.

### Viewport toolbar

- Fit, Reset, Path, Task space, Grid, and Axes are now icon-only controls
  with tooltips. Their text labels remain in the markup as visually hidden
  accessible names. The camera preset dropdown keeps its visible label.
- Pressed toggles keep the filled light-blue tint with no blue outline.

### Playback transport

- Back, Restart, Play/Pause, and Next are now a compact icon transport
  cluster; only Play carries the accent fill. The Play button swaps
  play/pause icons and updates its accessible name and pressed state.
- The playback-settings section merged into the transport row: the speed
  select and Repeat checkbox sit beside the transport buttons.

### Execution timeline

- The scrubber now shows waypoint tick marks at the completion time of each
  movement command, colored to match the motion path (muted indigo) so the
  timeline cross-references the viewport.

### Inspector density

- Section labels are 11 px uppercase; value rows use tighter engineering
  spacing.
- Current command, Claw position, Joint angles, and Preset commands are
  collapsible sections (native details/summary, default open). Playback,
  the execution timeline, and the physical-robot safety notice are always
  visible.
- The source-line link moved beside the current command readout.

### Preset commands

- Approved poses render as compact monospace chips (HOME, LEFT, RIGHT,
  HIGH, LOW). The full command is available on hover and to assistive
  technology via the tooltip and accessible label, and click-to-copy
  feedback is unchanged.

### Resizable panels

- The editor and inspector panels have draggable resize handles at desktop
  widths, with keyboard support (arrow keys) and clamped widths. Medium and
  narrow stacked layouts are unchanged and hide the handles.

### Tokens

- Chrome corner radii tightened to 4 px controls and 3 px small elements.
- Added a `--path-color` token for the scene's motion-path indigo so chrome
  references stay consistent.

### Verification

- All 51 automated tests across 10 files pass; strict TypeScript checking,
  the production build, and offline asset/CSS verification pass.
- Development-browser checks at 1440 × 900, 1280 × 800, 1024 × 800, and
  390 × 844 confirmed: no horizontal overflow and no console errors; play,
  pause, and transport stepping; section collapse and re-open; keyboard and
  pointer panel resizing; icon-toggle accessible names; chip copy feedback;
  and the error flow (line-linked strip, status-bar mirror, disabled
  playback) with recovery.

## 2026-07-14: adopted UI design principles

The following principles govern the next round of interface refinement. They
were adapted from an external design-principles draft against the current
0.9.0 interface. The goal: an interface that reads as professional engineering
software (Onshape, Foxglove, VS Code) calibrated for high-school students —
real, not toy-like. Litmus test: would a student screenshot this and believe
it is software engineers actually use?

### Scope and constraints

- Applies to the workspace chrome only: header, editor column, viewport
  toolbar and status row, inspector, and dialogs.
- The 3D scene is out of scope: the arm model, materials, motion path,
  task-space envelope, grid, axes, coordinate labels, and target marker stay
  exactly as shipped.
- No new runtime dependencies; Three.js remains the only production
  dependency. Icons are inline SVG; tooltips are native or CSS.
- The native textarea remains the editable, accessible editor control.
- Existing accessibility contracts are a floor, not a target: accessible
  names on every control, `:focus-visible` indicators, reduced-motion
  support, touch-target sizes, and live status announcements. Refinements
  must pass the automated interface-contract tests or update them
  deliberately.

### Color: one accent; every color means exactly one thing

| Role | Color | Usage |
| --- | --- | --- |
| Accent / interaction | `#1F6FEB` | Primary buttons, active states, selection, execution progress |
| Accent hover/pressed | `#1A5FC9` | Darker step of the accent |
| Active toggle fill | `#DDEBFD`, text `#0C447C` | Pressed toolbar toggles — filled tint, never a blue outline |
| Chrome / background | `#F5F6F8` family | Cool-tinted neutral grays, never warm |
| X / Y / Z axes | Red / Green / Blue | Reserved; semantic "Valid" green is the only other green |
| Task-space envelope | `#4FA8B3` (scene, fixed) | Never reused in chrome |
| Motion path | `#7568C5` muted indigo (scene, fixed) | Never reused in chrome |

- If a color could be confused with an axis, it is the wrong color.
- Saturation is for meaning; large surfaces stay desaturated.
- When chrome references a scene entity (waypoint ticks, path mentions), it
  echoes the scene color rather than the accent, so the viewport and panels
  stay cross-referenced without repainting the scene. The original draft's
  accent-colored path and amber end-effector were dropped because both would
  require scene changes.

### Hierarchy and density

- Contrast in size and loudness: a few large, prominent elements (viewport,
  Play) and many small, quiet ones. Uniform medium-sized controls are the
  biggest "generated UI" tell.
- The inspector stays dense: 11–12 px uppercase section labels, roughly
  28 px rows, collapsible sections, and monospace numbers right-aligned with
  lower-contrast units.
- One primary button per region; everything else is secondary (outlined) or
  ghost.

### Controls

- Icon-only toggle clusters with tooltips in the viewport toolbar, replacing
  the labeled pills. Pressed state is a filled tint. Every icon-only control
  keeps an accessible name.
- Transport-style playback: a compact icon cluster (back / restart / play /
  next / speed) where only Play carries the accent fill.
- Timeline with waypoint tick marks so the scrubber doubles as a teaching
  tool; the playback sampler already extracts unique destinations.
- Group with hairline dividers and background shading, not boxes inside
  boxes. Corner radius 2–4 px on chrome.

### Structure

- Three resizable panels (editor, 3D viewport, inspector) with drag handles
  at desktop widths only; the existing medium and narrow stacking layouts are
  preserved.
- One slim status bar (VS Code pattern) consolidating validity, command
  count, line count, current pose, and camera view — absorbing the
  commands-ready strip, the editor line-count footer, and the viewport
  camera caption. Two carve-outs: parser and kinematic diagnostics keep
  their line-linked presentation near the editor, and the physical-safety
  notice remains visible in the inspector as a product safety requirement.
- Presets render as compact monospace chips; hover reveals the full command
  and click copies. The full command stays reachable without hover, and copy
  feedback remains visibly and audibly announced per existing contracts.

### North stars

| Reference | Steal this |
| --- | --- |
| Wokwi | Overall restraint; closest product category |
| Foxglove Studio | Inspector-panel density for live robot state |
| Onshape | Viewport toolbar: view dropdown, icon toggle clusters |
| VS Code | Status bar; code-editor conventions |
| Tinkercad Circuits | Lower bound — we lean more "real tool" |

## 2026-07-13: education-first workspace refinement

The MeArm Classroom Motion Lab interface was refined into a more compact,
engineering-oriented workspace. The work was intentionally visual and preserves
the existing editor, parser, playback, kinematics, robot state, and simulation
data flow.

## Application shell

- Rebalanced the desktop workspace around the existing editor, viewport, and
  inspector columns, with the 3D canvas remaining the dominant region.
- Replaced broadly green-tinted surfaces with white and cool neutral gray.
- Uses engineering blue (`#1F6FEB`) for primary actions, active controls,
  selections, focus indicators, and current execution progress. Green is
  reserved for semantic valid and success states.
- Reduced card treatments, corner radii, decorative spacing, and shadows in
  favor of flat panels and precise 1 px separators.
- Preserved the existing medium-screen and small-screen stacking behavior.

## Code editor

- Refined the editor into a focused IDE-style surface with synchronized syntax
  highlighting for Arduino comments, directives, types, functions, literals,
  numbers, strings, and operators.
- Preserved the native textarea as the editable and accessible control, including
  line numbers, selection, scrolling, keyboard behavior, and active-line state.
- Flattened preview readiness and diagnostic messages into compact status strips.
- Kept the preview shortcut and editor metadata visible but understated.

## 3D viewport

- Changed the scene and floor treatment to neutral engineering-canvas colors.
- Increased visual separation between the robot, motion path, axes, grid, and
  background without adding visual effects.
- Replaced the large floating controls with a compact viewport toolbar containing
  Fit, Reset, camera presets, Path, Grid, and Axes controls.
- Added a compact camera-state/status bar and retained keyboard-accessible names
  and tooltips for viewport controls.
- Added visible X, Y, and Z axis labels and a small color key.
- Added coordinate labels for the unique points travelled by the arm during the
  parsed program.

## Simulation inspector

- Reorganized the inspector into flat sections for simulation status, current
  command, claw position, joint angles, playback, settings, execution timeline,
  and physical-robot safety.
- Kept the validation state as a compact status pill and retained the existing
  live status announcement.
- Aligned coordinate and joint values in compact engineering rows using tabular
  monospace numerals and separate, lower-contrast units.
- Kept Play/Pause as the primary action while Back, Restart, and Next remain
  neutral controls.
- Refined the timeline into an execution scrubber with distinct elapsed and total
  timing labels.
- Reduced the safety notice's visual weight while keeping it visible in the
  normal desktop inspector height.
- Added an explicit three-column inspector layout at medium widths and a
  single-column layout on narrow screens without changing control order.

## Implementation files

- `index.html`: application metadata and shell presentation support.
- `src/app/highlight.ts`: safe Arduino syntax-highlighting output.
- `src/main.ts`: refined workspace markup, viewport controls, coordinate labels,
  and inspector presentation.
- `src/styles.css`: neutral design tokens, compact component treatments, and
  responsive layouts.
- `src/viewer/arm-model.ts`: refined robot material contrast.
- `src/viewer/playback.ts`: extraction of travelled coordinates for display.
- `src/viewer/scene.ts`: viewport tools, camera presets, axes, and coordinate
  label rendering.
- `tests/highlight.test.ts` and `tests/playback.test.ts`: coverage for syntax
  highlighting and travelled-coordinate extraction.

## Preserved behavior

- No new UI framework or runtime dependency was introduced.
- No playback controls, timing calculations, command parsing rules, kinematic
  calculations, robot motion, or public component APIs were changed.
- No gradients, glass effects, large shadows, decorative animation, or
  placeholder controls were added.
- Accessibility labels, focus indicators, live status text, reduced-motion
  behavior, and touch target rules remain in place.

## Verification

- All 50 automated tests across 10 test files pass after the follow-up feature
  work described below.
- Strict TypeScript checking passes.
- The optimized Vite production build passes.
- The final inspector was visually checked at 1280 x 720, 1024 x 800, and
  375 x 812 with no horizontal overflow or browser console errors.
- Play/Pause and previous/next command interaction smoke checks pass.

The existing Vite advisory for the uncompressed Three.js bundle remains a
non-blocking performance notice and is unrelated to these UI refinements.

## 2026-07-13: classroom editing follow-up

- Added copyable HOME, LEFT, RIGHT, HIGH, LOW, common delay, and open/close claw
  commands to the inspector.
- Added a minimal Free form example with inclusive X `-100..100`, Y `100..200`,
  and Z `0..150` millimeter validation and an on-canvas limits reminder.
- Added Reset code for restoring the active bundled example.
- Added accessible, clickable command checkpoints in the editor gutter.
- Changed startup and repeat defaults so playback begins paused and repeat is
  opt-in.
- Added automated contracts for the new controls, clipboard wiring, bounds,
  and command navigation.

These follow-up flows have automated coverage. They remain listed in
`VALIDATION_REPORT.md` for an explicit final production-browser pass.

## 2026-07-13: engineering blue colorway

- Updated Preview code and Play/Pause to solid engineering blue (`#1F6FEB`),
  with `#1A5FC9` for hover states.
- Updated pressed viewport toolbar controls to a light blue (`#DDEBFD`) with
  dark blue text (`#0C447C`).
- Retained green for valid and success states, plus the existing warning,
  danger, and axis colors.
- Set the reachable task-space surface and grid to muted cyan (`#4FA8B3`) so
  the visualization remains distinct from both engineering-blue controls and
  semantic status colors.
- Set the motion path to muted indigo (`#7568C5`) so it stays distinct from the
  task-space volume, controls, axes, and semantic status colors.
- Shifted the application chrome to the cool neutral `#F5F6F8` background.
- Changed presentation colors only; layout, content, interaction, and simulation
  behavior are unchanged.
