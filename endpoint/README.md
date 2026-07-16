# Endpoint

## Ownership

Endpoint agent, commissioning, adapter SDK, adapter and installer implementation files belong here when a scoped task approves them.

## Phase 1 status

P1-EPIC-09 extends the BE Endpoint Node Agent foundation with the internal adapter host, System Health adapter, deterministic simulator and TouchDesigner adapter runtime boundary. P1-EPIC-08 previously added endpoint command, configuration, state, event and offline-control behaviour. The implementation remains intentionally small and covers the approved Phase 1 endpoint execution scope:

- Windows service skeleton scripts for installing and removing the service.
- Structured startup and shutdown logging with UTC timestamp, correlation ID, device/command context, error code and sensitive-field redaction.
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
- Internal adapter contract supporting manifests, lifecycle, configuration validation, command execution, reported state and health for Phase 1 adapters only.
- Adapter host that starts/stops configured adapters, preserves degraded startup diagnostics and publishes adapter manifests.
- System Health adapter reporting CPU, memory, disk, GPU availability, agent version, adapter version and recent errors, including low-disk alerts.
- Simulated TouchDesigner adapter implementing all Phase 1 logical commands with deterministic state changes for integration tests.
- TouchDesigner adapter with configured project launch, localhost-only bridge validation, protocol/message-size checks, command mapping, heartbeat detection and documented bounded restart policy.
- Diagnostic bundle export that writes redacted support evidence from logs, local configuration summary, component versions, recent health, recent commands and environment summary.

## Scope boundaries

P1-EPIC-09 does not implement packaging, installer updates, package signature verification, web application screens, new public cloud APIs, ownership changes, certificate changes, tenant membership changes or cloud security changes. Packaging and deployment remain assigned to later authorised Epics.

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

## Adapter host and Phase 1 adapters

The adapter host is internal to the endpoint agent. It is not a public plugin marketplace and accepts only the Phase 1 adapter types documented by the repository decisions: `systemHealth` and `touchdesigner`.

TouchDesigner licensing is a deployment prerequisite. The runtime requires an executable path, assigned project path and expected project version from active configuration/release metadata; it does not hide licensing failure behind alternate launch behaviour. The localhost bridge accepts only `localhost`, `127.0.0.1` or `::1`, validates the expected protocol version and rejects oversized messages.

The TouchDesigner restart policy is an explicit recovery mode: when the project heartbeat exceeds the configured timeout, the adapter performs a bounded restart inside the configured restart window. If the restart limit is reached, the adapter reports degraded health instead of entering an endless restart loop.

## Diagnostic bundle export

`endpoint/agent/diagnostic-bundle.mjs` exports a Phase 1 diagnostic bundle as a local JSON artifact. The bundle includes logs, local configuration summary, versions, recent health, recent commands and environment summary. The exporter redacts sensitive fields such as private keys, tokens, passwords, secrets and signed/protected URLs before writing the bundle.

Diagnostic bundle export is available as local implementation logic and through the constrained local diagnostics export trigger. It does not add remote shell, arbitrary file access, a new inbound network binding or a deployed upload service.

## P1-EPIC-12 installer and package validation

`endpoint/packaging/installer-manifest.mjs` defines the Phase 1 endpoint installer manifest. It records the Windows service entry point, auto-start registration, required writable directories, adapter package reference, local commissioning access point and installed-version metadata path. The manifest explicitly rejects embedded long-lived shared fleet secrets.

`endpoint/agent/package-validator.mjs` verifies package SHA-256 hashes and RSA-SHA256 signatures before activation. Activation keeps the current package and moves the previous package into a rollback directory so recovery can restore the last known-good package without hiding the failed update.
