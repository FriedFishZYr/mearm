# UI refinement changelog

## 2026-08-30: design foundations

Groundwork for the next interface pass. No layout, control, or simulation
behavior changed; the 3D scene renders the same pixels. The work removes the
conditions that made the previous interface hard to change safely.

### Shared palette

- Added `src/design/palette.ts` as the single declaration for every color used
  in more than one place, exporting both CSS values and the `0x` numbers the
  Three.js scene needs.
- The module separates three kinds that were previously indistinguishable:
  unlit values that round-trip exactly to their CSS hex; material inputs that
  are rendered under two lights and never match their literal on screen; and
  `NO_EMISSIVE`, a sentinel that is not a color at all.
- `AxesHelper.setColors()` receives its arguments in Three's Y-up order, not
  the application's Z-up order. The call looks transposed and is correct; the
  reason now lives at the point of use as `AXES_HELPER_ARGS`.
- Every color literal in the stylesheet body and in the viewer modules is gone.
  `tests/palette.test.ts` asserts both, so the drift cannot return.

### Color corrections

- Collapsed the duplicate axis colors. The X axis was `#a93642` in two places
  and `#8f2f39` in a third; the Z axis was `#246b9e` and `#205f8c`. Both chip
  variants were removed in favor of the canonical tokens.
- Split the single `#246b5b` declaration into `--axis-y` and
  `--status-valid-text`. The bytes match today and the meanings do not.
- Renamed `--success`, `--warning`, and `--danger` to `--status-*-text`, and
  `--path-color` to `--path`.
- Named twelve previously untokenized chrome literals, including `--icon`,
  which reaches roughly ten SVG controls indirectly through `currentColor` and
  therefore undercounts in a naive usage grep.
- Deleted `--success-border` and `--success-soft`, which had no consumers
  because the success message is clipped to one pixel.
- Darkened `--text-subtle` from `#758087` to `#67727a`. The previous value
  measured 4.04:1 on white and 3.70:1 on the gutter, below the WCAG AA minimum
  at all nine of its uses, none of which qualified for the large-text exemption.

### Markup extraction

- Moved the workspace markup out of the `app.innerHTML` template literal in
  `src/main.ts` and into `index.html` as static markup. `src/main.ts` went from
  662 lines to 444.
- Added `src/views/presets.ts` for the copyable command chips, which are the
  only generated markup because they derive from
  `DEFAULT_PROFILE.approvedPoses`.
- Rewrote the release interface contract. It previously imported
  `src/main.ts?raw` and string-matched markup fragments against the module's
  source text, which made the markup unmovable regardless of correctness. It
  now reads `index.html` and asserts structurally: required ids and accessible
  names, no duplicate ids, every `aria-labelledby` target resolving, and every
  `get()` lookup in `main.ts` resolving against the document.

### Spacing scale

- Added `--space-2` through `--space-32` (2, 4, 6, 8, 12, 16, 24, 32 px). The
  2px and 6px steps exist because the interface has genuine micro-gaps that a
  bare 4px scale would double.
- Migrated 81 declarations. Only values within 1px of a step were moved; the
  rest were left literal rather than snapped without a browser to check them.

  | Value | Uses | Nearest step | Shift |
  | --- | ---: | ---: | ---: |
  | `.65rem` | 7 | 12px | −1.60 |
  | `1.25rem` | 2 | 16px | +4.00 |
  | `.85rem` | 2 | 12px | +1.60 |
  | `.9rem` | 2 | 16px | −1.60 |
  | `.6rem` | 1 | 8px | +1.60 |
  | `.62rem` | 1 | 8px | +1.92 |
  | `1.35rem` | 1 | 24px | −2.40 |
  | `.05rem` | 1 | 2px | −1.20 |

  These remain literal. They should be resolved by someone with the running
  application in front of them, not from source.

### Preset commands moved to the editor column

- The copyable pose, delay, and claw chips moved out of the inspector and into
  the editor panel. They are an authoring aid — you copy a command and paste it
  into the sketch — and they previously sat on the far side of the viewport
  from the editor they feed.
- This also relieved the inspector's height budget ahead of the type scale,
  without collapsing the joint-angle readout or pushing the safety notice below
  the fold. Both alternatives cost something the product needs.
