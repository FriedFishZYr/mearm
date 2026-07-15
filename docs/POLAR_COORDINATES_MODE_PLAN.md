# Polar coordinates mode: critical product and implementation plan

**Status:** Proposed  
**Decision owner:** Project maintainer  
**Target:** Post-0.9 classroom feature; do not allow it to delay the existing
physical-validation gate for 1.0

## Executive recommendation

Add polar coordinates, but introduce them as a **coordinate view** before
treating them as a new authoring workflow.

The first useful release should let any existing sketch be inspected in XYZ,
Polar, or Both views and should draw a small, optional radius/angle/height guide
in the 3D scene. The second release should add the authentic MeArm
`moveTo(theta, r, z)` and `snapTo(theta, r, z)` calls plus a Polar explorer
sample. A command builder and structured challenges should remain later work.

This sequence delivers the main educational value early, leaves the proven
Cartesian timeline and safety checks intact, and avoids turning one feature
into a general lesson platform.

## Why this is a strong product move

The arm makes cylindrical coordinates physical:

- base rotation expresses the angle `theta`;
- horizontal distance from the base expresses radius `r`; and
- claw height expresses `z`.

Students can therefore see a coordinate transformation rather than only read
one. The feature also connects directly to real MeArm code: the upstream
library provides `moveTo(theta, r, z)` and `snapTo(theta, r, z)` in cylindrical
polar coordinates.

The current application is unusually well positioned for this addition. Its
kinematics already derives horizontal radius and base angle, and its timeline
operates on Cartesian targets. Polar input can be converted once at the parser
boundary and then use the existing reachability, servo-limit, interpolation,
playback, and rendering pipeline.

## Critical revision of the initial brainstorm

The original idea set had good educational range, but implementing all of it
as one feature would be too broad. The following corrections make the plan
safer and more coherent.

### 1. Do not make Polar another global application mode

The current `activeMode` selects an example and controls Free form bounds. It
is not a general learning-mode abstraction. Adding `polar` to that union would
mix three different concerns:

- which starter sketch is loaded;
- which validation envelope applies; and
- how coordinates are displayed.

Create a separate `coordinateView` state with `xyz`, `polar`, and `both`
values. A later **Polar explorer** can be another example in the existing
selector without owning the coordinate display state.

### 2. Call the feature Polar, but teach that it is cylindrical

In three dimensions, `(theta, r, z)` is a cylindrical coordinate system, not
two-dimensional polar coordinates. The student-facing control can say
**Polar**, because that is approachable and matches the MeArm API, but nearby
help text should say **cylindrical coordinates** at least once.

### 3. Use the MeArm convention, not the textbook default silently

For this arm:

```text
x = r sin(theta)
y = r cos(theta)
z = z

r = sqrt(x^2 + y^2)
theta = atan2(x, y)
```

Thus `theta = 0` points forward along `+Y`, and positive angles turn toward
`+X`. Many mathematics courses instead measure from `+X` with
`x = r cos(theta)`. The interface must show the MeArm convention explicitly;
otherwise the feature will teach a subtle misconception.

### 4. Preserve radians in code and show degrees for comprehension

The real MeArm `moveTo()` method sends `theta` directly to `sin()` and `cos()`,
so its code argument is in radians. The application should not invent a
degree-based command that will fail when copied to a real sketch.

Recommended presentation:

```text
Angle theta    30.0 deg
               0.524 rad
Radius r       120.0 mm
Height z        50.0 mm
```

Generated commands should use a finite numeric radian literal:

```cpp
arm.moveTo(0.524, 120, 50);
```

Expressions such as `PI / 6` should remain unsupported until the sketch
language deliberately adds arithmetic expressions.

### 5. Do not imply that polar movement traces an arc

The upstream `moveTo(theta, r, z)` implementation converts only the target to
XYZ and delegates to `moveToXYZ()`. The arm therefore follows the same straight
Cartesian line between endpoints. It does not interpolate angle and radius or
trace a circular arc.

This is an important teaching opportunity, but it must be stated in the UI and
sample comments. A circular path requires several targets with constant radius
and changing angle.

### 6. Do not build a challenge engine in the first release

