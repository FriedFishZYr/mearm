# Task Space Lab guide

## Purpose

`task-space-lab.html` is a standalone, interactive lesson that demonstrates how
the MeArm servo-angle domain maps into a Cartesian task space. It is intended
for classroom explanation and visual exploration rather than physical safety
validation.

The page has no external runtime dependencies. It can be opened directly from
the filesystem or served at `/task-space-lab.html` by the project development
server.

For the complete mathematical derivation, see
[`../docs/TASK_SPACE_CALCULATION.md`](../docs/TASK_SPACE_CALCULATION.md).

## Lesson flow

The four step selectors are the first visible elements on the page:

1. **Angle domain** — shows the three-dimensional configuration space formed by
   the base, shoulder, and elbow limits.
2. **Cross-section** — maps shoulder and elbow angles into the radial/vertical
   plane `(ρ, z)`.
3. **Base sweep** — rotates the cross-section through the base-angle interval to
   produce Cartesian points `(x, y, z)`.
4. **Final boundary** — shows the six mapped servo-limit faces and the enclosing
   Cartesian coordinate ranges.

The Previous and Next buttons follow the same sequence as the step selectors.

## Default model

The lesson uses the MeArm v3 positioning defaults:

| Joint or dimension | Default |
| --- | ---: |
| Base β | −45° to 45° |
| Shoulder s | 45° to 135° |
| Elbow e | −45° to 45° |
| Shoulder link `L1` | 80 mm |
| Elbow link `L2` | 80 mm |
| Hand offset `L3` | 22 mm |

The claw-opening servo is excluded because it does not change the endpoint
position.

## Equations shown by the lesson

The radial and vertical coordinates are:

```text
ρ = L3 + L1 cos(s) + L2 cos(e)
z = L1 sin(s) + L2 sin(e)
```

The base angle maps the radial coordinate into Cartesian space:

```text
x = ρ sin(β)
y = ρ cos(β)
z = L1 sin(s) + L2 sin(e)
```

The shoulder and elbow values are absolute link angles in this model. The elbow
term is therefore `e`, not `s + e`.

## Interaction

- Use the three sliders to select a configuration.
- The current angle or endpoint values update immediately.
- Drag the three-dimensional diagrams to rotate the view.
- The base slider is disabled during the two-dimensional cross-section step
  because base rotation does not affect `(ρ, z)`.
- Reduced-motion preferences disable the animated base sweep.

## Visual design

The surrounding lesson uses a minimal handout style:

- white background;
- black or gray interface text and rules;
- Georgia as the primary typeface;
- no introductory banner or link above the step selectors; and
- color reserved for meaningful series inside the three-dimensional diagrams.

The two-dimensional cross-section uses line patterns as well as labels so its
meaning does not depend on color alone.

## Implementation outline

All markup, styling, calculations, and drawing logic are contained in
`task-space-lab.html`.

Important internal functions include:

| Function | Responsibility |
| --- | --- |
| `forward()` | Converts one angle triple to `(ρ, x, y, z)` |
| `drawConfiguration()` | Draws the Step 1 configuration domain |
| `drawCrossSection()` | Draws the Step 2 radial/vertical boundary |
| `drawTaskSpace()` | Draws the Step 3 and Step 4 Cartesian surfaces |
| `lessonMarkup()` | Supplies the explanation and live equations for each step |
| `updateInterface()` | Synchronizes labels, controls, and the active diagram |
| `resizeCanvas()` | Resizes and redraws the canvas for the available layout |

The page intentionally does not import the main viewer. This keeps it portable
and prevents changes to the lesson from affecting the primary application.

## Maintenance rules

When changing the lab:

1. Keep the angle conventions and dimensions consistent with
   `src/core/kinematics.ts` and `src/core/profile.ts`.
2. Update the displayed bounds if the default profile or equations change.
3. Preserve the four-step sequence unless the accompanying explanations are
   updated at the same time.
4. Keep the page usable at widths down to 320 px.
5. Preserve keyboard-accessible native controls and descriptive canvas labels.
6. Avoid network-loaded fonts, scripts, or images so direct-file and offline use
   continue to work.
7. Run `npm run check` after functional or mathematical changes.

## Scope and safety

The rendered boundary is mathematical. It does not account for servo
calibration, torque, backlash, link flex, collision, wiring, table clearance,
or nearby objects. A Cartesian point shown as reachable is not automatically a
safe physical command.

