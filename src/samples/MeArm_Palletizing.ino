/*
  MeArm Palletizing

  Demonstrates a production robot transferring three products from one supply
  point into separate positions on a pallet. Each placement is written out so
  students can see the repeated instructions that an industrial loop performs.

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
  arm.moveToXYZ(0, 110, 70);  // Custom standby pose
  arm.openClaw();
  delay(500);

  // Product 1: supply point to the back of the pallet.
  arm.moveToXYZ(-45, 120, 90);  // Above supply
  arm.moveToXYZ(-45, 120, 40);  // At supply
  arm.closeClaw();
  delay(350);
  arm.moveToXYZ(-45, 120, 90);  // Lift
  arm.moveToXYZ(0, 110, 105);   // Clear transfer waypoint
  arm.moveToXYZ(20, 130, 90);   // Above pallet position 1
  arm.moveToXYZ(20, 130, 40);   // Place product 1
  arm.openClaw();
  delay(350);
  arm.moveToXYZ(20, 130, 90);   // Retract

  // Product 2: repeat the cycle for the next pallet position.
  arm.moveToXYZ(-45, 120, 90);  // Above supply
  arm.moveToXYZ(-45, 120, 40);  // At supply
  arm.closeClaw();
  delay(350);
  arm.moveToXYZ(-45, 120, 90);  // Lift
  arm.moveToXYZ(0, 110, 105);   // Clear transfer waypoint
  arm.moveToXYZ(45, 115, 90);   // Above pallet position 2
  arm.moveToXYZ(45, 115, 40);   // Place product 2
  arm.openClaw();
  delay(350);
  arm.moveToXYZ(45, 115, 90);   // Retract

  // Product 3: complete the first pallet row.
  arm.moveToXYZ(-45, 120, 90);  // Above supply
  arm.moveToXYZ(-45, 120, 40);  // At supply
  arm.closeClaw();
  delay(350);
  arm.moveToXYZ(-45, 120, 90);  // Lift
  arm.moveToXYZ(0, 110, 105);   // Clear transfer waypoint
  arm.moveToXYZ(30, 100, 90);   // Above pallet position 3
  arm.moveToXYZ(30, 100, 40);   // Place product 3
  arm.openClaw();
  delay(350);
  arm.moveToXYZ(30, 100, 90);   // Retract

  arm.moveToXYZ(0, 110, 70);  // Custom standby pose
  delay(3000);
}
