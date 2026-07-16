# Supported sketch language

## Why a subset is necessary

An Arduino sketch is C++, and safely compiling and running arbitrary C++ in a
browser would make the viewer much larger and more complex. The first viewer
therefore parses a deliberately small language matching the beginner dance
lesson.

The viewer is a previewer for supported motion commands, not a general Arduino
emulator.

## Supported structure

The current parser recognizes:

- line and block comments,
- `#include` lines, which are ignored after lexical validation,
- a global `MeArm` declaration,
- integer pin declarations using numeric literals,
- `setup()` and `loop()` functions,
- sequential statements inside those functions,
- optional whitespace and trailing comments.

The primary arm variable may have a valid C++ identifier such as `arm`. Calls
must use the same declared identifier.

## Supported calls

```cpp
arm.begin(basePin, shoulderPin, elbowPin, clawPin);
arm.moveToXYZ(x, y, z);
arm.snapToXYZ(x, y, z);
arm.openClaw();
arm.closeClaw();
delay(milliseconds);
```

For the first release, coordinates and delays must be finite numeric literals.
Unary `+` and `-` and decimal values are accepted for coordinates. Delays must
be non-negative integers. Pin arguments may be declared integer identifiers or
integer literals.

The language is the same in all five bundled examples. Free form mode adds an
application-level coordinate envelope—X `-100..100`, Y `100..200`, and Z
`0..150` millimeters—before the same kinematic and servo-limit checks. That
mode-specific envelope does not change the parser grammar.

`begin()` establishes the initial HOME position and opens the claw, matching
the source library. Pin values are displayed for review but do not change the
3D model.

## Comments

The parser must ignore both forms:

```cpp
// arm.moveToXYZ(0, 120, 40);

/*
  arm.closeClaw();
*/
```

Comment handling is essential because the student starter intentionally
contains commented example commands.

## Execution model

- `setup()` executes once.
- `loop()` executes from top to bottom.
- When repeat is enabled, `loop()` begins again after its final statement.
- Commands outside `setup()` and `loop()` are declarations, not timeline
  actions.
- Empty statements are ignored.

The parser does not infer intent from prose comments such as `HOME` or `LEFT`.
Only active supported statements affect animation.

## Movement behavior

### `snapToXYZ(x, y, z)`

Solve inverse kinematics and change the target pose immediately when the point
is valid. The source implementation does not add a delay for this call.

### `moveToXYZ(x, y, z)`

Match the source `MeArm.cpp` algorithm:

1. Record the current Cartesian point `(x0, y0, z0)`.
2. Calculate straight-line distance `dist` to the target.
3. For `i = 0; i < dist; i += 10`, solve and apply the interpolated point at
   fraction `i / dist`, then consume 50 ms.
4. Solve and apply the exact target, then consume another 50 ms.

Thus, a nonzero movement has `ceil(dist / 10) + 1` timed samples. A zero-length
movement still consumes the final 50 ms.

Every interpolated point must be validated. It is not sufficient to validate
only the endpoint.

### Claw calls

`openClaw()` and `closeClaw()` each consume 300 ms in the source library. The
viewer animates the visual claw during that interval.

### `delay(milliseconds)`

Holds the current pose and claw state for exactly the specified simulated
duration.

## Initial state

The default initial position is `(0, 100, 50)` mm. Before `begin()` has been
encountered, playback is unavailable and the UI explains that initialization
is required.

After `begin()`, the arm is at HOME with the claw open. The 300 ms delay caused
by `openClaw()` during `begin()` is represented in setup timing.

## Explicitly unsupported in the first release

- Variables used as movement coordinates or delay values.
- Arithmetic expressions in calls.
- Custom functions.
- `for`, `while`, `do`, `if`, `switch`, and recursion.
- Arrays, objects, macros, and generated commands.
- `moveTo()` and `snapTo()` cylindrical-coordinate calls.
- Calls through pointers, references, aliases, or multiple arm instances.
- Arbitrary Servo or Arduino APIs.
- Serial input, joystick input, sensors, interrupts, or real-time branching.

Unsupported executable statements inside `setup()` or `loop()` cause a
line-numbered error. The viewer must not silently skip them, because doing so
could produce a misleading preview.

## Example

```cpp
#include "MeArm.h"
#include <Servo.h>

MeArm arm;
int basePin = 11;
int shoulderPin = 10;
int elbowPin = 9;
int clawPin = 6;

void setup() {
  arm.begin(basePin, shoulderPin, elbowPin, clawPin);
  delay(1000);
}

void loop() {
  arm.moveToXYZ(0, 100, 50);
  delay(500);
  arm.moveToXYZ(-50, 100, 80);
  arm.closeClaw();
  delay(250);
  arm.openClaw();
  delay(2000);
}
```
