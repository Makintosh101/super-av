# Phase 1 Demonstration Script

## Purpose

This script is the authoritative P1-BE-1309 operator checklist for demonstrating the Phase 1 lifecycle without adding scope beyond the approved single Blue Elephant deployment, one room and one node.

## Steps and expected evidence

1. Install the Endpoint Agent package on a clean supported Windows image.
   - Evidence: installer manifest version, service install log and `Endpoint service started` log entry.
2. Generate or load node identity.
   - Evidence: stable `deviceId`, installation ID and protected local identity file after reboot.
3. Display or serve pairing data.
   - Evidence: pairing code or QR token from the local commissioning surface without permanent credentials.
4. Register, pair and claim in cloud.
   - Evidence: device registration, pairing session, claim response and certificate metadata audit events.
5. Assign the node to the Phase 1 room.
   - Evidence: active room assignment for `demo-room`.
6. Publish desired configuration.
   - Evidence: desired configuration revision, code-owned asset metadata and device desired deployment.
7. Send the `video.output.selectSource` presentation command from the browser.
   - Evidence: command record with logical action only, idempotency key and expiry.
8. Execute in TouchDesigner through the local adapter.
   - Evidence: adapter bridge command with no cloud-visible TouchDesigner operator path and logical reported state.
9. Confirm browser state update.
   - Evidence: browser `device.stateChanged` broadcast containing the presentation output state.
10. Remove internet access, roam networks and reconnect.
    - Evidence: active output remains unchanged, offline alert is visible, expired commands are not replayed and reported revisions reconcile after reconnect.
11. Reboot while offline.
    - Evidence: agent starts, cached known-good configuration loads, TouchDesigner starts, active state is restored and queued recovery events upload after reconnect.

## Known limitations

- The repository acceptance test uses in-process cloud, simulator, endpoint and adapter components; it does not provision live cloud resources.
- The Windows installation acceptance is represented by the code-owned installer/service scripts and identity/diagnostic behaviours, not by running a real Windows VM in this repository.
- TouchDesigner execution is validated through the localhost adapter bridge and project manifest contract, not a licensed TouchDesigner runtime.

## Recovery and rollback notes

- Revert the P1-EPIC-13 implementation commit to remove the acceptance test suite and demonstration script.
- No database rollback is required because P1-EPIC-13 adds no migrations.
- Package rollback follows the documented previous-package preservation flow in `docs/operations/RELEASE_AND_ROLLBACK.md`.