- Renamed `.inspector-section` to `.panel-section`, since the collapsible
  section styling is now used in two columns.
- The inspector's medium-width grid lost its `presets` area accordingly.

### Preset commands restyled as an insert strip

Moving the chips without restyling them left an inspector panel sitting in the
editor column, which read as transplanted rather than intentional. The section
now belongs to the editor:

- The card treatment is gone. The strip shares the editor's surface color with a
  single hairline above it, rather than sitting in a bordered box.
- All chips take one treatment: the editor's monospace at a single size, so they
  read as fragments of the sketch you are about to paste rather than as buttons.
- The three groups now share a `label + wrapped chips` row, so poses, delays,
  and claw commands align as one palette instead of three differently shaped
  blocks. The pose row gained a visible "Pose" label to match the other two.
- The collapsed state is a thin bar, and the open state scrolls within a `38vh`
  cap, so the strip never competes with the code for height.
- Every chip row wraps, replacing the fixed column tracks that clipped.

### Type scale

- Added `--fs-micro` 12px, `--fs-label` 13px, `--fs-ui` 15px, `--fs-subhead`
  18px, `--fs-readout` 20px, `--fs-title` 24px, and `--fs-display` 32px,
  replacing 26 ad-hoc sizes across 46 declarations.
- The floor rises from 8.32px to 12px. The product specification requires the
  interface to be readable on classroom projectors, and it was not.
- `--fs-subhead` exists so panel titles and the brand do not jump from ~17px to
  24px. That jump would push the topbar past `--topbar-height`, and the
  workspace subtracts that token from `100vh`, so the page would gain a
  scrollbar on a layout designed not to scroll. That coupling is still present
  and should be replaced with grid-driven sizing before the bars grow again.
- `--fs-display` has no consumer yet; it is reserved for a projection mode.

### Overflows corrected with the larger type

- `.engineering-values dd` sized its value column with `7ch`, which resolved
  against the inherited 16px sans rather than the monospace value inside it —
  so the track was already measured against the wrong font. The element now
  carries the readout font, making `ch` mean what it appears to mean.
- The claw commands no longer share a row. `arm.closeClaw();` cannot fit beside
  another chip at a readable size, and the previous layout clipped mid-word
  with no ellipsis while the accessible name still reported the full command —
  a failure invisible to automated checks.
- The delay chips reflow instead of clipping; their fixed four-column track had
  no room to grow.
- The camera preset select's width cap no longer truncates "Isometric".
- The status bar wraps at all widths. Its only wrap rule applied below 780px,
  while its items are `nowrap`, so it overflowed horizontally above that.
- The playback transport wraps at all widths. At the UI step its four buttons,
  speed select, and Repeat toggle need roughly 312px against the 268–308px the
  inspector provides, and its only wrap rule also applied below 1180px only.
- The viewport toolbar wraps and is width-capped. It needs roughly 380px against
  a 440px minimum stage, and `.stage` clips rather than scrolls, so the
  rightmost toggles would have disappeared silently.
- The Free-form limits panel returned to the micro step. It is a reference
  overlay on the 3D scene rather than a control; at the UI step its `nowrap`
  content grew wide enough to collide with the viewport toolbar.

These four are one failure mode: a flex row with no `flex-wrap` at desktop,
holding content that grew by a third when the type floor rose. Wrap rules that
existed only inside a breakpoint were the common thread. Worth checking for
directly the next time a type or density change lands.

### Transport moved beneath the viewport

- Playback and the execution timeline left the inspector and became a single
  full-width bar directly under the 3D view: transport buttons, scrubber,
  elapsed/total, speed, and repeat in one row that wraps at narrow widths.
- The stage and the bar now share a `.viewport-column` grid wrapper, which is
  the workspace's middle grid child; both responsive breakpoints were repointed
  from `.stage` to it.
- The primary action of the product is "play the program". It was a 46×34px
  button two-thirds of the way down a 300px sidebar, diagonally opposite the
  Preview button, with the viewport it controls in between.
- The inspector is now four state sections — command, position, angles, safety —
  and its medium-width grid lost the `playback` and `timeline` areas.
