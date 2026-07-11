# Technology decision

## Status

Accepted for the first release on 2026-07-10.

## Decision

Use a static, framework-free TypeScript application with:

- Node.js 24 LTS and npm for local development,
- Vite 8 for the development server and optimized static build,
- TypeScript 7 in strict mode,
- Three.js for the Phase 2 scene graph, camera, and WebGL rendering,
- Vitest 4 for parser, kinematics, timeline, and later browser-facing tests.

The production application has one external runtime dependency: Three.js. The
simulation core does not import it and can be tested without WebGL or a DOM.

## Reasons

- The project is a single-purpose interactive tool and does not currently need
  a UI component framework.
- Three.js provides mature transform hierarchies and camera controls without a
  physics engine.
- Vite builds offline-capable static assets and shares its transform pipeline
  with Vitest.
- Strict TypeScript catches unsafe parser and timeline state assumptions early.
- A small dependency surface supports classroom reliability and long-term
  maintenance.

## Deferred alternatives

- React, Vue, Svelte, and similar frameworks: defer until interface complexity
  demonstrates a need.
- Monaco or CodeMirror: begin with a native text area to avoid a large editor
  dependency.
- Physics engines: the first release is a deterministic kinematic preview, not
  a torque or collision simulator.
- Playwright and downloadable browser binaries: reconsider when end-to-end
  interaction and visual regression coverage are implemented.
- In-browser Arduino/C++ compilation: explicitly outside the first-release
  scope.

## Consequences

- UI state and accessibility behavior must be implemented directly with browser
  APIs.
- The application can be hosted as static files with no account or backend.
- Node is a development requirement only; students do not need it to use a
  deployed viewer.
- Dependency versions are recorded in `package-lock.json` for reproducibility.
