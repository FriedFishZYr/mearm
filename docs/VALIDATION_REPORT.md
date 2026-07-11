# Release validation report

## Candidate

- Product: MeArm Classroom Motion Lab
- Candidate version: 0.9.0
- Review date: 2026-07-11
- Status: browser-validated release candidate; physical validation intentionally deferred

## Automated results

| Check | Result | Evidence |
| --- | --- | --- |
| Unit and integration tests | Pass | 39 tests across 8 files |
| Classroom sample parsing | Pass | Instructor and student fixtures |
| Approved pose endpoint accuracy | Pass | All five poses within 0.5 mm |
| Strict TypeScript checking | Pass | No diagnostics |
| Production build | Pass | Static Vite output generated |
| Production HTTP smoke test | Pass | Entry page and both generated assets returned successfully |
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

## Interactive browser validation

The production preview was exercised in the Codex in-app Chromium browser at
the default 1274 x 974 viewport and at a 390 x 844 phone viewport.

| Check | Result | Evidence |
| --- | --- | --- |
| Initial WebGL render | Pass | Arm, grid, path, status, and inspector rendered |
| Sample switching | Pass | Instructor sample loaded 29 commands; student sample also loaded |
| Parser diagnostics | Pass | Unsupported control flow selected and reported source line 3 |
| Invalid-preview safety | Pass | Playback disabled instead of retaining an old valid timeline |
| Playback | Pass | Play/pause timing, restart, next command, and 2x speed selection checked |
| Viewer options | Pass | Axes toggle changed state; canvas remained visible |
| Settings | Pass | Zero-length L1 was rejected; reset/apply restored a valid preview |
| Phone layout | Pass | All three regions remained available with no horizontal overflow |
| Console errors | Pass | No console errors observed |

This browser pass does not claim full cross-browser, touch-gesture, assistive
technology, keyboard-only, reduced-motion, or network-disconnected manual
coverage. Those checks remain recommended before broad classroom deployment;
the generated build's offline asset contract is covered automatically.

## Deferred: physical MeArm comparison

The classroom MeArm is not yet fully assembled, so physical comparison is
paused. Complete the protocol in `PHYSICAL_VALIDATION.md` after assembly and
calibration, before approving version 1.0.

## Release decision

Version 0.9.0 is suitable for local web demonstrations and future classroom-arm
validation. Software work is paused at this checkpoint. It is not yet approved
as a classroom-ready 1.0 release.