Challenges are attractive but introduce lesson state, progress, answer
checking, reset semantics, and more responsive UI. Initially, guided prompts
can live in comments inside the Polar explorer sketch. If classroom testing
shows that students use them successfully, a structured challenge system can
be designed separately.

### 7. Keep the Cartesian timeline canonical

There is no benefit in duplicating the timeline, interpolation, kinematics, or
validation systems for polar coordinates. Convert polar command arguments to a
Cartesian target, preserve the original input representation for display, and
let the existing deterministic core do the rest.

## Product definition

### Coordinate view control

Add a segmented control or compact select near **Claw position**:

- **XYZ** — current behavior and default;
- **Polar** — show `theta`, `r`, and `z`; and
- **Both** — show the equivalent representations together.

The default remains XYZ so existing users and screenshots do not change
unexpectedly. The choice may remain in memory for the browser session; it does
not need persistence in the first release.

On narrow layouts, Both must stack rather than compress six values into one
row. The readout must retain textual units and accessible names.

### Polar scene guide

When Polar or Both is selected, provide an independently toggleable guide that
contains:

- a horizontal radius line from the base axis to the claw projection;
- an angle arc at the base around the `z` axis;
- a vertical line from the horizontal projection to the claw; and
- short labels for `theta`, `r`, and `z`.

The guide should update during playback and scrubbing. It should not force a
camera change. A lightweight hint can recommend Top view for angle exploration,
but changing the camera automatically would be disorienting.

The guide is explanatory geometry, not a new reachability or safety boundary.

### Path labels

Coordinate labels should follow the selected view:

```text
XYZ:    X 60.0  Y 103.9  Z 50.0
Polar:  theta 30.0 deg  r 120.0  z 50.0
Both:   Prefer a two-line label or retain XYZ labels to avoid scene clutter
```

Both-mode scene labels need a deliberate clutter decision. The recommended
initial behavior is to keep XYZ path labels while the inspector shows both
representations. This is clearer than doubling every label.

### Polar explorer sample

After parser support exists, add a fourth starter example named **Polar
explorer**. It should be short and use comments as lesson prompts:

1. establish a constant-radius starting point;
2. change only `theta`;
3. change only `r`;
4. change only `z`; and
5. approximate an arc with several constant-radius points.

The sample should use physically reviewed poses before classroom release. It
must not imply that mathematical reachability guarantees physical safety.

## Technical design

### Core coordinate conversion

Add `src/core/coordinates.ts` with small, independently tested functions:

```ts
interface CylindricalPoint {
  theta: number; // radians, zero along +Y
  radius: number; // millimeters
  z: number; // millimeters
}

cartesianToCylindrical(point: Point3): CylindricalPoint
cylindricalToCartesian(point: CylindricalPoint): Point3
radiansToDegrees(value: number): number
```

Use `Math.atan2(x, y)` for the angle and `Math.hypot(x, y)` for the radius.
Do not duplicate this math in `main.ts`, the parser, or the viewer.

At radius zero, the angle is mathematically undefined. The conversion contract
should return zero as a stable computational fallback, while user-facing text
may say `undefined at r = 0` if that state can be displayed. With the default
MeArm geometry, valid endpoint poses are not expected on the base axis, but the
utility should still define the edge case.

### Command representation

The current `MoveCommand` stores only a Cartesian `target`. That is sufficient
for playback but loses whether the student wrote `moveToXYZ()` or `moveTo()`.
If left unchanged, the inspector's reconstructed command text would incorrectly
turn polar source into XYZ source.

Extend the command with its input representation while retaining a canonical
Cartesian target. One possible shape is:

```ts
interface CartesianMoveInput {
  kind: "cartesian";
  x: number;
  y: number;
  z: number;
}

interface PolarMoveInput {
  kind: "polar";
  theta: number;
  radius: number;
  z: number;
}

interface MoveCommand extends LocatedCommand {
  type: "move" | "snap";
  target: Point3;
  input: CartesianMoveInput | PolarMoveInput;
}
```

The timeline continues to read only `target`. Source-facing UI and diagnostics
can use `input` without reverse-engineering the original call.

### Parser behavior

Support these real methods in addition to the current XYZ variants:

```cpp
arm.moveTo(theta, r, z);
arm.snapTo(theta, r, z);
```

