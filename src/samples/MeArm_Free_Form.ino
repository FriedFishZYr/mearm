#include "MeArm.h"
#include <Servo.h>

MeArm arm;

int basePin = 11;
int shoulderPin = 10;
int elbowPin = 9;
int clawPin = 6;

void setup() {
  arm.begin(basePin, shoulderPin, elbowPin, clawPin);
}

void loop() {
  arm.moveToXYZ(0, 100, 50);
}
