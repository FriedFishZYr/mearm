# Release validation report

## Candidate

- Product: MeArm Classroom Motion Lab
- Candidate version: 0.9.0
- Documentation review: 2026-07-16
- Status: software release candidate; final browser and physical gates remain

## Current automated results

| Check | Result | Evidence |
| --- | --- | --- |
| Unit, integration, and interface-contract tests | Pass | 57 tests across 10 files |
| Bundled classroom sketches | Pass | Four complete dance timelines plus Free form mode contracts |
| Approved pose endpoint accuracy | Pass | All five poses solve; round trips stay within 0.5 mm |
| Free form coordinate envelope | Pass | Inclusive limits and out-of-bounds rejection covered |
| Strict TypeScript checking | Pass | No diagnostics |
| Production build | Pass | Static Vite output generated |
| Offline runtime assets | Pass | Generated document/CSS references are local |
| Required release CSS | Pass | Focus, responsive, and reduced-motion rules found |

The 2026-07-16 production build generated approximately 651.09 kB of
JavaScript (168.48 kB gzip) and 23.88 kB of CSS (5.51 kB gzip). Vite reports a
non-blocking advisory because the minified Three.js-containing JavaScript chunk
exceeds 500 kB. This is a performance consideration, not a correctness failure.

A dependency audit recorded on 2026-07-11 reported no known vulnerabilities.
It was not rerun as part of this documentation-only review.

## Automated interface contracts

Source-level tests confirm the presence and wiring contracts for:

- accessible names for the editor, command-marker gutter, timeline, canvas,
  settings fields, preset groups, and Free form limits;
- textual valid, caution, invalid, and code-error states;
- disabling playback after a failed preview;
- copyable approved-pose, delay, and open/close claw commands;
- clickable command markers and timeline scrubbing;
- Instructor, Student, House shape, Cyberpunk beat, and Free form sample
  selection; and
- viewport, settings, and playback controls.

The offline verifier also checks `:focus-visible`, narrow responsive layout,
and reduced-motion CSS. These source contracts do not replace interaction with
a real browser or assistive technology.

## Recorded interactive browser evidence

The production preview was previously exercised in the Codex in-app Chromium
browser at 1274 × 974 and 390 × 844. That pass covered:

- initial WebGL rendering;
- Instructor and Student sample switching;
- line-linked parser diagnostics;
- disabling stale playback after an invalid preview;
- play/pause, restart, next command, timeline, and speed behavior;
- axes visibility;
- invalid and restored settings;
- phone-width layout without horizontal overflow; and
- a clean browser console.

A later UI-refinement pass checked 1280 × 720, 1024 × 800, and 375 × 812,
including Play/Pause and previous/next command smoke checks, with no reported
horizontal overflow or console errors.

A development-browser check on 2026-07-13 confirmed that the Task space overlay
starts hidden, toggles on without console errors, participates in **Fit**, and
remains enabled after the settings flow rebuilds the Three.js scene.

## Remaining manual browser gate

The recorded passes do not explicitly cover every feature added afterward.
Before 1.0, verify the current production build for:

1. all five samples load and render, including Free form limit display,
   inclusive boundary values, and line-linked failures;
2. pose, delay, and claw clipboard actions, including visible/announced feedback;
3. gutter command checkpoints and the inspector source-line link;
4. Reset code for all five examples and complete playback of the House shape
   and Cyberpunk beat dances;
5. every camera preset and viewport visibility toggle;
6. repeat, Back, scrub, and all playback speeds;
7. keyboard-only navigation and visible focus;
8. current Chrome and Edge behavior at desktop and touch widths;
9. reduced-motion and assistive-technology behavior; and
10. a production reload with network access disabled.

## Deferred physical comparison

The classroom MeArm is not yet fully assembled. Complete
[PHYSICAL_VALIDATION.md](PHYSICAL_VALIDATION.md) after assembly and calibration.
All five approved poses, claw direction, stops, clearance, timing/order, and a
complete instructor dance must pass before 1.0 approval.

## Release decision

Version 0.9.0 is suitable for local demonstrations and continued review. The
automated software gate is green, but the release is not yet approved as a
classroom-ready 1.0 because the final manual browser gate and physical-arm
protocol remain open.
