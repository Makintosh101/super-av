# Endpoint

## Ownership

Endpoint agent, commissioning, adapter SDK, adapter and installer implementation files belong here when a scoped task approves them.

## Phase 1 status

P1-EPIC-05 adds the BE Endpoint Node Agent foundation. The implementation is intentionally small and covers the approved Phase 1 foundation only:

- Windows service skeleton scripts for installing and removing the service.
- Structured startup and shutdown logging.
- Ordered local SQLite schema migration file for endpoint persistence.
- Device identity generation with persisted metadata and protected private-key file permissions where the host supports them.
- Provisioning client for unclaimed registration and registration-status polling over outbound HTTPS.
- Pairing-code display data source for the commissioning UI/local API.
- Cloud connection manager abstraction that sends `device.hello`, handles `server.welcome`, and sends `device.heartbeat` messages over an approved secure transport supplied by the runtime.
- Local diagnostics and commissioning API bound to `127.0.0.1` with bearer-token protection.

## Scope boundaries

The foundation does not implement adapter hosting, command execution, configuration activation, offline local controls, update installation or TouchDesigner process management. Those behaviours remain assigned to later approved epics.

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

The initial schema stores identity metadata, last known configuration, pending telemetry, audit events, installed release metadata, update history, command deduplication and adapter state.

## Local API

The local API must bind to localhost by default. The current foundation exposes:

- `GET /diagnostics` — identity summary, network state, pairing status, cloud connection state, assigned room, logs path and diagnostic export availability.
- `POST /diagnostics/export` — accepts a constrained diagnostic export trigger.

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