Arguments remain signed, finite numeric literals. The parser should:

1. retain the three original polar values in `command.input`;
2. convert them to `command.target` once;
3. preserve the source location; and
4. use the same timeline command type as the XYZ equivalent.

Do not add trigonometric functions, variables, `PI`, or arithmetic as an
incidental part of this feature.

The real library mathematically accepts a signed radius because it simply
multiplies by `sin()` and `cos()`. The first implementation should not invent a
new parser rejection. The command builder and sample should always emit the
canonical `r >= 0` form. A classroom caution for negative radius can be
considered later if real student usage warrants it.

### Timeline and validation

No polar-specific timeline is required. After target conversion:

- `moveTo()` uses the existing straight-line XYZ interpolation and timing;
- `snapTo()` uses the existing immediate target behavior;
- every interpolated point receives the existing IK and servo-limit checks;
- path extraction and playback sampling remain unchanged; and
- the existing Free form XYZ envelope applies to the converted Cartesian
  target if a polar command is written while Free form is active.

The last point should be documented in the error message. When useful, report
both the polar input and the converted XYZ axis that exceeded the envelope.

### Application shell

`src/main.ts` should own only presentation state:

```ts
type CoordinateView = "xyz" | "polar" | "both";
```

It should pass coordinate-view changes to focused formatting and scene APIs.
It should not contain conversion formulas.

`commandText()` must reconstruct the method the student actually wrote. The
source link and gutter checkpoint must never label `moveTo()` as
`moveToXYZ()`.

### Viewer

`MeArmScene` should own a disposable polar-guide group, as it already owns axes,
path labels, and other scene helpers. Suggested focused APIs are:

```ts
setPolarGuideVisible(visible: boolean): void
setPolarGuidePoint(point: Point3): void
setCoordinateLabelMode(mode: "xyz" | "polar"): void
```

The guide must be disposed during scene recreation. Label DOM nodes must also
be removed consistently with the existing CSS2D label cleanup.

Do not couple the guide to the arm model's joint transforms; it describes the
endpoint coordinate system, not the physical linkage hierarchy.

## Delivery plan

### Milestone A — Coordinate lens

Deliver educational value without expanding the sketch language:

- add tested Cartesian/cylindrical conversion helpers;
- add XYZ, Polar, and Both readout views;
- show degrees and radians together;
- add the optional live polar scene guide;
- make path-label behavior explicit for each view;
- preserve XYZ as the default; and
- update product, classroom, architecture, and safety documentation.

This milestone is independently releasable and works with all existing
examples.

### Milestone B — Authentic polar authoring

- extend command types to preserve input representation;
- parse `moveTo()` and `snapTo()` numeric polar calls;
- convert targets once at the parser/core boundary;
- retain the existing Cartesian timeline semantics;
- keep Free form validation applied to converted targets;
- update highlighting and command reconstruction;
- add the Polar explorer sample; and
- update the sketch-language reference and fixtures.

This milestone should not ship until sample poses have passed the same physical
review expected of the existing classroom commands.

### Milestone C — Guided exploration

Only after classroom observation:

- add a polar target/command builder;
- add prediction prompts or lightweight challenges;
- consider constant-`r`, constant-`theta`, and constant-`z` surfaces; and
- consider a formal XYZ-versus-polar path comparison lesson.

These are intentionally not acceptance requirements for Polar mode.

## Acceptance criteria

### Mathematical correctness

- Converting XYZ to polar and back reconstructs representative reachable points
  within `1e-7` mm.
- HOME `(0, 100, 50)` displays as `theta = 0`, `r = 100`, `z = 50`.
- `(60, 103.923, 50)` displays approximately as `theta = 30 deg`,
  `r = 120`, `z = 50`.
- Quadrant and axis cases use the MeArm convention consistently.

### Behavior

- Switching coordinate view does not recompile, restart, or change playback.
- Polar and equivalent XYZ commands produce the same Cartesian target,
  diagnostics, path, duration, and final joint angles.
- A polar `moveTo()` follows the same straight path as its equivalent
  `moveToXYZ()`.
- Scrubbing and stepping update the polar readout and guide immediately.
- Recompiling or applying robot settings disposes and recreates guide resources
  without duplicate labels.