- Elapsed and total read inline as `0:04.0 / 0:08.7`. The words "Elapsed" and
  "Total" are retained as screen-reader text.
- `timeline-title` was removed with its section; the scrubber keeps its own
  accessible name. `playback-title` became a visually hidden heading labelling
  the bar.

### Execution timeline drawn as command blocks

- The scrubber now renders one proportional block per command, coloured by what
  the robot is doing: the motion-path indigo for movement, a darker step for
  claw actions, and a neutral for `delay()`.
- This satisfies a requirement in `PRODUCT_SPEC.md` — distinguishing movement
  time from explicit `delay()` time — that nothing in the interface previously
  met. The former tick marks only flagged movement endpoints.
- Indigo is reused from the scene's motion path deliberately, so one hue means
  "the robot is doing something" in both the viewport and the chrome. Waiting is
  neutral because it is the absence of motion and needs no competing hue.
- The blocks are painted beneath the existing `<input type="range">`, which is
  made transparent and keeps every interaction, its accessible name, and
  keyboard scrubbing; its thumb is styled as a playhead. The block layer is
  `aria-hidden` and takes no pointer events, so no behaviour changed.
- On the student starter sketch the bar shows, without a word of explanation,
  that 6.00 of its 8.65 seconds are `delay()`.

### Preset chips insert at the caret

- Clicking a chip now inserts the command into the sketch at the caret rather
  than copying it to the clipboard. Alt-click still copies.
- This follows observed classroom use: students reach for these chips
  constantly, so the click / click / position caret / paste round trip was being
  repeated dozens of times a lesson.
- The pedagogically important decision is preserved. The student still chooses
  where the command goes by placing the caret, which is the lesson about command
  order; only the clipboard hop disappears.
- If the caret sits after existing code the command starts a new line and
  matches the surrounding indentation, so the sketch stays one statement per
  line. Before the editor has been focused, the command lands on the last line
  inside `loop()`.
- The insertion dispatches the same `input` event that typing does, so
  highlighting, the gutter, the line count, and the stale-preview flag all
  update through the existing path rather than a parallel one.
- `const lineHeight = 20` became the shared `EDITOR_LINE_HEIGHT`, removing one
  of the four independent copies of the editor grid constant.

### Diagnostics that teach

- A successful compile is visible again. `.editor-message.success` was clipped
  to one pixel, so a beginner received no confirmation that anything had worked
  — arguably the most important message in a first programming lesson. It now
  shows quietly beside the editor.
- Errors echo the offending source line beneath the message, and add a hint
  keyed to the diagnostic code. The parser's messages state the rule that was
  broken; the hints say what to do instead. "delay() requires a non-negative
  integer literal" now sits above "delay() takes a whole number of
  milliseconds, like delay(500);".
- Nineteen codes carry hints, covering the errors a beginner is most likely to
  hit: missing setup/loop/begin, unclosed braces, custom functions, unsupported
  statements, unknown pins, and Free form bounds.
- The echoed source line is escaped before it reaches `innerHTML`. It is
  student-authored text, and the product's safety claim is that pasted source is
  never executed. Both the escaping and the absence of dead hint keys are
  asserted.
- The echoed line and the hint are `aria-hidden`: the editor has already
  selected the offending line, so the live region announces the concise message
  only.

### Simulation profile

- The dialog titled "Robot settings" is now "Simulation profile", in the topbar
  button, the dialog heading, and the close button's accessible name.
- The old title contradicted the paragraph directly beneath it, which explains
  that these values change only the preview and do not calibrate hardware. On a
  product whose central safety boundary is that distinction, the title was the
  wrong thing to get casually wrong.
- `docs/CLASSROOM_INTERFACE.md` and `README.md` follow the new name.

### Example gallery

- The eight bundled sketches left the topbar `<select>` for a modal gallery,
  grouped as **Lessons** (open these and change the code), **Dances** (complete
  routines to watch), and **Industrial routines**. The grouping follows the
  categories already used in this documentation set.
- Every sketch carries a one-line description written for a student. The
  dropdown gave no way to tell that "Student starter" is an exercise to edit
  while "Palletizing" is a routine to watch.
