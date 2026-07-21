# Product specification

## Purpose

MeArm Classroom Motion Lab gives a student an immediate visual answer to:
“What will my robot do?” It also gives an instructor a quick first-pass
check for unreachable poses and unexpected command order before code reaches
classroom hardware.

The viewer is a teaching and preview tool. It is not a guarantee that a motion
is physically safe.

## Primary users

### Student

A beginner who edits a small Arduino sketch containing sequential movement,
claw, and delay commands. The student should not need to understand inverse
kinematics, servo angles, or 3D software.

### Instructor

An adult who wants to review a sketch, see its complete repeated motion, locate
the command responsible for a pose, and identify warnings before upload.

## Core workflow

1. Open the viewer.
2. Edit a supported `.ino` sketch or load one of the eight bundled examples.
3. Select **Preview code** or press Ctrl/Command + Enter.
4. If parsing succeeds, see the arm at its initial/home pose and a timeline of
   commands.
5. Play, pause, scrub, restart, or change playback speed.
6. Scrub the timeline, use Back/Next, or select a gutter checkpoint to inspect
   a command and its source line.
7. Review any reachability, servo-limit, or “not physically verified” warnings.
8. Return to the Arduino editor for changes and repeat.

## Functional requirements

### Sketch input

- Provide a plain-text code editor or paste area.
- Ship with Instructor dance, Student starter, Pick and place, Pre-programmed
  sorting line, Palletizing, House shape dance, Cyberpunk beat dance, and Free
  form examples.
- Use custom non-preset work, standby, inspection, and transfer coordinates in
  the three industrial examples. The required `begin()` initialization may
  still place the arm at the configured HOME position.
- In Free form mode, reject movement coordinates outside the inclusive X
  `-100..100`, Y `100..200`, and Z `0..150` millimeter envelope before normal
  kinematic validation.
- Parse only the documented subset in `SKETCH_LANGUAGE.md`.
- Never execute pasted JavaScript, C++, HTML, or arbitrary expressions.
- Report an unsupported statement with its line number and a beginner-friendly
  explanation.
- Ignore commands that are inside comments.

### 3D scene

- Show a recognizable four-servo MeArm: base, upper arm, forearm, hand, and
  claw.
- Use the source library coordinate system:
  - `x`: left/right,
  - `y`: forward/back from the base,
  - `z`: height relative to the shoulder/base reference plane.
- Show axes and a ground/reference grid that can be hidden.
- Allow orbit, zoom, and reset-camera actions.
- Keep the arm visually readable on classroom projectors and small laptops.
- Provide fit/reset actions and Isometric, Front, Back, Left, Right, and Top
  camera presets.
- Label unique movement destinations with their X/Y/Z coordinates.

### Playback

- Provide play, pause, restart, single-command step, and timeline scrubbing.
- Provide at least `0.25x`, `0.5x`, `1x`, `2x`, and `4x` speeds.
- Match the timing semantics documented in `SKETCH_LANGUAGE.md` at `1x`.
- Repeat `loop()` continuously when repeat is enabled.
- Clearly distinguish robot movement time from explicit `delay()` time.
- Animate the claw opening and closing.

### Feedback

- Display the current Cartesian position in millimeters.
- Display base, shoulder, and elbow angles in degrees.
- Display the current source line and command.
- Draw an optional trail for the claw target.
- Mark commands as valid, warning, unsupported, or invalid.
- Keep warnings visible when playback is paused or scrubbed.
- Link parsed commands to clickable source-gutter checkpoints.
- Provide copyable complete commands for approved poses, common delays, and
  open/close claw actions.

### Configuration

- Begin with the adjacent MeArm library defaults.
- Allow an instructor to change `L1`, `L2`, `L3`, home position, and servo-angle
  limits.
- Provide a one-click reset to documented defaults.
- Label custom values as a simulation profile, not as hardware calibration.

## Warning levels

| Level | Meaning | Playback behavior |
| --- | --- | --- |
| Valid | Math and configured limits accept the command | Animate normally |
| Caution | Math accepts it, but it is not on the instructor-approved pose list | Animate with a visible caution |
| Invalid | IK fails or a configured servo angle is exceeded | Stop before the command by default |
| Unsupported | The parser cannot safely interpret the source | Do not build a timeline |

Invalid motion truncates the normal timeline at the first invalid command.
Unsupported code prevents timeline creation, and playback remains disabled
until a valid preview is built.

## Accessibility and classroom usability

- Do not rely on color alone for status.
- All controls must be keyboard reachable.
- Provide textual status alongside 3D motion.
- Respect reduced-motion preferences where practical.
- Use plain language suitable for a first programming lesson.
- Preserve code line numbers and avoid automatically rewriting student code.

## Acceptance criteria for the first release

- All eight bundled examples build valid previews; comments do not create false
  commands in the classroom lesson sketches.
- HOME, LEFT, RIGHT, HIGH, and LOW animate to their documented coordinates.
- The displayed endpoint is within 0.5 mm of the requested valid target.
- At `1x`, command timing agrees with the source library model within one
  animation frame plus 10 ms.
- Unreachable coordinates produce an actionable line-numbered error.
- Refreshing a locally served production build restores a working sample
  without an external network request.
- A production build opens without console errors in the supported browsers.

## Future possibilities

- Open local `.ino` files with the browser file picker.
- Export a motion report for instructor review.
- Use Web Serial to display telemetry from a connected Arduino.
- Compare requested motion with measured or reported servo positions.
- Add optional collision volumes after the physical MeArm geometry is measured.

Future features must not delay the small, offline-capable first release.