### Source fidelity

- The inspector and gutter accessible label retain `moveTo()` or `snapTo()` for
  polar source.
- Parser errors identify polar command line and column.
- Numeric radians are documented and generated; degrees are not silently sent
  to the MeArm method.

### Accessibility and responsive behavior

- The coordinate control has a programmatic name and visible keyboard focus.
- `theta`, `r`, `z`, values, and units are available as text outside the canvas.
- Polar meaning does not depend on guide color alone; line style and labels
  distinguish radius, angle, and height.
- Both view stacks cleanly at phone widths without hiding playback controls.
- Reduced-motion preferences do not animate explanatory sweeps.

### Release gate

- Parser, conversion, timeline-equivalence, playback, and interface-contract
  tests pass.
- Strict type checking, production build, and offline verification pass.
- Manual keyboard, touch, narrow-screen, projector-readability, and WebGL
  checks are recorded.
- Polar explorer poses receive physical-arm validation before being called
  classroom-safe examples.

## Test additions

- `tests/coordinates.test.ts`: round trips, convention, quadrants, zero radius,
  degrees/radians.
- `tests/parser.test.ts`: `moveTo()`/`snapTo()`, signed decimals, method
  preservation, unsupported expressions, and source locations.
- `tests/timeline.test.ts`: exact equivalence between polar and XYZ endpoints,
  interpolation, timing, and diagnostics.
- `tests/preview.test.ts`: Free form bounds after polar-to-XYZ conversion.
- `tests/playback.test.ts`: polar-authored commands remain compatible with path
  collection and sampling.
- `tests/release-interface.test.ts`: coordinate-view controls, accessible names,
  and polar-guide APIs.
- Manual browser checks: view switching during play, scrub, step, recompile,
  resize, camera changes, and settings application.

## Risks and mitigations

| Risk | Consequence | Mitigation |
| --- | --- | --- |
| Students assume textbook `+X` angle origin | Incorrect coordinate conversions | Show the MeArm equations and a forward-axis marker beside the control |
| Students enter degrees into a radian API | Dramatically wrong physical target | Display both units, label code as radians, and generate numeric radian literals |
| “Polar move” is interpreted as an arc | Wrong path prediction | State straight-line semantics in the sample and show a multi-point arc exercise |
| Both view overloads the inspector | Poor small-screen usability | Default to XYZ and stack Both view vertically |
| Parser loses original method | Misleading inspector/source navigation | Preserve command input kind alongside canonical target |
| New visuals obscure the arm | Reduced scene readability | Make the polar guide optional and visually subordinate |
| Feature expands the 1.0 validation burden | Delayed physical release | Treat this as post-0.9 work and keep current physical validation independent |
| Negative radius creates confusing equivalent points | Noncanonical student code | Generate only non-negative radius and defer extra cautions until observed |

## Documentation changes required with implementation

- `README.md`: feature list, supported calls, and Polar explorer.
- `docs/PRODUCT_SPEC.md`: coordinate-view and polar-input requirements.
- `docs/CLASSROOM_INTERFACE.md`: controls, equations, angle convention, and
  lesson workflow.
- `docs/SKETCH_LANGUAGE.md`: `moveTo()`/`snapTo()`, radians, timing, and
  straight-line semantics.
- `docs/ARCHITECTURE.md`: conversion boundary and extended command model.
- `docs/VIEWER_MODEL.md`: polar guide geometry and scene mapping.
- `docs/TESTING_AND_SAFETY.md`: test cases and physical interpretation warning.
- `docs/ROADMAP.md`: milestones and release status.

## Explicit non-goals for the first Polar release

- spherical coordinates;
- angle interpolation or automatic circular motion;
- parsing `PI`, arithmetic, variables, or trigonometric expressions;
- replacing Cartesian coordinates or changing the default view;
- a scored lesson/challenge system;
- automatic camera switching;
- a second reachability engine; and
- broader physical-safety claims.

## Final decision summary

Proceed with Polar coordinates as a focused educational layer. Build the
coordinate lens first, then add authentic polar commands. Keep the Cartesian
timeline canonical, preserve the source representation, teach radians and the
MeArm-specific angle origin explicitly, and defer the broader lesson tooling
until classroom use proves it is needed.
