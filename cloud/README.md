# Cloud

## Ownership

Cloud-owned Phase 1 implementation files belong here when a scoped task approves them.

## Phase 1 status

P1-EPIC-04 adds the repository-local provisioning service implementation for the approved Phase 1 registration, pairing, certificate metadata and room-assignment workflows. P1-EPIC-06 adds the repository-local real-time gateway service implementation for authenticated device WebSocket handshake, presence, browser room sessions, command lifecycle, reported state and health ingestion. P1-EPIC-07 adds partial repository-local configuration service implementation for draft validation, publication, desired configuration fetch and media asset metadata; configuration reporting and release manifests are paused pending Decision Requests. P1-EPIC-10 adds framework-neutral web application screen view models for the Phase 1 admin, technician, room control, diagnostics and event-log experience. P1-EPIC-11 adds cloud structured logging and explicit offline/low-disk alert records for monitoring and support evidence. These implementations do not add a deployed server, new inbound port or infrastructure resource.

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
- health ingestion validates issue codes, severity and first-observed timestamps and records Phase 1 retention metadata;
- missed heartbeat thresholds raise explicit offline alerts, and low disk metrics raise explicit disk-capacity alerts visible to diagnostics and event-log surfaces.

No TouchDesigner operator paths, shell commands, arbitrary file access or generic process-launch actions are accepted by the gateway implementation.

## Configuration implementation

`cloud/configuration-service.mjs` implements the unblocked P1-EPIC-07 cloud configuration behaviour behind framework-neutral functions so a future transport layer can call the same product logic without changing the security model:

- validates draft room configuration against the Phase 1 configuration schema without creating desired deployments;
- rejects unknown logical capabilities, engine or hardware paths, and unknown asset references with explicit error codes and JSON-style paths;
- publishes immutable UTC-stamped configuration revisions and creates desired deployment records for active assigned devices;
- serves desired configuration to assigned, active devices only; unclaimed, suspended, retired or revoked devices receive explicit authorization failures;
- stores minimal media asset metadata containing asset ID, content hash, storage key, size and cache policy only. Signed or protected media URLs are rejected and must not be logged.

P1-BE-0504 and P1-BE-0506 remain paused by Decision Requests because ADR-009 is In Review and ADR-010 is Proposed.

## Web application screens implementation

`cloud/web-app-screens.mjs` implements the approved Phase 1 browser surfaces as framework-neutral view-model functions so a future web framework can render the same authorised product state without changing the security model:

- admin unclaimed-device queue with limited commissioning metadata, local IP, agent version and duplicate pending-registration clarity;
- pairing claim flow with code or QR-token entry states, confirmation phrase, successful claim state and explicit expired, reused or unauthorized errors;
- room assignment view for claimed or assigned devices with current assignment and active configuration revision;
- device diagnostics view with online/offline status, health, agent and adapter versions, active configuration revision, recent errors and constrained support actions only;
- room control view using logical capability labels and server-side active-controller authorization state;
- event log view for pairing, claim, assignment, command, failure and health events using UTC storage timestamps and sanitized display details.

No remote shell, arbitrary file access, TouchDesigner operator path, new public API route or client-side-only authorization boundary is introduced by these screen functions.

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

## Monitoring and support implementation

`cloud/structured-logger.mjs` provides a framework-neutral structured logger for cloud services. Log records include UTC timestamp, component, correlation ID, actor/device context and error code where supplied. Sensitive fields such as passwords, private keys, tokens, secrets and signed URLs are redacted before writing.

Gateway alert records are in-memory Phase 1 implementation state only. They do not introduce a deployed alerting backend, notification channel, infrastructure resource or public API route.
