# MeArm Live Viewer

A lightweight, browser-based 3D previewer for beginner MeArm Arduino dance
sketches.

The viewer is intended to let students and instructors preview a dance before
uploading it to a physical robot. It will animate supported `MeArm` commands,
show the claw path, and warn about positions that the configured arm cannot
reach.

## Project status

**Version 0.9 release-candidate software and Chromium browser checks are
complete.** Automated tests, strict type checking, production compilation,
dependency audit, offline asset verification, desktop interaction checks, and
a phone-width responsive check pass. Comparison with a connected physical
MeArm remains required before the first classroom release is approved.

The initial documentation defines:

- [Product scope and user experience](docs/PRODUCT_SPEC.md)
- [System architecture](docs/ARCHITECTURE.md)
- [Supported Arduino sketch syntax](docs/SKETCH_LANGUAGE.md)
- [Testing and safety boundaries](docs/TESTING_AND_SAFETY.md)
- [Implementation roadmap](docs/ROADMAP.md)
- [Technology decision](docs/TECHNOLOGY_DECISION.md)
- [3D viewer model](docs/VIEWER_MODEL.md)
- [Classroom interface](docs/CLASSROOM_INTERFACE.md)
- [Release validation report](docs/VALIDATION_REPORT.md)
- [Physical validation protocol](docs/PHYSICAL_VALIDATION.md)
- [Project summary](docs/PROJECT_SUMMARY.md)
- [Project handoff](docs/PROJECT_HANDOFF.md)

## Local verification

```sh
npm test
npm run typecheck
npm run build
```

The browser preview can be started with `npm run dev`.

## Initial goals

- Run locally in a modern browser.
- Require no account, server, or internet connection after the app is loaded.
- Accept the beginner MeArm dance sketches already used in class.
- Provide play, pause, restart, timeline, speed, and orbit-camera controls.
- Display reachability and servo-limit warnings before physical testing.
- Make simulation limitations obvious to students and instructors.

## Non-goals for the first release

- Compiling arbitrary Arduino or C++ code in the browser.
- Replacing physical safety checks or servo calibration.
- Predicting torque, current draw, backlash, flex, binding, or collisions with
  nearby objects.
- Uploading code to an Arduino.
- Providing a high-fidelity physics or CAD simulation.

## Source project

The viewer is designed around the adjacent `MeArm-Arduino` library and its
classroom dance sketches. The initial robot configuration is:

| Setting | Value |
| --- | ---: |
| Shoulder-to-elbow length (`L1`) | 80 mm |
| Elbow-to-wrist length (`L2`) | 80 mm |
| Combined hand/base offset (`L3`) | 22 mm |
| Home position | `(0, 100, 50)` mm |
| Movement interpolation step | 10 mm |
| Movement step delay | 50 ms |

These values must remain configurable so the viewer can follow later library
or classroom calibration changes.

## Documentation rule

Behavior that affects simulation, safety warnings, or supported sketch syntax
must be documented before it is implemented or changed.