- Each card shows its command count and loop duration, **measured** by compiling
  the sketch with the real timeline builder when the gallery opens. Hand-written
  figures would go stale the first time a sketch changed; a test asserts they
  are computed rather than typed.
- The topbar control became a button showing the active example, which reads
  "Edited sketch" once the source diverges — the state the disabled
  `<option value="custom">` used to carry.
- `src/views/examples.ts` now owns the sample registry, the `SampleMode` union,
  the descriptions, and the grouping. `src/main.ts` lost eight sketch imports.
- The gallery is a native `<dialog>`, matching the simulation profile dialog, so
  focus trapping and Escape-to-close come from the platform.

### Lesson strip

- The teaching sketches already carried their lesson in comments: a
  `PROJECT GOAL` paragraph and numbered `// TODO n - TITLE` steps with
  prediction prompts beneath them. None of it was visible unless a student
  scrolled the source and happened to notice.
- `src/app/lesson.ts` extracts that structure and a strip at the top of the
  inspector shows the goal plus each step, with its prompt. Clicking a step
  jumps to the line it asks the student to change.
- The strip started in the editor column and moved. Once it existed there, the
  authoring column carried the lesson, the code, and the insert chips all
  competing for the same height, while the inspector held four short readouts
  and a lot of air. Of those three the insert chips are the only ones used
  constantly while typing, so they kept the space beside the caret. The
  inspector now reads "what to do" above "what is happening".
- The lesson is extracted, not duplicated. An instructor writes a lesson by
  editing the `.ino` file — which is how this product is actually used — and the
  interface follows. No lesson metadata lives in TypeScript.
- Nothing is required of a sketch. One with no goal and no TODO comments has no
  lesson and the strip stays hidden; seven of the eight bundled sketches are in
  that state today.
- The source is re-read on every edit so step line numbers stay correct as the
  student types, but the strip is only re-rendered when the lesson actually
  changes — otherwise a keystroke would rebuild the buttons and drop focus from
  one mid-use.
- `tests/lesson.test.ts` covers extraction against the real bundled sketches,
  including the cases that must produce nothing.

### Brand mark

- The mark is now the arm's own silhouette — base, column, upper arm, forearm,
  gripper — drawn as inline SVG, replacing a blue square containing the letter
  M. That square was the first thing anyone saw and read as a placeholder.
- The same glyph is the browser tab icon, declared as an inline `data:` URI so
  the page still ships no external runtime asset. `scripts/verify-offline.mjs`
  rejects only `http(s)://` and protocol-relative references, so a data URI
  passes and the offline guarantee is unchanged.

### Protected invariants

- The code editor is a transparent textarea over a highlighted copy of the same
  text beside a line-number gutter. Three stylesheet rules and one constant in
  `src/main.ts` encode that grid, and none can be derived from the others. The
  spacing scale exempts them and `tests/palette.test.ts` now asserts they agree.
- The collapsible inspector sections rely on a negative summary margin exactly
  cancelling the section padding. Both sides moved to the same tokens together.

### Verification

- 95 automated tests across 12 files pass, up from 57. Strict TypeScript
  checking, the production build, and offline asset verification pass.
- The stylesheet now sets no color literal outside `:root` and no font size
  outside the editor text grid, both asserted.
- `vite.config.ts` sets `test.css: true`. Vitest stubs CSS imports to an empty
  module by default, which also silences `?raw`, and the palette contract needs
  to read the stylesheet.
- Not yet checked in a browser. The automated gate covers the boot-crash class
  thoroughly but cannot see a visual regression.

## 2026-07-14: engineering-workspace refinement

Implemented the adopted design principles below across the workspace chrome.
The 3D scene, parser, kinematics, timeline, playback, clipboard, and settings
behavior are unchanged; every existing control keeps its element id, event
wiring, and accessible name.

### Status bar consolidation

