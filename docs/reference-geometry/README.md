# MeArm v4.1 geometry reference

This folder records dimensional evidence used when improving the 3D viewer.
It is deliberately separate from production geometry and kinematics so that
visual measurements cannot silently change motion, validation, or task-space
behavior.

## Source material

- `MeArm_v4.1_Manual.pdf`: assembly sequence and part relationships.
- `MeArm_4AX-v4_1_A5.svg`: full-size A5 cutting profiles and pivot locations.

The source files are not copied into this repository. The SVG is treated as a
design reference rather than a manufacturing specification.

## SVG scale

The SVG declares an A5 landscape sheet of `210 mm × 148.5 mm` and a view box of
`864 × 576` units. Because both dimensions have the same scale factor:

```text
210 mm / 864 units = 0.2430556 mm per SVG unit
```

Measurements below use that scale and are taken between detected circular
pivot centers, not between the outside edges of the cut profiles.

## Measured dimensions

| Feature | SVG measurement | Interpretation | Confidence |
| --- | ---: | --- | --- |
| Principal structural pivot span | approximately 79.23 mm | Supports a nominal 80 mm arm link | High |
| Part 17 parallel-linkage pivot span | approximately 55.12 mm | Secondary four-bar linkage; not `L1` or `L2` | High |
| Short subdivision on the three-hole principal member | approximately 24.11 mm | Assembly/linkage placement, not an independent kinematic link | Medium |
| `L3` horizontal endpoint offset | Not directly available from one flat part | Composite assembled offset | High |

The difference between the measured 79.23 mm span and the nominal 80 mm link
is small enough to be explained by export, path-center, or print scaling
tolerance. It is not sufficient evidence for changing the kinematic model.

## Kinematic dimensions retained

The project should continue to use:

| Symbol | Meaning | Value |
| --- | --- | ---: |
| `L1` | Shoulder axis to elbow axis | 80 mm |
| `L2` | Elbow axis to wrist axis | 80 mm |
| `L3` | Combined horizontal endpoint offset | 22 mm |

`L3` combines the base-axis-to-shoulder-axis offset and the
wrist-axis-to-grip-point offset. It should not be replaced by the length of a
single SVG plate.

## Current task-space reference

With the retained dimensions and the existing servo limits—base `-45°..45°`,
shoulder `45°..135°`, and elbow `-45°..45°`—the coordinate extrema remain:

| Coordinate | Minimum | Maximum |
| --- | ---: | ---: |
| X, left/right | -112.125 mm | 112.125 mm |
| Y, forward | 15.556 mm | 158.569 mm |
| Z, height | 0 mm | 136.569 mm |

These extrema describe the limits of a curved, servo-limited volume. They do
not define a rectangular box in which every combination is reachable.

## Rules for the 3D redesign

SVG-derived geometry may change plate silhouettes, cutouts, holes, spacers,
linkages, and gripper appearance. It must remain attached to the existing
kinematic pivots as visual geometry.

The viewer keeps its existing warm wood and dark cut-edge materials. The SVG
informs plate shapes only; it does not change the material language to acrylic.

The redesign must not change:

- `L1`, `L2`, or `L3` without new assembled measurements;
- servo limits or angle conventions;
- forward or inverse kinematics;
- task-space generation;
- pose validation or playback behavior.

Selected SVG paths should be converted into controlled Three.js geometry at
development time. The application should not execute or embed arbitrary SVG
markup at runtime.
