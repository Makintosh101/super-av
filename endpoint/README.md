# Endpoint

## Ownership

Endpoint agent, commissioning, adapter SDK, adapter and installer implementation files belong here when a scoped task approves them.

## Phase 1 status

P1-EPIC-08 extends the BE Endpoint Node Agent foundation with endpoint command, configuration, state, event and offline-control behaviour. The implementation remains intentionally small and covers the approved Phase 1 endpoint execution scope:

- Windows service skeleton scripts for installing and removing the service.
- Structured startup and shutdown logging.
- Ordered local SQLite schema migration file for endpoint persistence.
- Device identity generation with persisted metadata and protected private-key file permissions where the host supports them.
- Provisioning client for unclaimed registration and registration-status polling over outbound HTTPS.
- Pairing-code display data source for the commissioning UI/local API.
- Cloud connection manager abstraction that sends `device.hello`, handles `server.welcome`, and sends `device.heartbeat` messages over an approved secure transport supplied by the runtime.
- Local diagnostics and commissioning API bound to `127.0.0.1` with bearer-token protection.
- Command dispatcher validation for expiry, logical action allow-list, active configuration revision, idempotency key and required capability before adapter execution.
- JSON-backed command deduplication records for the documented replay window.
- Desired-configuration download, local validation, known-good activation and explicit activation reporting.
- Reported-state publisher with increasing revisions, offline queueing and stale remote revision protection.
- Local audit/event queue with UTC ordering, visible capacity/disk diagnostics and failed-upload retention.
- Offline local User/Technician control boundary that routes cached room actions through the same command dispatcher and marks Technician programming as cloud-review draft work.

## Scope boundaries

P1-EPIC-08 does not implement adapter hosting, TouchDesigner process management, update installation, new public cloud APIs, ownership changes, certificate changes, tenant membership changes or cloud security changes. Adapter hosting and TouchDesigner behaviour remain assigned to P1-EPIC-09.

## Windows service commands

Install the service from an elevated PowerShell session after the endpoint runtime package is present:

```powershell
endpoint/scripts/install-windows-service.ps1 -ServiceName BEEndpointNodeAgent -NodePath node -AgentEntry endpoint/agent/service.mjs
```

Remove the service:

```powershell
endpoint/scripts/uninstall-windows-service.ps1 -ServiceName BEEndpointNodeAgent
```

## Local database

Endpoint local schema changes are ordered migrations in `endpoint/migrations/`. The current required local schema version is `1` and is validated by `endpoint/agent/local-database.mjs`.

The initial schema stores identity metadata, last known configuration, pending telemetry, audit events, installed release metadata, update history, command deduplication and adapter state. P1-EPIC-08 uses these approved local persistence concepts without adding a new database migration.

## Local API

The local API must bind to localhost by default. It exposes:

- `GET /diagnostics` — identity summary, network state, pairing status, cloud connection state, assigned room, logs path and diagnostic export availability.
- `POST /diagnostics/export` — accepts a constrained diagnostic export trigger.
- `POST /offline/commands` — accepts a cached permitted local room action when an offline-control boundary is supplied by the runtime; it does not execute arbitrary shell, ownership, certificate, tenant or cloud-security changes.

The API requires a bearer token and does not expose arbitrary shell execution.

## Build commands

No endpoint-specific build command is required for the current JavaScript foundation modules. Repository validation runs from the root.

## Test commands

```sh
npm run test:unit
npm run check
```

## Related specifications

- [Phase 1 Build Plan](../docs/10_PHASE_1_BUILD_PLAN.md)
- [Endpoint Agent Specification](../docs/specifications/04_ENDPOINT_AGENT_SPECIFICATION.md)
- [API and Message Contracts](../docs/specifications/06_API_AND_MESSAGE_CONTRACTS.md)
- [Security and Trust Model](../docs/standards/07_SECURITY_AND_TRUST_MODEL.md)
