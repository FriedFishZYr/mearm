/*
  MeArm Cyberpunk Beat Dance

  Track: "Cyberpunk Short" by Nesterouk, 90 BPM, 27 seconds.
  Start the music when loop() begins. Beats 1-40 last about 26.7 seconds.
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
  // Beats 1-4: claw count-in.
  arm.closeClaw();
  delay(367);
  arm.openClaw();
  delay(366);
  arm.closeClaw();
  delay(367);
  arm.openClaw();
  delay(367);

  // Beats 5-12: side sway.
  arm.moveToXYZ(-30, 115, 75);
  delay(1033);
  arm.moveToXYZ(30, 115, 75);
  delay(983);
  arm.moveToXYZ(-30, 115, 75);
  delay(983);
  arm.moveToXYZ(30, 115, 75);
  delay(984);

  // Beats 13-20: diagonal steps.
  arm.moveToXYZ(-30, 110, 105);
  delay(933);
  arm.moveToXYZ(30, 110, 105);
  delay(983);
  arm.moveToXYZ(30, 125, 45);
  delay(933);
  arm.moveToXYZ(-30, 125, 45);
  delay(984);

  // Beats 21-24: glitch clap.
  arm.closeClaw();
  delay(367);
  arm.openClaw();
  delay(366);
  arm.closeClaw();
  delay(367);
  arm.openClaw();
  delay(367);

  // Beats 25-32: level changes.
  arm.moveToXYZ(0, 110, 115);
  delay(883);
  arm.moveToXYZ(0, 130, 45);
  delay(883);
  arm.moveToXYZ(-35, 110, 100);
  delay(933);
  arm.moveToXYZ(35, 110, 100);
  delay(934);

  // Beats 33-36: center steps.
  arm.moveToXYZ(0, 135, 70);
  delay(983);
  arm.moveToXYZ(0, 105, 105);
  delay(1034);

  // Beats 37-40: final pose and HOME.
  arm.moveToXYZ(0, 110, 120);
  arm.closeClaw();
  delay(883);
  arm.moveToXYZ(0, 100, 50);
  arm.openClaw();
  delay(584);

  delay(5000);
}