- Added a single slim status bar across the bottom of the application (VS
  Code pattern) containing the validity state, the preview state ("Preview
  current" / "Changes not previewed"), the compile message with command
  count, the current robot pose, the camera view, the line count, keyboard
  and orbit hints, and the axis color key.
- Removed the editor footer and the viewport camera/pose overlay; their
  contents moved into the status bar.
- The validity pill moved from the inspector header into the status bar and
  remains the polite live region.
- Success compile messages now announce through a visually collapsed live
  region instead of the previous green banner strip; warning and error
  diagnostics keep the visible line-linked strip above the editor.

### Viewport toolbar

- Fit, Reset, Path, Task space, Grid, and Axes are now icon-only controls
  with tooltips. Their text labels remain in the markup as visually hidden
  accessible names. The camera preset dropdown keeps its visible label.
- Pressed toggles keep the filled light-blue tint with no blue outline.

### Playback transport

- Back, Restart, Play/Pause, and Next are now a compact icon transport
  cluster; only Play carries the accent fill. The Play button swaps
  play/pause icons and updates its accessible name and pressed state.
- The playback-settings section merged into the transport row: the speed
  select and Repeat checkbox sit beside the transport buttons.

### Execution timeline

- The scrubber now shows waypoint tick marks at the completion time of each
  movement command, colored to match the motion path (muted indigo) so the
  timeline cross-references the viewport.

### Inspector density

- Section labels are 11 px uppercase; value rows use tighter engineering
  spacing.
- Current command, Claw position, Joint angles, and Preset commands are
  collapsible sections (native details/summary, default open). Playback,
  the execution timeline, and the physical-robot safety notice are always
  visible.
- The source-line link moved beside the current command readout.

### Preset commands

- Approved poses render as compact monospace chips (HOME, LEFT, RIGHT,
  HIGH, LOW). The full command is available on hover and to assistive
  technology via the tooltip and accessible label, and click-to-copy
  feedback is unchanged.

### Resizable panels

- The editor and inspector panels have draggable resize handles at desktop
  widths, with keyboard support (arrow keys) and clamped widths. Medium and
  narrow stacked layouts are unchanged and hide the handles.

### Tokens

- Chrome corner radii tightened to 4 px controls and 3 px small elements.
- Added a `--path-color` token for the scene's motion-path indigo so chrome
  references stay consistent.

### Verification

- All 51 automated tests across 10 files pass; strict TypeScript checking,
  the production build, and offline asset/CSS verification pass.
- Development-browser checks at 1440 × 900, 1280 × 800, 1024 × 800, and
  390 × 844 confirmed: no horizontal overflow and no console errors; play,
  pause, and transport stepping; section collapse and re-open; keyboard and
  pointer panel resizing; icon-toggle accessible names; chip copy feedback;
  and the error flow (line-linked strip, status-bar mirror, disabled
  playback) with recovery.

## 2026-07-14: adopted UI design principles

The following principles govern the next round of interface refinement. They
were adapted from an external design-principles draft against the current
0.9.0 interface. The goal: an interface that reads as professional engineering
software (Onshape, Foxglove, VS Code) calibrated for high-school students —
real, not toy-like. Litmus test: would a student screenshot this and believe
it is software engineers actually use?

### Scope and constraints

- Applies to the workspace chrome only: header, editor column, viewport
  toolbar and status row, inspector, and dialogs.
- The 3D scene is out of scope: the arm model, materials, motion path,
  task-space envelope, grid, axes, coordinate labels, and target marker stay
  exactly as shipped.
- No new runtime dependencies; Three.js remains the only production
  dependency. Icons are inline SVG; tooltips are native or CSS.
- The native textarea remains the editable, accessible editor control.
- Existing accessibility contracts are a floor, not a target: accessible
  names on every control, `:focus-visible` indicators, reduced-motion
  support, touch-target sizes, and live status announcements. Refinements
  must pass the automated interface-contract tests or update them
  deliberately.

### Color: one accent; every color means exactly one thing

| Role | Color | Usage |
| --- | --- | --- |
| Accent / interaction | `#1F6FEB` | Primary buttons, active states, selection, execution progress |
| Accent hover/pressed | `#1A5FC9` | Darker step of the accent |
| Active toggle fill | `#DDEBFD`, text `#0C447C` | Pressed toolbar toggles — filled tint, never a blue outline |
| Chrome / background | `#F5F6F8` family | Cool-tinted neutral grays, never warm |
| X / Y / Z axes | Red / Green / Blue | Reserved; semantic "Valid" green is the only other green |
| Task-space envelope | `#4FA8B3` (scene, fixed) | Never reused in chrome |
| Motion path | `#7568C5` muted indigo (scene, fixed) | Never reused in chrome |

- If a color could be confused with an axis, it is the wrong color.
- Saturation is for meaning; large surfaces stay desaturated.
- When chrome references a scene entity (waypoint ticks, path mentions), it
  echoes the scene color rather than the accent, so the viewport and panels
  stay cross-referenced without repainting the scene. The original draft's
  accent-colored path and amber end-effector were dropped because both would
  require scene changes.

### Hierarchy and density

- Contrast in size and loudness: a few large, prominent elements (viewport,
  Play) and many small, quiet ones. Uniform medium-sized controls are the
  biggest "generated UI" tell.
- The inspector stays dense: 11–12 px uppercase section labels, roughly
  28 px rows, collapsible sections, and monospace numbers right-aligned with
  lower-contrast units.
- One primary button per region; everything else is secondary (outlined) or
  ghost.

### Controls

- Icon-only toggle clusters with tooltips in the viewport toolbar, replacing
  the labeled pills. Pressed state is a filled tint. Every icon-only control
  keeps an accessible name.
- Transport-style playback: a compact icon cluster (back / restart / play /
  next / speed) where only Play carries the accent fill.
- Timeline with waypoint tick marks so the scrubber doubles as a teaching
  tool; the playback sampler already extracts unique destinations.
- Group with hairline dividers and background shading, not boxes inside
  boxes. Corner radius 2–4 px on chrome.

### Structure

- Three resizable panels (editor, 3D viewport, inspector) with drag handles
  at desktop widths only; the existing medium and narrow stacking layouts are
  preserved.
- One slim status bar (VS Code pattern) consolidating validity, command
  count, line count, current pose, and camera view — absorbing the
  commands-ready strip, the editor line-count footer, and the viewport
  camera caption. Two carve-outs: parser and kinematic diagnostics keep
  their line-linked presentation near the editor, and the physical-safety
  notice remains visible in the inspector as a product safety requirement.
- Presets render as compact monospace chips; hover reveals the full command
  and click copies. The full command stays reachable without hover, and copy
  feedback remains visibly and audibly announced per existing contracts.

### North stars

| Reference | Steal this |
| --- | --- |
| Wokwi | Overall restraint; closest product category |
| Foxglove Studio | Inspector-panel density for live robot state |
| Onshape | Viewport toolbar: view dropdown, icon toggle clusters |
| VS Code | Status bar; code-editor conventions |
| Tinkercad Circuits | Lower bound — we lean more "real tool" |

## 2026-07-13: education-first workspace refinement

The MeArm Classroom Motion Lab interface was refined into a more compact,
engineering-oriented workspace. The work was intentionally visual and preserves
the existing editor, parser, playback, kinematics, robot state, and simulation
data flow.

## Application shell

- Rebalanced the desktop workspace around the existing editor, viewport, and
  inspector columns, with the 3D canvas remaining the dominant region.
- Replaced broadly green-tinted surfaces with white and cool neutral gray.
- Uses engineering blue (`#1F6FEB`) for primary actions, active controls,
  selections, focus indicators, and current execution progress. Green is
  reserved for semantic valid and success states.
- Reduced card treatments, corner radii, decorative spacing, and shadows in
  favor of flat panels and precise 1 px separators.
- Preserved the existing medium-screen and small-screen stacking behavior.

## Code editor

- Refined the editor into a focused IDE-style surface with synchronized syntax
  highlighting for Arduino comments, directives, types, functions, literals,
  numbers, strings, and operators.
- Preserved the native textarea as the editable and accessible control, including
  line numbers, selection, scrolling, keyboard behavior, and active-line state.
- Flattened preview readiness and diagnostic messages into compact status strips.
- Kept the preview shortcut and editor metadata visible but understated.

## 3D viewport

- Changed the scene and floor treatment to neutral engineering-canvas colors.
- Increased visual separation between the robot, motion path, axes, grid, and
  background without adding visual effects.
- Replaced the large floating controls with a compact viewport toolbar containing
  Fit, Reset, camera presets, Path, Grid, and Axes controls.
- Added a compact camera-state/status bar and retained keyboard-accessible names
  and tooltips for viewport controls.
- Added visible X, Y, and Z axis labels and a small color key.
- Added coordinate labels for the unique points travelled by the arm during the
  parsed program.

## Simulation inspector

- Reorganized the inspector into flat sections for simulation status, current
  command, claw position, joint angles, playback, settings, execution timeline,
  and physical-robot safety.
- Kept the validation state as a compact status pill and retained the existing
  live status announcement.
- Aligned coordinate and joint values in compact engineering rows using tabular
  monospace numerals and separate, lower-contrast units.
- Kept Play/Pause as the primary action while Back, Restart, and Next remain
  neutral controls.
- Refined the timeline into an execution scrubber with distinct elapsed and total
  timing labels.
- Reduced the safety notice's visual weight while keeping it visible in the
  normal desktop inspector height.
- Added an explicit three-column inspector layout at medium widths and a
  single-column layout on narrow screens without changing control order.

## Implementation files

- `index.html`: application metadata and shell presentation support.
- `src/app/highlight.ts`: safe Arduino syntax-highlighting output.
- `src/main.ts`: refined workspace markup, viewport controls, coordinate labels,
  and inspector presentation.
- `src/styles.css`: neutral design tokens, compact component treatments, and
  responsive layouts.
- `src/viewer/arm-model.ts`: refined robot material contrast.
- `src/viewer/playback.ts`: extraction of travelled coordinates for display.
- `src/viewer/scene.ts`: viewport tools, camera presets, axes, and coordinate
  label rendering.
- `tests/highlight.test.ts` and `tests/playback.test.ts`: coverage for syntax
  highlighting and travelled-coordinate extraction.

## Preserved behavior

- No new UI framework or runtime dependency was introduced.
- No playback controls, timing calculations, command parsing rules, kinematic
  calculations, robot motion, or public component APIs were changed.
- No gradients, glass effects, large shadows, decorative animation, or
  placeholder controls were added.
- Accessibility labels, focus indicators, live status text, reduced-motion
  behavior, and touch target rules remain in place.

## Verification

- All 50 automated tests across 10 test files pass after the follow-up feature
  work described below.
- Strict TypeScript checking passes.
- The optimized Vite production build passes.
- The final inspector was visually checked at 1280 x 720, 1024 x 800, and
  375 x 812 with no horizontal overflow or browser console errors.
- Play/Pause and previous/next command interaction smoke checks pass.

The existing Vite advisory for the uncompressed Three.js bundle remains a
non-blocking performance notice and is unrelated to these UI refinements.

## 2026-07-13: classroom editing follow-up

- Added copyable HOME, LEFT, RIGHT, HIGH, LOW, common delay, and open/close claw
  commands to the inspector.
- Added a minimal Free form example with inclusive X `-100..100`, Y `100..200`,
  and Z `0..150` millimeter validation and an on-canvas limits reminder.
- Added Reset code for restoring the active bundled example.
- Added accessible, clickable command checkpoints in the editor gutter.
- Changed startup and repeat defaults so playback begins paused and repeat is
  opt-in.
- Added automated contracts for the new controls, clipboard wiring, bounds,
  and command navigation.

These follow-up flows have automated coverage. They remain listed in
`VALIDATION_REPORT.md` for an explicit final production-browser pass.

## 2026-07-13: engineering blue colorway

- Updated Preview code and Play/Pause to solid engineering blue (`#1F6FEB`),
  with `#1A5FC9` for hover states.
- Updated pressed viewport toolbar controls to a light blue (`#DDEBFD`) with
  dark blue text (`#0C447C`).
- Retained green for valid and success states, plus the existing warning,
  danger, and axis colors.
- Set the reachable task-space surface and grid to muted cyan (`#4FA8B3`) so
  the visualization remains distinct from both engineering-blue controls and
  semantic status colors.
- Set the motion path to muted indigo (`#7568C5`) so it stays distinct from the
  task-space volume, controls, axes, and semantic status colors.
- Shifted the application chrome to the cool neutral `#F5F6F8` background.
- Changed presentation colors only; layout, content, interaction, and simulation
  behavior are unchanged.
