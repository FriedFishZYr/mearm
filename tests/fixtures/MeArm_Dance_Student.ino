/*
  MeArm Dance - Student Starter

  PROJECT GOAL
  Change this working program to create your own short robot dance.

  TODAY'S CODING IDEAS
  1. Arduino follows the commands in loop() from top to bottom.
  2. delay() controls the rhythm.
  3. moveToXYZ() controls the position of the claw.
  4. openClaw() and closeClaw() create claw gestures.

  SAFETY
  - Keep hands, hair, clothing, and objects away from the moving arm.
  - Use only the instructor-approved poses shown below.
  - Do not force the arm by hand while it is powered.
  - Tell the instructor if the robot buzzes, binds, gets hot, or hits itself.

  INSTRUCTOR CHECK BEFORE CLASS
  The pins and pose coordinates in this draft must be tested on the actual
  classroom robot before students upload it.
*/

// These libraries provide the commands used to control the MeArm.
#include "MeArm.h"
#include <Servo.h>

// This creates one robot arm named "arm."
MeArm arm;

// Servo signal pins - do not change unless instructed.
int basePin = 11;
int shoulderPin = 10;
int elbowPin = 9;
int clawPin = 6;

void setup() {
  // setup() runs once when the Arduino starts or resets.
  arm.begin(basePin, shoulderPin, elbowPin, clawPin);
  delay(1000);
}

/*
  APPROVED POSE MENU

  Copy a COMPLETE movement command when you add a pose to your dance.

  HOME:  arm.moveToXYZ(0, 100, 50);
  LEFT:  arm.moveToXYZ(-50, 100, 80);
  RIGHT: arm.moveToXYZ(50, 100, 80);
  HIGH:  arm.moveToXYZ(0, 100, 120);
  LOW:   arm.moveToXYZ(0, 120, 40);

  The three numbers are x, y, and z coordinates measured in millimeters.
  For today's activity, use the complete tested commands instead of inventing
  new coordinates.
*/

void loop() {
  // loop() runs from top to bottom and then starts again.

  // Start at HOME.
  arm.moveToXYZ(0, 100, 50);

  // TODO 1 - RHYTHM
  // Change 1000 to a value from 250 through 1500 milliseconds.
  // Predict: Will your new pause be shorter or longer?
  delay(1000);

  // Move LEFT.
  arm.moveToXYZ(-50, 100, 80);
  delay(500);

  // Make one claw gesture.
  arm.closeClaw();
  delay(500);
  arm.openClaw();
  delay(500);

  // TODO 2 - ORDER
  // Swap these two COMPLETE movement commands. Leave the delays in place.
  // Predict which pose the robot will visit first after the claw gesture.
  arm.moveToXYZ(50, 100, 80);  // RIGHT
  delay(500);
  arm.moveToXYZ(0, 100, 120);  // HIGH
  delay(500);

  // TODO 3 - YOUR MOVE
  // Copy one COMPLETE movement command from the APPROVED POSE MENU here.
  // Remove the // at the beginning of the next line, then replace the example
  // with your chosen movement command.
  // arm.moveToXYZ(0, 120, 40);
  delay(500);

  // Finish safely at HOME with the claw open.
  arm.moveToXYZ(0, 100, 50);
  arm.openClaw();

  // Pause before loop() starts the dance again.
  delay(2000);
}
