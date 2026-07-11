# Release validation report

## Candidate

- Product: MeArm Classroom Motion Lab
- Candidate version: 0.9.0
- Review date: 2026-07-11
- Status: software release candidate; external validation pending

## Automated results

| Check | Result | Evidence |
| --- | --- | --- |
| Unit and integration tests | Pass | 39 tests across 8 files |
| Classroom sample parsing | Pass | Instructor and student fixtures |
| Approved pose endpoint accuracy | Pass | All five poses within 0.5 mm |
| Strict TypeScript checking | Pass | No diagnostics |
| Production build | Pass | Static Vite output generated |
| Offline runtime assets | Pass | Document references only local build assets |
| Dependency audit | Pass | No known vulnerabilities reported |
| External fonts, scripts, or styles | None | Offline verifier checks generated HTML and CSS |

The production JavaScript bundle is approximately 150 KB compressed. The build
tool reports that its uncompressed Three.js-containing chunk exceeds the
default 500 KB advisory threshold. This is a performance advisory, not a build
failure; no additional runtime dependency was introduced.

## Accessibility and responsive source checks

Automated source contracts confirm:

- accessible names for the code editor, timeline, canvas, and servo-limit
  fields,
- textual valid, caution, invalid, and code-error states,
- visible `:focus-visible` rules,
- keyboard shortcuts and native dialog behavior,
- reduced-motion startup behavior,
- desktop, medium, and small-screen layout rules.

These checks do not replace interaction with a real browser or assistive
technology.

## Pending: interactive browser validation

The in-app browser could not initialize because its runtime was denied access
to its installed files by the current desktop permission boundary. No alternate
browser automation mechanism was substituted.

Before approval, test current Chrome and Edge at desktop, tablet, and phone
widths. Confirm:

1. The WebGL arm renders without a console error.
2. Orbit, zoom, and reset view work with mouse and touch input.
3. Both samples load and preview.
4. An intentional parser error selects and reports the correct line.
5. Play, pause, restart, step, scrub, speed, and repeat behave correctly.
6. Settings validation, reset, apply, Escape, and focus return work.
7. Keyboard-only navigation follows a logical order with visible focus.
8. Status text remains understandable without color.
9. Reduced-motion mode begins paused.
10. The production build reloads while the network is disabled.

## Pending: physical MeArm comparison

No serial device was detected during this review. Complete the protocol in
`PHYSICAL_VALIDATION.md` with the classroom arm before approving version 1.0.

## Release decision

Version 0.9.0 is suitable for software review and browser/hardware validation.
It is not yet approved as a classroom-ready 1.0 release.
