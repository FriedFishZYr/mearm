/*
  MeArm Dance - Instructor Example Solution

  This is a completed example for demonstration, testing, and recovery.
  It intentionally uses the same beginner-level commands as the student file.
  Custom functions, explicit loops, and conditionals are saved for later lessons.

  IMPORTANT
  Test every pin assignment and pose on the actual classroom hardware before
  students use either sketch. Confirm the servo power and grounding arrangement.
*/

#include "MeArm.h"
#include <Servo.h>

MeArm arm;

// Default servo signal pins from the MeArm examples.
int basePin = 11;
int shoulderPin = 10;
int elbowPin = 9;
int clawPin = 6;

void setup() {
  // Initialize the robot once. begin() also moves to HOME and opens the claw.
  arm.begin(basePin, shoulderPin, elbowPin, clawPin);
  delay(1000);
}

void loop() {
  // Opening pose: HOME
  arm.moveToXYZ(0, 100, 50);
  delay(750);

  // Sway left and right.
  arm.moveToXYZ(-50, 100, 80);
  delay(400);
  arm.moveToXYZ(50, 100, 80);
  delay(400);
  arm.moveToXYZ(-50, 100, 80);
  delay(400);
  arm.moveToXYZ(50, 100, 80);
  delay(400);

  // Reach high.
  arm.moveToXYZ(0, 100, 120);
  delay(600);

  // Claw clap.
  arm.openClaw();
  delay(250);
  arm.closeClaw();
  delay(250);
  arm.openClaw();
  delay(250);
  arm.closeClaw();
  delay(250);
  arm.openClaw();
  delay(500);

  // Dip low, then rise again.
  arm.moveToXYZ(0, 120, 40);
  delay(700);
  arm.moveToXYZ(0, 100, 120);
  delay(700);

  // Final pose: return HOME and leave the claw open.
  arm.moveToXYZ(0, 100, 50);
  arm.openClaw();

  // loop() will start the dance again after this pause.
  delay(2000);
}
