# Roadmap

## Phase 0: documentation and technology decision - complete

- Agree on product scope, supported syntax, safety boundaries, and acceptance criteria.
- Inspect locally available runtimes and build tools.
- Compare maintained 3D, editor, build, and testing options.
- Record the chosen stack, versions, licenses, and reasons.
- Request permission before installing packages or runtimes.

Exit condition: documentation is internally consistent and the implementation stack is approved.

## Phase 1: deterministic simulation core - complete

- Create the browser application scaffold.
- Define versioned robot profiles and defaults.
- Port inverse and forward kinematics from the MeArm source.
- Implement reachability and servo-limit validation.
- Implement the documented tokenizer and parser subset.
- Build deterministic movement and claw timelines.
- Add unit tests using both classroom sketches as fixtures.

Exit condition: code text can produce a fully tested, renderer-independent timeline of valid poses, warnings, and source locations.

## Phase 2: lightweight 3D viewer - complete

- Build the transform hierarchy from simple geometry.
- Add camera orbit, zoom, reset, grid, and axes.
- Connect playback state to arm and claw transforms.
- Draw the optional target/path trail.
- Add clear valid, caution, invalid, and unsupported states.

Exit condition: the approved poses and complete instructor dance render correctly and meet endpoint tolerances.

## Phase 3: classroom interface - complete

- Add code input and shipped samples.
- Add play, pause, restart, step, speed, repeat, and scrub controls.
- Link timeline commands and diagnostics to source lines.
- Add instructor-editable simulation settings with reset.
- Complete keyboard, contrast, responsive-layout, and reduced-motion checks.

Exit condition: a beginner can paste a supported sketch and understand its motion or error without developer assistance.

## Phase 4: build, offline, and validation - paused after software and browser checks

- Produce a static optimized build with all runtime assets bundled.
- Verify the build contains only local runtime assets.
- Add end-to-end and focused visual regression coverage.
- Compare timing and all approved poses with the source library.
- Perform the physical validation checklist with a calibrated MeArm.
- Document remaining differences and release the first classroom candidate.

Current checkpoint: the static build and browser validation are complete.
Physical validation is intentionally deferred until the MeArm is assembled.

Exit condition: all first-release acceptance criteria and the definition of done are satisfied.

## Deferred work

- Arbitrary Arduino/C++ execution.
- Full rigid-body physics.
- Collision detection without measured geometry.
- Direct code upload.
- Web Serial telemetry.
- Multi-arm scenes or multiple simultaneous arm instances.
- Importing arbitrary CAD models.

Deferred items require a separate design decision and must not silently expand the first-release scope.
