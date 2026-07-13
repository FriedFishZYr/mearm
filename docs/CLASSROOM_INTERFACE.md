# Classroom interface

## Code workflow

The **Example** menu provides three starting sketches:

| Example | Intended use | Additional validation |
| --- | --- | --- |
| Instructor dance | Complete demonstration sequence | Approved-pose cautions plus normal kinematics and limits |
| Student starter | Guided editing exercise with commented pose menu | Approved-pose cautions plus normal kinematics and limits |
| Free form | Minimal sketch for coordinate exploration | X `-100..100`, Y `100..200`, Z `0..150` mm, then normal kinematics and limits |

Selecting an example replaces the editor content and immediately builds a
preview. Editing changes the menu label to **Edited sketch** and marks the
preview as out of date. **Reset code** restores the original source for the
active example.

Select **Preview code** or press Ctrl/Command + Enter to:

1. validate the active simulation profile;
2. tokenize and parse the documented Arduino subset;
3. apply Free form bounds when that example is active;
4. build and validate the deterministic motion timeline;
5. recreate the 3D arm for the current link lengths; and
6. draw the path, command markers, coordinate labels, and first frame.

Pasted source is never executed as JavaScript or arbitrary C++. Playback is
paused by default and repetition is opt-in.

## Editor and source navigation

The code area uses a native textarea over an escaped syntax-highlight layer.
Line numbers remain synchronized with editing and scrolling.

After a successful preview, executable `loop()` lines receive clickable command
markers in the gutter. A marker pauses playback and jumps to the start of that
command. If several commands share a line, the marker targets the first one.
The inspector's **Line N · Command X of Y** link selects the corresponding
source line and returns focus to the editor.

Parser and Free form bound errors show a line-linked message and select the
relevant source. Unsupported syntax prevents preview creation. An invalid
movement truncates the normal timeline at the first invalid point. Valid,
caution, invalid, and code-error states are conveyed with text as well as
color.

## 3D viewport

The stage provides:

- mouse or touch orbit and zoom through Three.js OrbitControls;
- **Fit** and **Reset** camera actions;
- Isometric, Front, Back, Left, Right, and Top camera presets;
- independent Path, Grid, and Axes visibility controls;
- an independent **Task space** control for the servo-limited reachable volume;
- X/Y/Z axis labels and a color key; and
- coordinate labels for unique destinations in the current path.

The 3D canvas is accompanied by the motion inspector, so command, position,
joint angle, timing, and status information remains available as text.

The task-space surface is hidden initially to preserve a clear arm view. When
shown, **Fit** includes it in the camera framing. Applying instructor geometry
or servo-limit settings rebuilds the surface from the new in-memory profile.
It is a mathematical reach envelope, not a physical clearance or safety map.

## Playback and inspection

The inspector provides:

- Play/Pause, Restart, Back, and Next;
- timeline scrubbing;
- `0.25x`, `0.5x`, `1x`, `2x`, and `4x` speeds;
- optional loop repetition;
- elapsed and total simulated time;
- current command and source location;
- claw X/Y/Z coordinates and base/shoulder/elbow angles; and
- a persistent physical-robot safety reminder.

Space toggles playback when focus is not in the editor, a text/number input, or
a select. Scrubbing or jumping to a command pauses playback. Editing while a
preview is stale triggers recompilation before Play can continue.

## Copyable classroom commands

The **Preset commands** section copies complete `arm.moveToXYZ(...)` statements
for HOME, LEFT, RIGHT, HIGH, and LOW. It also copies `delay(...)` statements for
250, 500, 1000, and 2000 milliseconds, plus `arm.openClaw();` and
`arm.closeClaw();`. Copy status is announced in a live status region, and a
fallback copy path is used when the Clipboard API is not available.

Presets are editing aids, not proof of physical safety. The approved pose list
comes from the default profile and must still be checked on the classroom arm.

## Instructor settings

The modal settings dialog exposes:

- `L1`, `L2`, and `L3` in millimeters;
- HOME `x`, `y`, and `z` in millimeters; and
- minimum and maximum base, shoulder, and elbow angles in degrees.

Values must be finite, `L1` and `L2` must be positive, `L3` must be
non-negative, and each minimum must not exceed its maximum. **Reset defaults**
restores the MeArm v3 classroom values in the form; **Apply and preview**
validates them, rebuilds the timeline, and recreates the arm.

These values change only the current in-memory simulation. They are not saved,
sent to an Arduino, or described as hardware calibration.

## Responsive and accessible behavior

- Desktop uses adjacent editor, scene, and inspector regions.
- Medium layouts reorganize the inspector while keeping all controls.
- Narrow layouts stack the workspace and preserve touch-sized controls.
- Interactive elements have visible keyboard focus indicators.
- The editor, gutter markers, timeline, canvas, toolbars, status regions, and
  settings fields have programmatic labels.
- Status meaning never depends on color alone.
- The app starts paused for all users, including reduced-motion users.

Automated contracts cover required controls, labels, focus CSS, responsive
rules, and offline assets. Manual keyboard-only, assistive-technology,
cross-browser, and touch validation remains recommended before broad classroom
deployment; see [VALIDATION_REPORT.md](VALIDATION_REPORT.md).
