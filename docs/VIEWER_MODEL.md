# 3D viewer model

## Scene coordinates

The renderer maps the source MeArm coordinate system into Three.js as follows:

| MeArm coordinate | Scene coordinate | Meaning |
| --- | --- | --- |
| `x` | `x` | left and right |
| `y` | `z` | forward from the base |
| `z` | `y`, plus visual base height | vertical |

The source origin remains the shoulder/base reference plane. A 28 mm visual
base height is added only while rendering and is removed when endpoint
coordinates are measured back in source space.

## Transform hierarchy

The model uses nested transforms for base yaw, shoulder angle, elbow angle,
wrist leveling, and the two claw fingers. The shoulder and elbow link lengths
come directly from the active robot profile.

The source forward kinematics treats `L3` as a horizontal offset. The physical
MeArm parallelogram similarly keeps the hand approximately horizontal. The
wrist transform therefore cancels the absolute elbow rotation before applying
the `L3` hand offset. Without this correction, the visual endpoint would differ
from the source kinematics even when the upper links were correct.

## Visual geometry

The arm is a lightweight assembly-inspired model rather than a CAD replica. Its
visual construction follows the MeArm v4.1 assembly language: layered flat
plates with dark cut edges, rectangular servo housings, paired structural
links, exposed pivot fasteners, parallel linkages, and a geared two-jaw-style
gripper. These details are built from procedural Three.js geometry, so the
model remains fast, profile-driven, and independent of external assets.

The added components are visual only. The mathematical shoulder, elbow, wrist,
and endpoint pivots remain the authoritative transform hierarchy, and the
assembly details do not alter kinematics or task-space calculations. The model
intentionally avoids CAD-level detail so it does not imply unverified physical
dimensions or collision accuracy.

The model includes:

- layered base, pivot plate, standoffs, and rotating arm frame,
- visible base, shoulder, elbow, and claw servo housings,
- paired upper-arm and forearm plates with secondary parallel linkages,
- exposed shoulder, elbow, and wrist pivots and fasteners,
- horizontal wrist plate and two animated, toothed claw fingers,
- glowing target marker,
- optional target path,
- optional servo-limited task-space boundary,
- optional reference grid and coordinate axes, and
- coordinate labels for unique destinations in the parsed path.

The scene also provides orbit/zoom, fit/reset, and Isometric, Front, Back,
Left, Right, and Top camera views.

## Task-space boundary

The optional **Task space** overlay maps the six faces of the active
base/shoulder/elbow servo-limit domain through the same forward kinematics used
by pose validation. The result is a translucent curved surface with a light
parameter grid. It is hidden by default so existing playback remains visually
unchanged, and it is rebuilt whenever instructor settings recreate the scene.

For the default profile, the configuration-space interior contains no
kinematic singularity, so these six mapped faces are the complete mathematical
boundary of the reachable endpoint volume. The overlay represents geometry and
configured angle limits only. It does not account for torque, collisions,
backlash, wiring, the table, or other physical restrictions.

If an instructor enters much wider limits that introduce an interior
singularity or a folded/self-overlapping kinematic map, the overlay continues
to show the mapped servo-limit surfaces; it does not attempt to reconstruct a
new outer hull from those exceptional configurations.

See [Calculating the MeArm task space](TASK_SPACE_CALCULATION.md) for the full
forward-kinematic derivation, default numeric bounds, Jacobian check, worked
example, and surface-meshing procedure.

## Playback

The renderer reads the deterministic timeline produced by the Phase 1 core.
Movement is visually interpolated between the library-equivalent 50 ms samples
so animation remains smooth while command endpoints and timing remain exact.
Claw openness is interpolated across the library's 300 ms command delay.

Playback begins paused at the setup-computed initial loop state. It plays the
active sample or edited timeline once unless the user enables **Repeat loop**.
Scrubbing, command jumps, and speed changes affect simulation time, not the
source command data.

## Status colors

- Green: valid under geometry and configured servo limits.
- Amber: mathematically valid but not on the instructor-approved pose list.
- Red: unreachable or outside configured servo limits.

Text labels accompany every status; color is not the only indicator.

## Verification

Automated transform tests solve every approved classroom pose, apply the angles
to the scene hierarchy, then measure the rendered endpoint back in MeArm source
coordinates. HOME, LEFT, RIGHT, HIGH, and LOW must each remain within 0.5 mm of
the requested position.

These tests verify the kinematic display only. They do not model servo torque,
power, backlash, binding, or collisions.
