/*
  MeArm House Shape Dance

  Traces a house in the X-Z plane at Y = 120 mm.
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
  arm.moveToXYZ(0, 100, 50);  // HOME
  delay(500);

  // Draw the walls and roof.
  arm.closeClaw();
  arm.moveToXYZ(-35, 120, 45);
  arm.moveToXYZ(-35, 120, 90);
  arm.moveToXYZ(0, 120, 120);
  arm.moveToXYZ(35, 120, 90);
  arm.moveToXYZ(35, 120, 45);
  arm.moveToXYZ(-35, 120, 45);

  // Draw the door.
  arm.moveToXYZ(-10, 120, 45);
  arm.moveToXYZ(-10, 120, 70);
  arm.moveToXYZ(10, 120, 70);
  arm.moveToXYZ(10, 120, 45);

  arm.openClaw();
  arm.moveToXYZ(0, 100, 50);  // HOME
  delay(2000);
}
