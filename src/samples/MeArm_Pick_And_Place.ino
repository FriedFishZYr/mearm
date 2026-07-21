/*
  MeArm Pick and Place

  Demonstrates a basic industrial material-handling cycle. The arm approaches
  from above, grips a part, lifts it to a safe travel height, moves it to the
  destination, and releases it.

  Preview and physically test these non-preset poses before classroom use.
*/

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
  // Move to a custom standby pose with the claw ready to collect a part.
  arm.moveToXYZ(0, 110, 70);  // Standby
  arm.openClaw();
  delay(500);

  // Approach and collect the part from the left-hand pickup station.
  arm.moveToXYZ(-45, 120, 90);  // Above pickup
  arm.moveToXYZ(-45, 120, 40);  // At pickup
  arm.closeClaw();
  delay(500);

  // Lift before travelling sideways so the part clears the work surface.
  arm.moveToXYZ(-45, 120, 90);  // Lift to travel height
  arm.moveToXYZ(0, 115, 110);   // Transfer waypoint
  arm.moveToXYZ(45, 120, 90);   // Above destination

  // Lower the part into place, release it, and retract vertically.
  arm.moveToXYZ(45, 120, 40);   // At destination
  arm.openClaw();
  delay(500);
  arm.moveToXYZ(45, 120, 90);   // Retract

  arm.moveToXYZ(0, 110, 70);  // Standby
  delay(2500);
}
