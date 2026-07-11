# Project handoff

## Stopping point

Development is paused at version 0.9.0 after successful software and Chromium
browser validation. The physical MeArm comparison is deferred because assembly
is incomplete. No software blocker is known for local demonstrations.

## Start the website

From the `mearm` project folder:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173/`.

To inspect the production build:

```sh
npm run build
npm run preview
```

The preview URL is normally `http://localhost:4173/`.

## Re-run the release gate

```sh
npm run check
```

This runs the tests, strict type check, production build, and offline asset
verification. A clean result currently reports 39 passing tests.

## Recommended use now

- Demonstrate the instructor and student sketches.
- Paste or edit code that follows `SKETCH_LANGUAGE.md`.
- Treat reachability and servo-limit results as simulation guidance.
- Keep the on-screen physical-safety reminder visible during instruction.

## Work intentionally deferred

When the arm is assembled, complete `PHYSICAL_VALIDATION.md`. Record the exact
link lengths, servo limits, home pose, pin assignments, power arrangement, and
differences between simulated and physical motion. Any calibration changes must
be reflected in the robot profile and revalidated with `npm run check`.

Before a broad classroom 1.0 release, also consider manual checks in current
Chrome and Edge, touch gestures, keyboard-only navigation, an assistive
technology pass, reduced-motion behavior, and a network-disconnected reload.

## Release rule

Do not label the project 1.0 or claim physical accuracy until every acceptance
requirement in `PHYSICAL_VALIDATION.md` passes on the completed classroom arm.
