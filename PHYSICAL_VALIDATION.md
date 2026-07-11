# Physical validation protocol

## Required setup

- Assembled and mechanically inspected classroom MeArm
- Arduino and correct USB cable
- Verified external servo power supply
- Common ground between Arduino and servo supply
- Emergency power-disconnect method
- Clear work surface and one observer

Record the arm identifier, Arduino board, pin assignments, supply voltage,
servo model, profile values, tester, and date.

## Pose-by-pose validation

Begin with the arm raised or positioned so unexpected motion is unlikely to hit
the table. Keep hands, hair, clothing, and objects out of the motion envelope.

Test in this order:

1. HOME `(0, 100, 50)`
2. LEFT `(-50, 100, 80)`
3. HOME
4. RIGHT `(50, 100, 80)`
5. HOME
6. HIGH `(0, 100, 120)`
7. HOME
8. LOW `(0, 120, 40)`
9. HOME
10. Open and close the claw once

For every pose, record pass/fail and note buzzing, binding, heat, mechanical
stop contact, unexpected direction, collision risk, or visible coordinate
difference. Disconnect power immediately if any unsafe behavior occurs.

## Complete dance comparison

After every individual pose passes:

1. Preview the instructor dance at `1x`.
2. Run one physical loop with power ready to disconnect.
3. Compare command order, approximate timing, endpoint direction, and claw
   state with the viewer.
4. Run three additional loops only if the first is safe.
5. Check servo temperature and fasteners after the repeated test.

## Acceptance requirements

- All five approved poses move in the expected direction without binding.
- The claw opens and closes in the expected direction.
- No servo contacts a hard stop or remains stalled.
- No arm component collides with the base or table.
- Full dance order and pauses agree with the viewer.
- Instructor confirms that the safety reminder and profile values are correct.

Any failure blocks classroom approval until hardware calibration, assembly, or
the simulation profile is corrected and the complete protocol is repeated.
