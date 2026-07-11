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

The first-release arm uses simple boxes and cylinders rather than a CAD model.
This keeps transforms obvious, loads quickly, and avoids implying mechanical
accuracy that has not been measured.

The model includes:

- base and turntable,
- paired upper-arm and forearm rails,
- visible shoulder, elbow, and wrist joints,
- horizontal hand and two animated claw fingers,
- glowing target marker,
- optional target path,
- optional reference grid and coordinate axes.

## Playback

The renderer reads the deterministic timeline produced by the Phase 1 core.
Movement is visually interpolated between the library-equivalent 50 ms samples
so animation remains smooth while command endpoints and timing remain exact.
Claw openness is interpolated across the library's 300 ms command delay.

Playback begins with the setup-computed initial loop state and repeats the
instructor dance timeline. Scrubbing and speed changes affect simulation time,
not the source command data.

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
