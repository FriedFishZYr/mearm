# Classroom interface

## Code workflow

The interface ships with the instructor dance and student starter sketches.
Selecting a sample loads its complete source into a native text editor. Editing
the source changes the sample label to “Edited sketch” and marks the preview as
out of date.

Selecting **Preview code** or pressing Ctrl/Command + Enter performs the full
safe pipeline:

1. Validate the active robot profile.
2. Tokenize and parse the documented Arduino subset.
3. Build and validate the deterministic motion timeline.
4. Recreate the 3D arm for the active link lengths.
5. Draw the new path and reset playback to the first command.

Pasted source is never executed as JavaScript or arbitrary C++.

## Diagnostics and source linking

Parser errors include their source line and column. The message appears above
the editor and the relevant source line is selected automatically. During
playback, the current command's line number is highlighted in the gutter. The
line link in the inspector returns keyboard focus and selection to that command.

Unsupported syntax stops preview creation. Invalid motion stops the normal
timeline at the first invalid command. Caution and invalid states use both text
and color.

## Playback controls

The classroom interface provides:

- play and pause,
- restart,
- previous- and next-command stepping,
- timeline scrubbing,
- `0.25x`, `0.5x`, `1x`, `2x`, and `4x` speeds,
- optional loop repetition,
- Space keyboard shortcut when focus is outside an input or editor.

Users who prefer reduced motion begin with playback paused.

## Instructor settings

The settings dialog changes only the simulation profile. It supports:

- `L1`, `L2`, and `L3` in millimeters,
- HOME `x`, `y`, and `z` in millimeters,
- minimum and maximum base, shoulder, and elbow angles in degrees.

Values must be finite, link lengths and timing values must be positive, `L3`
must be non-negative, and each minimum must not exceed its maximum. Applying a
profile reparses the current sketch and rebuilds both timeline and arm geometry.

**Reset defaults** restores the documented MeArm v3 classroom profile. Settings
are deliberately not described as hardware calibration and are not sent to the
Arduino.

## Responsive and accessible behavior

- Desktop uses adjacent editor, scene, and inspector regions.
- Medium screens place the inspector below the editor and scene.
- Small screens stack all three regions and enlarge controls for touch.
- Every interactive element has a visible keyboard focus indicator.
- Statuses have textual labels rather than relying on color.
- The code editor has a programmatic label, line count, and linked diagnostics.
- Dialog fields use visible labels, groups, units, and an alert region.

Formal browser and visual accessibility validation remains part of Phase 4.
