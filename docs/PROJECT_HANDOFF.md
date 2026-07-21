# Project handoff

## Current checkpoint

Development is at version 0.9.0. The deterministic core, 3D viewer, classroom
workspace, eight example modes, Free form bounds, copyable presets, and code
checkpoints are implemented. The automated release gate is green; physical
MeArm comparison is deferred until the target arm is assembled and calibrated.

No known software blocker prevents local demonstrations. The newest interface
flows still need an explicit manual browser pass before a classroom-ready 1.0.

## Start the application

From the repository root:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. The app initially loads the Instructor dance and
starts paused. The other bundled examples are Student starter, Pick and place,
Pre-programmed sorting line, Palletizing, House shape dance, Cyberpunk beat
dance, and Free form.

To serve the optimized build:

```sh
npm run build
npm run preview
```

## Re-run the release gate

```sh
npm run check
```

This runs the Vitest suite, strict TypeScript checking, a production build, and
offline verification. The build currently emits a non-blocking chunk-size
advisory for the Three.js-containing JavaScript bundle. Current counts and
bundle sizes are recorded in the
[validation report](VALIDATION_REPORT.md).

## High-value manual browser checks

Run the production preview and confirm:

1. all eight samples load their own source and render;
2. out-of-range Free form coordinates report the correct axis and source line;
3. each pose and delay preset copies the expected complete command;
4. gutter checkpoints and the inspector source link jump to the right command;
5. Reset code restores the active sample;
6. play, pause, restart, Back, Next, scrub, repeat, and every speed work;
7. Fit, Reset, camera presets, Path, Task space, Grid, and Axes work;
8. invalid code disables playback instead of leaving a stale preview active;
9. settings validation and Reset defaults behave correctly; and
10. keyboard focus, narrow layouts, and the console remain clean.

Also perform current Chrome and Edge, keyboard-only, reduced-motion,
touch-width, and network-disabled production checks before broad deployment.

## Physical validation

When the arm is ready, complete
[PHYSICAL_VALIDATION.md](PHYSICAL_VALIDATION.md). Record the robot identifier,
board, pins, supply, servos, profile values, tester, and date. Compare HOME,
LEFT, RIGHT, HIGH, LOW, the claw directions, and one complete instructor dance.

Any binding, hard-stop contact, collision, unexpected direction, heat, or
persistent buzzing blocks approval until the hardware or simulation profile is
corrected and the protocol is repeated.

## Important implementation boundaries

- `src/core/` is deterministic and renderer-independent.
- `src/app/preview.ts` is the compile boundary for profile, parser, mode bounds,
  and timeline errors.
- `src/main.ts` coordinates UI state; it should not absorb kinematics formulas.
- `src/viewer/` owns timeline sampling and Three.js resources.
- Free form bounds are mode-specific; they are not a replacement for IK or
  servo-limit checks.
- Settings are temporary simulation values and are not persisted or sent to
  hardware.

## Release rule

Do not label the application classroom-ready 1.0 until the latest browser
flows are signed off and every physical acceptance requirement passes on the
intended classroom arm.
