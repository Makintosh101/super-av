# Cloud

## Ownership

Cloud-owned Phase 1 implementation files belong here when a scoped task approves them.

## Phase 1 status

P1-EPIC-04 adds the repository-local provisioning service implementation for the approved Phase 1 registration, pairing, certificate metadata and room-assignment workflows. P1-EPIC-06 adds the repository-local real-time gateway service implementation for authenticated device WebSocket handshake, presence, browser room sessions, command lifecycle, reported state and health ingestion. These implementations do not add a deployed server, new inbound port or infrastructure resource.

## Provisioning implementation

`cloud/provisioning/provisioning-service.mjs` implements the approved endpoint behaviour behind framework-neutral functions so a future transport layer can call the same product logic without changing the security model:

- unclaimed device registration stores limited bootstrap metadata and deduplicates repeated pending registration by device identity and fingerprint;
- registration polling returns only limited pre-claim status unless an authorised Phase 1 company actor requests post-claim assignment details;
- pairing sessions are short-lived, device-bound and one-time use, with hashed pairing-code storage;
- pairing claim requires a Blue Elephant `admin` or `technician`, enforces expiry and writes audit evidence;
- certificate issuance records metadata only and rejects endpoint private keys;
- room assignment validates company ownership before assigning a claimed device to the Phase 1 room.

## Real-time gateway implementation

`cloud/gateway/gateway-service.mjs` implements the approved Phase 1 real-time gateway behaviour behind framework-neutral functions so a future WebSocket transport can call the same product logic without changing the security model:

- device connections require secure WebSocket transport, the approved device credential thumbprint and an initial `device.hello`;
- `server.welcome` includes UTC server time, heartbeat interval and desired configuration revision;
- presence is temporary runtime state and requires an authenticated connection plus fresh heartbeat;
- browser room sessions require authenticated Blue Elephant room access, support multiple viewers and represent one active controller with Technician/Admin takeover;
- command creation validates ownership, active session, logical Phase 1 capability, value ranges, configuration revision, expiry and idempotency before delivery;
- command acknowledgement and completion are tracked independently, broadcast to subscribed browsers and audited;
- reported state ingestion enforces monotonically increasing revisions;
- health ingestion validates issue codes, severity and first-observed timestamps and records Phase 1 retention metadata.

No TouchDesigner operator paths, shell commands, arbitrary file access or generic process-launch actions are accepted by the gateway implementation.

## Build commands

No cloud deployment build command exists yet. Future tasks must add build commands with the implementation they authorize.

## Test commands

Run provisioning unit tests from the repository root with:

```sh
npm run test:unit
```

Run all repository validation with:

```sh
npm run check
```

## Related specifications

- [Phase 1 Build Plan](../docs/10_PHASE_1_BUILD_PLAN.md)
- [Cloud Backend Specification](../docs/specifications/05_CLOUD_BACKEND_SPECIFICATION.md)
- [API and Message Contracts](../docs/specifications/06_API_AND_MESSAGE_CONTRACTS.md)
