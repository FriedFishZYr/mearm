# Testing and safety

## What the viewer can establish

The viewer can provide evidence that:

- supported sketch statements were recognized in source order,
- numeric positions are mathematically reachable under the configured link
  lengths,
- solved joint angles stay inside configured software limits,
- interpolated movement points are valid,
- expected timing and claw state follow the source model,
- the intended motion is understandable before upload.

## What the viewer cannot establish

The viewer cannot guarantee:

- correct physical servo mounting direction or horn alignment,
- accurate calibration on a particular robot,
- sufficient external power or a shared electrical ground,
- safe current draw, servo temperature, or torque,
- absence of backlash, flex, loose fasteners, or assembly differences,
- absence of self-collision or collision with a table, student, or object,
- successful gripping of a real object.

Every UI state that reports a mathematically valid motion must still display a
concise reminder that physical verification is required.

## Test layers

### Parser unit tests

Cover:

- both existing classroom sketches,
- whitespace and trailing comments,
- line and block comments containing fake commands,
- signed and decimal coordinate literals,
- wrong arm variable names,
- missing semicolons and parentheses,
- unsupported loops, conditionals, expressions, and functions,
- invalid and negative delays,
- source line and column accuracy.

Golden command lists for the instructor and student sketches should make
unintended parser changes obvious.

### Kinematics unit tests

Cover:

- HOME `(0, 100, 50)`,
- LEFT `(-50, 100, 80)`,
- RIGHT `(50, 100, 80)`,
- HIGH `(0, 100, 120)`,
- LOW `(0, 120, 40)`,
- boundary points at full and folded reach,
- points outside maximum reach,
- points invalid because of configured servo limits,
- finite-number validation,
- inverse-to-forward round trips.

For valid points, forward kinematics applied to solved angles should reproduce
the target within 0.5 mm.

### Timeline unit tests

Verify:

- setup executes once and loop repeats only when enabled,
- a zero-distance movement consumes 50 ms,
- movement sample count is `ceil(dist / 10) + 1`,
- every intermediate movement point is checked,
- each claw call consumes 300 ms,
- explicit delays hold the complete current state,
- scrubbing to the same time always produces the same pose.

### Renderer tests

Verify transform hierarchy and representative joint poses without depending
solely on screenshots. Add a small number of visual regression images for:

- HOME,
- LEFT and RIGHT symmetry,
- HIGH and LOW,
- open and closed claw,
- warning and invalid states,
- narrow and projector-sized layouts.

### End-to-end tests

Load each shipped sample, build a timeline, play it, scrub it, change speed,
and confirm diagnostics and current source lines. Test production output with
network access disabled.

## Physical validation checklist

Before a sketch is approved for student hardware:

1. Confirm the correct Arduino board and all four signal pins.
2. Confirm external servo power and common ground.
3. Raise or position the arm so an unexpected movement is unlikely to strike
   the table or an object.
4. Keep hands, hair, clothing, and loose objects clear.
5. Test HOME first.
6. Test each new pose individually at low speed or with power ready to
   disconnect.
7. Stop if a servo buzzes, binds, heats, or drives against a mechanical stop.
8. Only then run the full repeated dance.

## Definition of done for a release

- Automated parser, kinematics, and timeline tests pass.
- Production build completes without warnings that affect correctness.
- Shipped samples work offline in each supported browser.
- Accessibility checks cover keyboard use, labels, focus, contrast, and
  non-color status cues.
- An instructor has compared all approved poses and one complete dance with a
  physically calibrated MeArm.
- Known simulation limitations are visible in the application and release
  notes.
