# Acceptance Tests

## Device identity

- A new installation creates a unique device ID.
- Rebooting does not change the device ID.
- Reinstalling without preserving identity creates a recovery candidate, not a silent duplicate.
- The private key is not returned by any API or written to normal logs.
- A revoked device cannot authenticate.

## Automatic registration

- A new device appears in the unclaimed-device queue.
- The queue shows sufficient information to identify the physical device.
- An unclaimed device cannot receive production configuration.
- An unclaimed device cannot receive operational commands.
- Duplicate pending registrations are deduplicated.

## Pairing

- The endpoint can request and display a pairing code.
- The code expires.
- The code works once only.
- Repeated incorrect attempts are rate limited.
- The admin sees device confirmation information before claiming.
- Successful pairing invalidates the code.
- The claim is present in the audit log.

## Ownership and assignment

- A claimed device belongs to exactly one company.
- A claimed device can be assigned to a room.
- A room can be reassigned to a replacement device.
- Removing a device from a room does not delete the room.
- Transfer removes the previous company's configuration from the endpoint.

## Connectivity

- The device initiates the cloud connection.
- No inbound port is required.
- The gateway detects a lost connection.
- The browser reflects online/offline state.
- The agent reconnects after network recovery.
- Reconnect does not duplicate completed commands.

## Commands

- Authorised commands reach the correct device.
- Commands for another device are rejected.
- Expired commands are rejected.
- Duplicate idempotency keys do not repeat the action.
- Acknowledgement and completion are separately reported.
- Unsupported capability commands are rejected clearly.
- Command actors and results are audited.

## State

- Reported state changes after successful execution.
- State revisions increase.
- Stale state messages do not overwrite newer state.
- Desired and reported state can differ visibly.
- The platform identifies an out-of-sync device.
- The endpoint retries durable desired-state changes according to policy.

## TouchDesigner adapter

- The adapter connects only over localhost.
- The cloud does not require knowledge of TouchDesigner paths.
- TouchDesigner heartbeat loss is detected.
- The agent restarts TouchDesigner according to policy.
- Repeated crashes enter degraded mode rather than an endless restart loop.
- Current project and adapter versions are reported.

## Offline operation

- Active video output continues when internet access is removed.
- Last known configuration remains available.
- Expired live commands are not replayed after reconnect.
- Important events queue locally.
- Queued events upload after reconnect.
- The endpoint restores normal state after a reboot while the cloud is unavailable.

## Configuration

- Draft configuration does not affect a production device.
- Published configuration has an immutable revision.
- Endpoint validates configuration before activation.
- Invalid configuration is rejected with a clear reason.
- Failed activation restores the previous known-good configuration.
- The active revision is reported to the cloud.

## Updates

- Package hash and signature are verified.
- An unsigned or altered package is rejected.
- Update can be downloaded without immediate activation.
- Update can be scheduled.
- Failed update rolls back.
- Current and previous packages remain available.
- Update result is audited.

## Security

- User credentials cannot authenticate as a device.
- Device credentials cannot authenticate as a user.
- Pairing does not expose permanent credentials.
- Local APIs are not reachable from other network hosts by default.
- Arbitrary shell commands are not available.
- Tenant checks prevent one company controlling another company's device.
- Administrator actions require elevated permission.
- Sensitive values are not written to logs.

## Operational readiness

- Installer completes on a clean supported Windows image.
- Service starts automatically.
- Diagnostic bundle can be exported.
- Agent, adapter and configuration versions are visible.
- Disk-space alerts are generated.
- Device can be retired and prevented from reconnecting.
- A replacement device can take over an existing room configuration.

## Network roaming

- A node reconnects after a DHCP address change.
- A node reconnects after moving between wired and wireless networks.
- A node reconnects after its public NAT address changes.
- IP changes do not create a new device record or require re-pairing.
- Reconnection performs a fresh TLS handshake.
- Expired commands are not replayed.
- Desired and reported revisions reconcile correctly.

## Encryption and certificates

- Plain HTTP and plaintext WebSocket connections are rejected.
- Certificate validation failure prevents connection.
- A revoked device certificate prevents reconnection.
- Certificate renewal and rotation complete without losing ownership.
- Downloaded packages fail validation if altered.
- Replayed or duplicated commands are rejected.

## Code-owned deployment

- A clean database is created using migrations only.
- All reference data is installed through code-owned seed processes.
- No manual table creation is required.
- A new environment is deployable entirely from infrastructure code.
- Migration checksums and history are recorded.
- The application detects incompatible schema versions.
- The platform passes a clean-environment rebuild test.
