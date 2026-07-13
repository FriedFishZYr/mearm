# Project summary

## Outcome

MeArm Classroom Motion Lab is a working static web application that turns a
safe subset of beginner Arduino dance code into a deterministic timeline and a
linked 3D animation. It combines classroom examples, source navigation,
kinematic diagnostics, playback controls, configurable simulation geometry,
and an explicit physical-safety boundary in one local-first workspace.

The software release gate passes. Physical validation on the intended MeArm
remains the release blocker for classroom-ready version 1.0.

## What is implemented

- A tokenizer/parser for one MeArm instance, pin declarations, `setup()`,
  `loop()`, movement, claw, and delay calls.
- Deterministic setup/loop timing with source-library movement and claw delays.
- Inverse/forward kinematics, approved-pose classification, reachability
  checks, and configured servo-angle limits.
- A simplified Three.js MeArm with orbit/zoom, camera presets, fit/reset,
  path, grid, axes, coordinate labels, and responsive resizing.
- An editable, syntax-highlighted source view with line-linked diagnostics,
  active execution highlighting, and clickable command checkpoints.
- Play/pause, restart, previous/next command, scrub, speed, and optional repeat.
- Instructor dance, Student starter, and Free form examples.
- Inclusive Free form bounds of X `-100..100`, Y `100..200`, and Z `0..150`
  millimeters before reachability and limit validation.
- Copyable approved-pose and common-delay commands.
- In-memory instructor settings for link lengths, HOME, and joint limits.
- A static Vite build with no external runtime assets or backend.

## Validation snapshot

As of 2026-07-13:

- 46 tests across 9 test files pass.
- Strict TypeScript checking passes.
- The optimized Vite build passes with the known non-blocking chunk-size
  advisory for the Three.js bundle.
- Offline asset and required CSS contract verification passes.
- Earlier desktop and phone-width Chromium interaction checks covered the core
  editor, parser errors, playback, viewer options, settings, and layout.
- Later interface smoke checks covered multiple desktop/mobile viewport sizes
  without horizontal overflow or console errors.

The latest Free form, copy-preset, reset, and command-marker flows have
automated coverage but still need an explicit final manual browser pass.
Cross-browser, keyboard-only, assistive-technology, touch-gesture, and
network-disabled manual checks remain recommended.

## Current release position

Version 0.9.0 is suitable for local demonstrations and continued software
review. It must not be called a classroom-ready 1.0 until:

1. the latest interface additions receive a final manual browser pass;
2. the target classroom MeArm is assembled and calibrated; and
3. every requirement in [PHYSICAL_VALIDATION.md](PHYSICAL_VALIDATION.md) passes.

## Main constraints

- The app previews a documented Arduino subset, not arbitrary C++.
- It does not upload sketches or communicate with hardware.
- Simulation settings are not servo calibration.
- It does not model torque, heat, power, backlash, flex, mechanical stops,
  collisions, or nearby objects and people.
- A mathematically valid pose is not proof of physical safety.

## Documentation map

- [README](../README.md): setup, commands, features, layout, and project status
- [PRODUCT_SPEC.md](PRODUCT_SPEC.md): product behavior and acceptance criteria
- [ARCHITECTURE.md](ARCHITECTURE.md): implemented modules and data flow
- [CLASSROOM_INTERFACE.md](CLASSROOM_INTERFACE.md): controls and user workflow
- [SKETCH_LANGUAGE.md](SKETCH_LANGUAGE.md): accepted syntax and timing semantics
- [VIEWER_MODEL.md](VIEWER_MODEL.md): coordinates and visual transform model
- [TESTING_AND_SAFETY.md](TESTING_AND_SAFETY.md): evidence and safety limits
- [VALIDATION_REPORT.md](VALIDATION_REPORT.md): current release evidence and gaps
- [PHYSICAL_VALIDATION.md](PHYSICAL_VALIDATION.md): required hardware protocol
- [ROADMAP.md](ROADMAP.md): completed phases and next gates
- [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md): commands and continuation checklist
- [TECHNOLOGY_DECISION.md](TECHNOLOGY_DECISION.md): selected stack and tradeoffs
- [UI_REFINEMENT_CHANGELOG.md](UI_REFINEMENT_CHANGELOG.md): interface changes
