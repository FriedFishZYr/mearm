# Documentation guide

This directory is the canonical home for MeArm Classroom Motion Lab
documentation. Start with the sections below according to the work you are
doing; the root-level `README.md` remains the project entry point.

## Product and implementation

- [Project summary](PROJECT_SUMMARY.md) — current scope, implementation, and
  release position
- [Product specification](PRODUCT_SPEC.md) — users, behavior, requirements,
  and acceptance criteria
- [Architecture](ARCHITECTURE.md) — runtime flow, module ownership, and design
  boundaries
- [Classroom interface](CLASSROOM_INTERFACE.md) — examples, controls, and
  classroom workflow
- [Supported sketch language](SKETCH_LANGUAGE.md) — accepted Arduino subset
  and timing semantics
- [3D viewer model](VIEWER_MODEL.md) — coordinates, transforms, task space, and
  playback behavior

## Validation and operations

- [Testing and safety](TESTING_AND_SAFETY.md) — automated coverage, manual
  gates, and simulation limits
- [Release validation report](VALIDATION_REPORT.md) — dated evidence for the
  current release candidate
- [Physical validation protocol](PHYSICAL_VALIDATION.md) — required hardware
  checks before classroom approval
- [Project handoff](PROJECT_HANDOFF.md) — startup, verification, and continuation
  checklist
- [Roadmap](ROADMAP.md) — completed phases, remaining release gates, and
  deferred work

## Technical references

- [Task-space calculation](TASK_SPACE_CALCULATION.md) — derivation and mesh
  construction tutorial
- [Task Space Lab guide](../public/TASK_SPACE_LAB.md) — maintenance guide for
  the browser lesson in `public/task-space-lab.html`
- [MeArm geometry reference](reference-geometry/README.md) — measured model
  inputs and redesign constraints
- [Technology decision](TECHNOLOGY_DECISION.md) — selected stack and tradeoffs

## Plans and history

- [Polar coordinates mode plan](POLAR_COORDINATES_MODE_PLAN.md) — proposed,
  post-0.9 feature; it does not describe current behavior
- [UI refinement changelog](UI_REFINEMENT_CHANGELOG.md) — historical interface
  decisions and completed refinements

## Maintenance conventions

- Keep current behavior in the product, interface, architecture, language, and
  viewer documents; keep proposals clearly marked as proposed.
- Record time-sensitive test counts, build sizes, and browser evidence only in
  dated release material, then link to that evidence from summaries.
- Update documentation in the same change as supported syntax, sample lists,
  diagnostics, safety warnings, or simulation behavior.
- Keep one canonical document for each topic. The root-level roadmap,
  validation, and physical-validation files are compatibility links to the
  maintained documents here.
- Run `npm run check` before updating release evidence, and verify that local
  Markdown links still resolve.
