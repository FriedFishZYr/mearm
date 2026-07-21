/*
  MeArm Pre-Programmed Sorting Line

  Demonstrates two known parts being routed from one pickup station to
  different output bins. A real sorting system would use sensors and
  conditionals to identify each part; this beginner sketch uses a fixed order.

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

  // Part 1: collect it from the input station and route it to the left bin.
  arm.moveToXYZ(0, 130, 90);     // Above input
  arm.moveToXYZ(0, 130, 35);     // At input
  arm.closeClaw();
  delay(400);
  arm.moveToXYZ(0, 130, 90);     // Lift to travel height
  arm.moveToXYZ(0, 110, 110);    // Inspection waypoint
  delay(300);                     // Simulated inspection time
  arm.moveToXYZ(-55, 105, 90);   // Above left bin
  arm.moveToXYZ(-55, 105, 45);   // At left bin
  arm.openClaw();
  delay(400);
  arm.moveToXYZ(-55, 105, 90);   // Retract

  // Part 2: collect the next known part and route it to the right bin.
  arm.moveToXYZ(0, 130, 90);     // Above input
  arm.moveToXYZ(0, 130, 35);     // At input
  arm.closeClaw();
  delay(400);
  arm.moveToXYZ(0, 130, 90);     // Lift to travel height
  arm.moveToXYZ(0, 110, 110);    // Inspection waypoint
  delay(300);                     // Simulated inspection time
  arm.moveToXYZ(55, 105, 90);    // Above right bin
  arm.moveToXYZ(55, 105, 45);    // At right bin
  arm.openClaw();
  delay(400);
  arm.moveToXYZ(55, 105, 90);    // Retract

  arm.moveToXYZ(0, 110, 70);  // Custom standby pose
  delay(2500);
}
