# MeArm Classroom Motion Lab

MeArm Classroom Motion Lab is a local-first, browser-based 3D previewer for
beginner MeArm Arduino dance sketches. It parses a deliberately small and safe
Arduino subset, builds a deterministic motion timeline, animates a simplified
MeArm, and links each simulated command back to its source line.

The viewer helps students understand command order and helps instructors catch
unreachable positions or configured servo-limit violations before uploading a
sketch. It does **not** replace calibration, clearance checks, or testing on the
physical robot.

## Project status

The repository is a version 0.9.0 release candidate. The current automated
gate passes, including the Vitest suite, strict TypeScript checking, a
production build, and offline-asset verification. Core browser and responsive
checks have also been completed.

Physical comparison with a fully assembled and calibrated classroom MeArm is
still required before a 1.0 classroom release. The complete five-example flow,
including the newer House shape and Cyberpunk beat dances, should also receive
a final manual browser pass; see the
[validation report](docs/VALIDATION_REPORT.md) for the exact boundary.

## Features

- Five editable examples: Instructor dance, Student starter, House shape,
  Cyberpunk beat, and Free form.
- Safe parsing of sequential `begin`, `moveToXYZ`, `snapToXYZ`, claw, and
  `delay` calls; pasted code is never executed.
- Deterministic movement timing based on the classroom MeArm profile.
- Reachability, servo-limit, and non-approved-pose diagnostics with source
  locations.
- Play, pause, restart, command stepping, scrubbing, repeat, and speeds from
  `0.25x` through `4x`.
- Clickable command markers in the editor gutter and a source-line link in the
  motion inspector.
- Copyable HOME, LEFT, RIGHT, HIGH, LOW, common delay, and open/close claw
  commands.
- Orbit, zoom, fit, reset, camera presets, path, servo-limited task-space
  boundary, grid, axes, and coordinate labels in the 3D view.
- Instructor-editable link lengths, HOME coordinates, and servo-angle limits.
- Static production output with no required account, backend, analytics, or
  external runtime assets.

## Quick start

Prerequisites: Node.js `^20.19.0` or `>=22.12.0` and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Choose an example, edit the sketch, and
select **Preview code** (or press Ctrl/Command + Enter). Playback starts paused
so the first motion is always deliberate.

The Free form example accepts movement coordinates only within these inclusive
limits before normal kinematic and servo-limit validation:

| Axis | Allowed range |
| --- | ---: |
| X | -100 to 100 mm |
| Y | 100 to 200 mm |
| Z | 0 to 150 mm |

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Run strict TypeScript checking |
| `npm run build` | Type-check and create `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run verify:offline` | Verify the built page uses local runtime assets and required CSS contracts |
| `npm run check` | Run tests, type checking, build, and offline verification |

Run `npm run build` before `npm run verify:offline`, or use the complete
`npm run check` gate.

## Supported sketch shape

The parser accepts one `MeArm` instance, integer pin declarations, `setup()`,
`loop()`, comments, and sequential calls such as:

```cpp
MeArm arm;

void setup() {
  arm.begin(11, 10, 9, 6);
}

void loop() {
  arm.moveToXYZ(0, 100, 50);
  delay(500);
  arm.openClaw();
}
```

Variables in movement calls, arithmetic, conditionals, loops, custom
functions, arbitrary Arduino APIs, and general C++ execution are intentionally
unsupported. Read the [sketch language reference](docs/SKETCH_LANGUAGE.md) for
the complete grammar and timing model.

## Default simulation profile

| Setting | Value |
| --- | ---: |
| Shoulder-to-elbow length (`L1`) | 80 mm |
| Elbow-to-wrist length (`L2`) | 80 mm |
| Hand/base offset (`L3`) | 22 mm |
| HOME position | `(0, 100, 50)` mm |
| Movement interpolation step | 10 mm |
| Movement step delay | 50 ms |
| Claw command delay | 300 ms |

Profile settings affect only the simulation. They do not configure or
calibrate a connected Arduino or robot.

## Repository layout

```text
src/app/       preview compilation and syntax highlighting
src/core/      parser, profile, kinematics, timeline, and shared types
src/samples/   the five bundled Arduino sketches
src/viewer/    Three.js model, scene, and playback sampling
tests/         unit, integration, interface-contract, and fixture coverage
scripts/       release and offline verification helpers
docs/          product, architecture, operation, validation, and safety docs
```

## Documentation

Use the [documentation guide](docs/README.md) to browse current product,
implementation, validation, reference, planning, and historical material. The
most important release documents are the
[project summary](docs/PROJECT_SUMMARY.md),
[validation report](docs/VALIDATION_REPORT.md), and
[physical validation protocol](docs/PHYSICAL_VALIDATION.md).

Behavior that changes simulation, supported syntax, diagnostics, or safety
warnings should be documented with the implementation change.

## Safety boundary

The preview does not model torque, current draw, heat, backlash, flex,
mechanical stops, self-collision, the table, or nearby people and objects.
Complete the [physical validation protocol](docs/PHYSICAL_VALIDATION.md) before
approving a sketch or this application for classroom hardware.

## License

This project is licensed under the MIT License as declared in `package.json`.
