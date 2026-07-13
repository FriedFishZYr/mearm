# Roadmap

## Phase 0: scope and technology decision — complete

- Defined product scope, supported syntax, safety boundaries, and acceptance
  criteria.
- Selected TypeScript, Vite, Vitest, and Three.js.
- Recorded the technology decision and deferred alternatives.

## Phase 1: deterministic simulation core — complete

- Added versioned profile defaults and validation.
- Implemented the tokenizer/parser subset with source locations.
- Implemented forward/inverse kinematics and limit diagnostics.
- Built deterministic setup, movement, claw, and delay timelines.
- Added classroom fixtures and automated core coverage.

## Phase 2: 3D viewer — complete

- Built the simplified MeArm transform hierarchy.
- Connected deterministic playback state to arm and claw transforms.
- Added path rendering, coordinate labels, grid, axes, orbit/zoom, fit/reset,
  and camera presets.
- Added valid, caution, and invalid visual states.

## Phase 3: classroom workspace — complete

- Added editable Instructor, Student, and Free form examples.
- Added playback, stepping, scrubbing, speed, repeat, and source linking.
- Added syntax highlighting, clickable gutter checkpoints, reset behavior, and
  copyable pose/delay commands.
- Added Free form coordinate bounds and instructor-editable simulation settings.
- Added responsive layouts, labels, focus styles, and textual status cues.

## Phase 4: release validation — in progress

Completed:

- static optimized production build;
- strict TypeScript and automated test gates;
- local runtime asset verification;
- core desktop and phone-width Chromium interaction checks; and
- responsive interface smoke checks at multiple viewport sizes.

Remaining before 1.0:

- explicitly exercise the newest Free form, copy, reset, and command-marker
  flows in a production browser;
- complete recommended Chrome/Edge, keyboard-only, assistive-technology,
  touch-gesture, reduced-motion, and offline manual checks;
- assemble and calibrate the classroom MeArm;
- run the physical validation protocol and record results; and
- document any hardware/profile corrections and make the release decision.

## Deferred work

- Arbitrary Arduino/C++ execution
- Full rigid-body physics
- Collision detection without measured geometry
- Direct Arduino upload
- Web Serial telemetry
- Multiple simultaneous arms
- Arbitrary CAD import
- Persisted or import/export simulation profiles

Deferred items require a separate design decision and must not silently expand
the first-release safety claims.
