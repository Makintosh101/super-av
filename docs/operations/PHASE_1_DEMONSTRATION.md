# Phase 1 Demonstration Script

## Purpose

This script provides the authorised Phase 1 demonstration flow for `P1-EPIC-13`. It proves install, identity, pairing, assignment, configuration, logical command execution, TouchDesigner local mapping, browser state visibility, network resilience and reboot recovery without adding Phase 2 orchestration.

## Preconditions

- Use a non-production Phase 1 environment created from code-owned infrastructure modules.
- Apply cloud database migrations in order and run code-owned seed data for the Blue Elephant Phase 1 deployment.
- Use a signed endpoint installer, adapter package and TouchDesigner project package with matching manifest metadata.
- Use an admin or technician account in `blue-elephant-phase1` for commissioning and a room user for the control demonstration.

## Demonstration steps and expected evidence

| Step | Action | Expected evidence |
| --- | --- | --- |
| 1 | Install the endpoint package on a clean supported Windows image. | Installer manifest version is recorded, required directories exist under the install root, the service is registered for auto-start and no long-lived shared fleet secret is embedded. |
| 2 | Start the endpoint agent and perform identity generation. | `identity.json` contains a stable device ID and installation ID, private key material is stored separately and is absent from metadata and diagnostics. |
| 3 | Display or serve pairing code display through the local commissioning surface. | Pairing code, expiry and confirmation details are visible locally; the local API remains localhost-only and requires local authentication. |
| 4 | Register and cloud claim the device. | Cloud registration appears in the unclaimed-device queue, pairing claim confirms the fingerprint/installation ID, a device credential is issued and provisioning audit events are recorded. |
| 5 | Complete room assignment. | The device is assigned to the Phase 1 demo room and the room assignment screen shows the active assignment. |
| 6 | Push the Phase 1 configuration (configuration push). | Endpoint downloads, validates and activates `phase1.configuration.v1`; cloud and endpoint reports show the desired and active revision. |
| 7 | Send a presentation command using the browser control page. | Browser sends the logical command `video.output.selectSource` only after server-side room control authorization; cloud command records and gateway messages contain no TouchDesigner operator path. |
| 8 | Execute the command through TouchDesigner locally (TouchDesigner execution). | The adapter maps the logical command to the local TouchDesigner bridge, updates local reported state and returns a command completion message. |
| 9 | Confirm browser state update. | Browser room control status shows the command succeeded and the logical video source/reporting state changed to the expected presentation input. |
| 10 | Demonstrate network loss/reconnect. | Active video output remains unchanged while internet is removed; expired commands are not replayed; reconnect after DHCP, NAT or wired/wireless change uses the existing paired identity and reconciles desired/reported revisions. |
| 11 | Demonstrate reboot recovery while offline. | On reboot without cloud access, the service auto-starts, loads last known configuration, starts TouchDesigner, restores the active state without manual repair and queues recovery events. |
| 12 | Reconnect cloud and review evidence. | Queued events upload, event history shows recovery actions, diagnostics export succeeds and logs include UTC timestamps, correlation IDs and explicit error codes where applicable. |

## Known limitations

- The repository acceptance suite uses deterministic simulator and manifest-level checks for Windows image, infrastructure deployment and TouchDesigner hardware evidence; it does not provision a live cloud environment or boot a real Windows VM in this repository.
- Phase 1 demonstrates one isolated Blue Elephant deployment and does not add multi-customer provisioning automation beyond the approved reusable module pattern.
- Remote shell, arbitrary file access, arbitrary process launch and TouchDesigner operator paths remain unavailable by design.

## Rollback and recovery

- Failed configuration activation must keep the previous known-good configuration active, report the failed desired revision explicitly and avoid making the failure appear successful.
- Failed or tampered package activation must reject the package before activation; failed update recovery uses the documented previous-package rollback mode.
- If the demonstration environment becomes inconsistent, recreate the non-production database from migrations and seed data, reinstall the endpoint package and repeat the commissioning flow.
- Reverting the `P1-EPIC-13` implementation removes only acceptance tests, the demonstration script and completion documentation; no database rollback is required because no migration is introduced.
