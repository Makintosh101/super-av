# Phase 1 Engineering Backlog

## Scope and guardrails

This backlog decomposes Phase 1 into independently completable tasks sized for less than one engineering day each. It is derived from the Platform Principles, Phase 1 Build Plan, acceptance tests, architecture documents, API/message contracts, data model, security model and confirmed or explicitly noted ADRs.

Phase 1 must prove one reusable lifecycle: install one Windows endpoint, generate device identity, claim it in the cloud, assign it to one room, deploy configuration, send logical commands to the TouchDesigner adapter, report state to the browser, and recover after network loss and reboot.

The backlog must not be used to introduce architecture beyond documented decisions. In particular:

- Use logical capabilities and product-level commands only; do not expose TouchDesigner paths to cloud APIs.
- Use outbound HTTPS/WSS only; do not require inbound ports or public endpoint IPs.
- Use code-owned migrations, infrastructure and deployment configuration only.
- Do not add speculative fallback chains; recovery modes must be documented, tested operating modes.
- Keep Phase 1 to the Blue Elephant single deployment, one company, one room and one node unless a later approved decision expands scope.
- Treat proposed/in-review ADRs as constraints for backlog planning only; implementation tasks that depend on an unresolved decision must include a decision checkpoint before code is written.

## Epic 0 — Repository, delivery controls and documentation baseline

### P1-BE-0001 — Establish Phase 1 repository structure

**Status:** Complete

**Relevant ADRs:** ADR-003, ADR-026, ADR-030, ADR-031  
**Dependencies:** None

**Acceptance criteria:**

- Create only the documented top-level implementation areas needed for Phase 1: `cloud`, `endpoint`, `contracts`, `touchdesigner`, `tests` and `deployment`.
- Include placeholder READMEs that identify ownership, build commands, test commands and related specifications.
- Do not create unapproved services, public APIs, database entities or adapter contracts.
- Document that no runtime behaviour is implemented by this task.

### P1-BE-0002 — Define task completion checklist

**Status:** Complete

**Relevant ADRs:** ADR-003, ADR-030, ADR-031  
**Dependencies:** None

**Acceptance criteria:**

- Add a checklist for all Phase 1 tasks covering code, tests, migrations, contracts, documentation, rollback notes, known limitations and ADR references.
- Checklist explicitly requires a Decision Request for material ambiguity.
- Checklist explicitly forbids manual database or infrastructure changes.

### P1-BE-0003 — Add initial automated documentation checks

**Status:** Complete

**Relevant ADRs:** ADR-003, ADR-030, ADR-031  
**Dependencies:** P1-BE-0001, P1-BE-0002

**Acceptance criteria:**

- Add a repository check that validates required task metadata is present in backlog/task files.
- Add a check that flags broken relative documentation links.
- Document how to run the checks locally and in CI.

## Epic 1 — Contracts, schemas and test fixtures

### P1-BE-0101 — Create WebSocket message schemas

**Status:** Complete

**Relevant ADRs:** ADR-002, ADR-008, ADR-012, ADR-013, ADR-019, ADR-026  
**Dependencies:** P1-BE-0001

**Acceptance criteria:**

- Add schemas for `device.hello`, `server.welcome`, `device.heartbeat`, `device.command`, `device.commandAcknowledged`, `device.commandCompleted`, `device.stateChanged` and `device.healthChanged`.
- Schemas require UTC timestamps and stable message IDs.
- Command schema includes command ID, action, parameters, expiry, configuration revision and idempotency fields.
- Schemas expose logical actions only and contain no TouchDesigner operator paths.
- Add valid and invalid fixture examples for each message type.

### P1-BE-0102 — Create REST contract stubs for provisioning and device APIs

**Status:** Complete

**Relevant ADRs:** ADR-001, ADR-002, ADR-008, ADR-011, ADR-019, ADR-026  
**Dependencies:** P1-BE-0101

**Acceptance criteria:**

- Define OpenAPI or equivalent contracts for device registration, registration status, pairing session creation, pairing claim, certificate rotation, bootstrap, desired configuration fetch and configuration report.
- Device and user APIs remain separated by path and authentication scheme.
- Contracts include documented error structure and correlation ID.
- Contracts include acceptance examples for unclaimed, claimed, suspended and retired devices.

### P1-BE-0103 — Create command API contract

**Status:** Complete

**Relevant ADRs:** ADR-008, ADR-012, ADR-013, ADR-014, ADR-015, ADR-017, ADR-026  
**Dependencies:** P1-BE-0101, P1-BE-0102

**Acceptance criteria:**

- Define user command creation and command status contracts.
- Initial command set is limited to `system.getStatus`, `system.restartApplication`, `preset.activate`, `video.output.selectSource`, `holding.show`, `holding.hide`, `audio.microphones.setMuted` and `audio.master.setVolume`.
- Contract requires capability checks, actor role, expiry and idempotency key.
- Unsupported capability and expired command errors are explicit.

### P1-BE-0104 — Create capability manifest schema

**Status:** Complete

**Relevant ADRs:** ADR-008, ADR-015, ADR-016, ADR-032  
**Dependencies:** P1-BE-0101

**Acceptance criteria:**

- Schema supports TouchDesigner and System Health adapters only for Phase 1.
- Manifest records adapter type, adapter version, capability IDs and capability versions.
- Validation rejects hardware paths and engine-specific implementation details.
- Include fixture manifest for the Phase 1 single node.

### P1-BE-0105 — Create room configuration and preset schemas

**Status:** Complete

**Relevant ADRs:** ADR-008, ADR-012, ADR-017, ADR-020, ADR-026  
**Dependencies:** P1-BE-0104

**Acceptance criteria:**

- Define schemas for room configuration, adapter configuration, presets and asset references.
- Presets use logical capability actions and asset IDs.
- Persistent configuration is represented as desired state, not live commands.
- Include fixtures for the default holding state and presentation preset.

### P1-BE-0106 — Create canonical error-code catalogue

**Status:** Complete

**Relevant ADRs:** ADR-002, ADR-021, ADR-023, ADR-027  
**Dependencies:** P1-BE-0102, P1-BE-0103

**Acceptance criteria:**

- Add Phase 1 error codes for provisioning, pairing, authentication, command validation, capability mismatch, configuration activation, adapter health and package validation.
- Each error code has a user-safe message, diagnostic detail guidance and log severity.
- Errors never convert failed actions into apparent success.

## Epic 2 — Cloud data model, migrations and seed data

### P1-BE-0201 — Add initial database migration framework

**Status:** Complete

**Relevant ADRs:** ADR-003, ADR-028, ADR-029  
**Dependencies:** P1-BE-0001

**Acceptance criteria:**

- Add ordered migration tooling and migration history tracking.
- Include a clean-environment rebuild command.
- Document that manual table creation is prohibited.
- No application feature depends on tables outside migrations.

### P1-BE-0202 — Add identity, company, site and room migrations

**Status:** Complete

**Relevant ADRs:** ADR-003, ADR-011, ADR-028  
**Dependencies:** P1-BE-0201

**Acceptance criteria:**

- Add tables for company, user, company user, site and room as required for one Blue Elephant deployment.
- Scope durable records to the company where applicable without building shared multi-tenant isolation beyond Phase 1.
- Seed one Phase 1 company/site/room through code-owned seed data.
- Include rollback or down-migration policy consistent with database standards.

### P1-BE-0203 — Add device lifecycle migrations

**Status:** Complete

**Relevant ADRs:** ADR-001, ADR-002, ADR-003, ADR-011  
**Dependencies:** P1-BE-0202

**Acceptance criteria:**

- Add device, device credential, device registration, pairing session, device assignment and device adapter tables.
- Device ownership states support unregistered, pending, unclaimed, claimed, suspended, retired, transferred and revoked where documented.
- Device identity is not tied to IP address.
- Cloud stores certificate metadata only, not private keys.

### P1-BE-0204 — Add configuration, command, state and event migrations

**Status:** Complete

**Relevant ADRs:** ADR-003, ADR-012, ADR-017, ADR-019, ADR-020, ADR-021, ADR-022  
**Dependencies:** P1-BE-0203, P1-BE-0105

**Acceptance criteria:**

- Add room configuration, device configuration deployment, preset, device command, desired state, reported state snapshot and device event tables.
- Timestamps are stored in UTC.
- Command records include idempotency key, expiry, acknowledgement and completion fields.
- State records support monotonically increasing revisions.
- Event and telemetry retention fields support the documented retention model.

### P1-BE-0205 — Add release and package metadata migrations

**Status:** Complete

**Relevant ADRs:** ADR-003, ADR-010, ADR-024, ADR-029  
**Dependencies:** P1-BE-0203

**Acceptance criteria:**

- Add release records for agent, adapter and TouchDesigner project packages.
- Records include version, package hash, signature metadata, supported versions, operating systems, rollback version and release channel.
- TouchDesigner licensing is represented as deployment documentation/metadata only, not runtime licence logic.

## Epic 3 — Cloud provisioning, identity and pairing

### P1-BE-0301 — Implement unclaimed device registration endpoint

**Status:** Complete

**Relevant ADRs:** ADR-001, ADR-002, ADR-011, ADR-026  
**Dependencies:** P1-BE-0102, P1-BE-0203

**Acceptance criteria:**

- Endpoint accepts public key, generated device ID, installation ID, fingerprint and commissioning information.
- New devices are stored as pending/unclaimed without receiving production configuration or commands.
- Duplicate pending registrations are deduplicated by device identity and fingerprint policy.
- Registration returns only bootstrap status and limited registration metadata.
- Audit event is written for registration.

### P1-BE-0302 — Implement registration status polling endpoint

**Status:** Complete

**Relevant ADRs:** ADR-001, ADR-011, ADR-026  
**Dependencies:** P1-BE-0301

**Acceptance criteria:**

- Endpoint returns pending, unclaimed, claimed, suspended, retired or revoked status for the registering device.
- Response does not expose company secrets before claim.
- Response includes claim result and assigned room summary only after authorisation.

### P1-BE-0303 — Implement pairing session creation endpoint

**Status:** Complete

**Relevant ADRs:** ADR-002, ADR-011, ADR-026  
**Dependencies:** P1-BE-0301

**Acceptance criteria:**

- Device can request a short-lived one-time pairing session.
- Pairing code is stored hashed where practical.
- Pairing session includes expiry, attempt counter and device binding.
- Response includes a code and signed one-time QR token; neither contains permanent credentials.

### P1-BE-0304 — Implement pairing claim endpoint

**Status:** Complete

**Relevant ADRs:** ADR-002, ADR-011, ADR-019, ADR-026, ADR-028  
**Dependencies:** P1-BE-0303, P1-BE-0202

**Acceptance criteria:**

- Authenticated Company Admin or Technician can submit a valid code.
- Claim shows device confirmation details before final ownership change.
- Claim is one-time use, rate limited and expiry enforced.
- Successful claim assigns the Phase 1 company and writes an audit event.
- Failed attempts use explicit errors and do not leak permanent credentials.

### P1-BE-0305 — Implement device certificate issuance record

**Status:** Complete

**Relevant ADRs:** ADR-002, ADR-003, ADR-011  
**Dependencies:** P1-BE-0304, P1-BE-0203

**Acceptance criteria:**

- Claim produces a unique device certificate or certificate-backed connection credential record.
- Cloud stores certificate thumbprint, issue/expiry dates, status and revocation metadata.
- Private keys are never accepted or stored by the cloud.
- Revoked or suspended devices cannot receive valid connection tokens.

### P1-BE-0306 — Implement room assignment endpoint

**Status:** Complete

**Relevant ADRs:** ADR-008, ADR-011, ADR-026, ADR-028  
**Dependencies:** P1-BE-0304, P1-BE-0202

**Acceptance criteria:**

- Claimed Phase 1 device can be assigned to the Phase 1 room.
- Removing a device from a room does not delete the room.
- Assignment validates company ownership server-side.
- Assignment changes write audit events.

## Epic 4 — Real-time gateway, commands, state and presence

### P1-BE-0401 — Implement authenticated device WebSocket handshake

**Relevant ADRs:** ADR-001, ADR-002, ADR-019, ADR-026  
**Dependencies:** P1-BE-0101, P1-BE-0305

**Acceptance criteria:**

- Device connects over secure WebSocket using the approved credential path.
- Plain WebSocket and invalid certificate/token connections are rejected.
- Handshake processes `device.hello` and returns `server.welcome` with UTC server time and heartbeat interval.
- Device identity remains stable across IP and NAT changes.

### P1-BE-0402 — Implement heartbeat and presence tracking

**Relevant ADRs:** ADR-001, ADR-002, ADR-021, ADR-026  
**Dependencies:** P1-BE-0401

**Acceptance criteria:**

- Gateway marks device online only while WebSocket, heartbeat freshness, authentication and suspension checks are valid.
- Presence is temporary state, not the durable source of truth.
- Lost heartbeat produces offline presence and a device event.
- Browser subscription can observe online/offline changes.

### P1-BE-0403 — Implement browser room WebSocket session

**Relevant ADRs:** ADR-014, ADR-026, ADR-028  
**Dependencies:** P1-BE-0402

**Acceptance criteria:**

- Authenticated browser can subscribe to the Phase 1 room state and device presence.
- Multiple viewers are supported.
- One active User controller model is represented in session state.
- Technician/Admin takeover is represented according to ADR-014.

### P1-BE-0404 — Implement command creation service

**Relevant ADRs:** ADR-008, ADR-012, ADR-013, ADR-014, ADR-015, ADR-026  
**Dependencies:** P1-BE-0103, P1-BE-0204, P1-BE-0403

**Acceptance criteria:**

- Service validates user role, company ownership, room access, active session, capability, configuration revision, value ranges and expiry.
- Only logical Phase 1 command actions are accepted.
- Command is persisted and audited before gateway delivery.
- Gateway receives only authorised commands.

### P1-BE-0405 — Implement command delivery, acknowledgement and completion tracking

**Relevant ADRs:** ADR-002, ADR-012, ADR-013, ADR-017, ADR-019, ADR-026  
**Dependencies:** P1-BE-0404

**Acceptance criteria:**

- Gateway delivers command to the correct connected device only.
- Device acknowledgements and completions update command status independently.
- Expired commands are not delivered or replayed.
- Duplicate idempotency keys do not repeat actions.
- Command results are broadcast to subscribed browsers and audited.

### P1-BE-0406 — Implement reported state ingestion

**Relevant ADRs:** ADR-012, ADR-019, ADR-021, ADR-026  
**Dependencies:** P1-BE-0405, P1-BE-0204

**Acceptance criteria:**

- Gateway/API accepts `device.stateChanged` with monotonically increasing revision.
- Stale revisions are rejected or ignored with explicit diagnostics.
- Browser receives updated state after successful execution.
- Desired and reported state can differ visibly.

### P1-BE-0407 — Implement health event ingestion

**Relevant ADRs:** ADR-021, ADR-022, ADR-023, ADR-026  
**Dependencies:** P1-BE-0402, P1-BE-0204

**Acceptance criteria:**

- Gateway/API accepts health status, issue code, severity and first observed time.
- CPU, memory, GPU, versions, active preset and recent errors can be represented.
- Health events are retained according to Phase 1 retention metadata.
- Degraded health is visible in device detail and diagnostics.

## Epic 5 — Configuration, assets and releases

### P1-BE-0501 — Implement configuration draft validation

**Relevant ADRs:** ADR-008, ADR-012, ADR-015, ADR-020, ADR-026  
**Dependencies:** P1-BE-0105, P1-BE-0204

**Acceptance criteria:**

- Draft room configuration can be validated against schema without affecting production devices.
- Validation rejects hardware paths, unknown capabilities and invalid asset references.
- Validation result includes explicit error codes and paths.

### P1-BE-0502 — Implement configuration publication

**Relevant ADRs:** ADR-003, ADR-012, ADR-019, ADR-026  
**Dependencies:** P1-BE-0501

**Acceptance criteria:**

- Published configuration has immutable revision and UTC timestamps.
- Publishing creates or updates desired device configuration deployment records.
- Publication writes an audit event.
- Superseded revisions remain queryable.

### P1-BE-0503 — Implement desired configuration endpoint

**Relevant ADRs:** ADR-001, ADR-012, ADR-026  
**Dependencies:** P1-BE-0502, P1-BE-0306

**Acceptance criteria:**

- Claimed and assigned device can fetch desired configuration and bundle metadata.
- Unclaimed, suspended, retired or revoked devices cannot fetch production configuration.
- Response includes revision, schema version, asset IDs and package references only.

### P1-BE-0504 — Implement configuration report endpoint

**Relevant ADRs:** ADR-009, ADR-012, ADR-019, ADR-026  
**Dependencies:** P1-BE-0503

**Acceptance criteria:**

- Device reports downloaded, activated, failed and rolled-back deployment statuses.
- Active revision is visible in cloud UI/API.
- Out-of-sync desired versus reported revision is explicit.
- Failed activation records failure code and message.

### P1-BE-0505 — Implement minimal media asset metadata

**Relevant ADRs:** ADR-020, ADR-026  
**Dependencies:** P1-BE-0105, P1-BE-0204

**Acceptance criteria:**

- Configurations reference media by asset ID only.
- Asset metadata includes content hash, storage key, size and cache policy.
- Signed or protected media URLs are not logged.
- Local cache expectations are documented for endpoint tasks.

### P1-BE-0506 — Implement release manifest API

**Relevant ADRs:** ADR-003, ADR-010, ADR-024, ADR-029  
**Dependencies:** P1-BE-0205

**Acceptance criteria:**

- Device can request release manifest by release ID.
- Manifest includes hash, signature, package size, supported versions, required disk space and rollback version.
- Incompatible deployments are blocked by compatibility metadata.
- TouchDesigner licence handling remains a deployment concern.

## Epic 6 — Endpoint agent foundation

### P1-BE-0601 — Create Windows service skeleton

**Status:** Complete — P1-EPIC-05

**Relevant ADRs:** ADR-026, ADR-031  
**Dependencies:** P1-BE-0001

**Acceptance criteria:**

- Service installs, starts, stops and restarts on Windows 11 Enterprise x64.
- Service emits structured startup/shutdown logs.
- Service has no cloud or adapter behaviour beyond documented stubs.

### P1-BE-0602 — Implement local SQLite database migrations

**Status:** Complete — P1-EPIC-05

**Relevant ADRs:** ADR-003, ADR-004, ADR-012, ADR-021, ADR-026  
**Dependencies:** P1-BE-0601

**Acceptance criteria:**

- Local database stores identity metadata, last known configuration, pending telemetry, audit events, installed release metadata, update history, command deduplication and adapter state.
- Local schema changes use ordered migrations.
- Service refuses incompatible local schema versions with explicit error.

### P1-BE-0603 — Implement device identity generation and protected storage

**Status:** Complete — P1-EPIC-05

**Relevant ADRs:** ADR-001, ADR-002, ADR-011, ADR-026  
**Dependencies:** P1-BE-0602

**Acceptance criteria:**

- First launch generates device ID, installation ID, key pair, fingerprint and recovery identifier.
- Private key is stored using Windows-protected storage where possible and never logged.
- Reboot preserves identity.
- Lost identity registers as recovery candidate rather than silently duplicating a production device.

### P1-BE-0604 — Implement provisioning client

**Status:** Complete — P1-EPIC-05

**Relevant ADRs:** ADR-001, ADR-002, ADR-011, ADR-026  
**Dependencies:** P1-BE-0301, P1-BE-0302, P1-BE-0603

**Acceptance criteria:**

- Agent registers as unclaimed using outbound HTTPS.
- Agent polls registration status with retry/backoff and visible errors.
- Agent does not receive or store production configuration before claim.
- Network or API failures remain visible and are not treated as success.

### P1-BE-0605 — Implement pairing-code display data source

**Status:** Complete — P1-EPIC-05

**Relevant ADRs:** ADR-002, ADR-011, ADR-026  
**Dependencies:** P1-BE-0303, P1-BE-0604

**Acceptance criteria:**

- Agent can request pairing session and expose current code, expiry and confirmation phrase to the commissioning UI/local API.
- Expired or claimed codes are not reused.
- Pairing code is not persisted as a permanent credential.

### P1-BE-0606 — Implement cloud WebSocket connection manager

**Status:** Complete — P1-EPIC-05

**Relevant ADRs:** ADR-001, ADR-002, ADR-019, ADR-026  
**Dependencies:** P1-BE-0401, P1-BE-0604

**Acceptance criteria:**

- Agent connects over WSS using approved device credential.
- Agent sends `device.hello`, processes `server.welcome` and sends heartbeats.
- Agent reconnects after network change without re-pairing.
- Reconnect performs a fresh TLS/authentication handshake.

### P1-BE-0607 — Implement local API for diagnostics and commissioning

**Status:** Complete — P1-EPIC-05

**Relevant ADRs:** ADR-004, ADR-005, ADR-023, ADR-026  
**Dependencies:** P1-BE-0605, P1-BE-0606

**Acceptance criteria:**

- Local API binds to localhost by default and uses authenticated IPC or equivalent local protection.
- It exposes identity summary, network state, pairing status, cloud connection state, assigned room, logs path and diagnostic export trigger.
- It does not provide arbitrary shell command execution.
- Local API failure is logged with explicit error codes.

### P1-EPIC-05 completion evidence

- Changed behaviour: endpoint foundation now includes service lifecycle stubs, local persistence schema, identity generation, provisioning, pairing display, cloud connection and local diagnostics API modules.
- Files changed: `endpoint/agent/`, `endpoint/migrations/`, `endpoint/scripts/`, `endpoint/README.md`, `tests/endpoint-agent.test.mjs`, `docs/roadmaps/epics/P1-EPIC-05.md`, `docs/CHANGELOG.md`.
- Tests and checks: `npm run check`, `node --test tests/endpoint-agent.test.mjs`, `git diff --check`.
- Migrations: endpoint local migration `endpoint/migrations/0001_endpoint_agent_foundation.sql`; no cloud migration required.
- Contracts: existing REST provisioning and WebSocket message contracts reused without version change.
- Documentation: endpoint README, Epic completion record and changelog updated.
- Known limitations: no adapter host, command execution, configuration activation, update package installation or TouchDesigner lifecycle behaviour; those remain later Epic scope.
- Recovery/rollback: remove endpoint foundation files and uninstall the local Windows service if installed; no cloud database rollback is required.
- Referenced ADRs: ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-011, ADR-012, ADR-019, ADR-021, ADR-023, ADR-026, ADR-031.

## Epic 7 — Endpoint commands, state, configuration and offline operation

### P1-BE-0701 — Implement command dispatcher

**Relevant ADRs:** ADR-008, ADR-012, ADR-013, ADR-015, ADR-026  
**Dependencies:** P1-BE-0606, P1-BE-0103

**Acceptance criteria:**

- Dispatcher validates command expiry, action allow-list, configuration revision, idempotency key and required capability before adapter execution.
- Dispatcher sends separate acknowledgement and completion messages.
- Unsupported or expired commands fail explicitly and are not executed.

### P1-BE-0702 — Implement command deduplication store

**Relevant ADRs:** ADR-001, ADR-012, ADR-019, ADR-026  
**Dependencies:** P1-BE-0701, P1-BE-0602

**Acceptance criteria:**

- Completed command IDs and idempotency keys are persisted locally for the documented replay window.
- Reconnect and reboot do not duplicate completed commands.
- Deduplication decisions are logged with command ID and correlation ID.

### P1-BE-0703 — Implement configuration download and local validation

**Relevant ADRs:** ADR-012, ADR-020, ADR-026  
**Dependencies:** P1-BE-0503, P1-BE-0606

**Acceptance criteria:**

- Agent downloads desired configuration after claim and assignment.
- Agent validates schema, capability requirements and asset references locally before activation.
- Invalid configuration is rejected with explicit reason and previous known-good configuration remains active.

### P1-BE-0704 — Implement known-good configuration activation and rollback

**Relevant ADRs:** ADR-009, ADR-012, ADR-027, ADR-026  
**Dependencies:** P1-BE-0703, P1-BE-0504

**Acceptance criteria:**

- Successful activation persists active revision locally and reports it to cloud.
- Failed activation restores previous known-good configuration as a documented recovery mode.
- Rollback is triggered only by activation failure or explicit rollback target, not speculative fallback.
- Browser/cloud can see active, desired and failed revisions.

### P1-BE-0705 — Implement reported state publisher

**Relevant ADRs:** ADR-012, ADR-019, ADR-021, ADR-026  
**Dependencies:** P1-BE-0701, P1-BE-0406

**Acceptance criteria:**

- Agent publishes state changes with increasing revisions.
- State includes Phase 1 system, video, holding and audio fields.
- Publisher queues state while offline and reconciles latest revision on reconnect.
- Stale local state is not allowed to overwrite newer reported state silently.

### P1-BE-0706 — Implement local event and audit queue

**Relevant ADRs:** ADR-004, ADR-019, ADR-021, ADR-022, ADR-026  
**Dependencies:** P1-BE-0602, P1-BE-0606

**Acceptance criteria:**

- Important events queue locally when cloud is unavailable.
- Queue uploads after reconnect in UTC order with correlation IDs.
- Queue has visible capacity and disk-space diagnostics.
- Upload failures remain visible and retried according to documented policy.

### P1-BE-0707 — Implement offline local User/Technician control boundary

**Relevant ADRs:** ADR-004, ADR-005, ADR-014, ADR-018, ADR-026  
**Dependencies:** P1-BE-0607, P1-BE-0701

**Acceptance criteria:**

- Local User and Technician controls can execute permitted cached room actions while cloud is unavailable.
- Ownership, certificates, tenant membership and cloud security changes remain cloud-only.
- Offline commands use the same logical capabilities and validation path as cloud commands.
- Any local draft programming created by Technician is marked draft and requires cloud review before publish.

## Epic 8 — Adapter host, TouchDesigner adapter and simulator

### P1-BE-0801 — Define internal adapter contract in code

**Relevant ADRs:** ADR-008, ADR-015, ADR-016, ADR-032  
**Dependencies:** P1-BE-0104, P1-BE-0601

**Acceptance criteria:**

- Contract supports manifest, start, stop, configuration validation, command execution, reported state and health.
- Contract is internal to the agent and does not create a public plugin marketplace.
- Contract supports TouchDesigner and System Health adapters only in Phase 1.

### P1-BE-0802 — Implement adapter host lifecycle

**Relevant ADRs:** ADR-016, ADR-021, ADR-026, ADR-032  
**Dependencies:** P1-BE-0801, P1-BE-0602

**Acceptance criteria:**

- Agent loads configured Phase 1 adapters, starts and stops them with cancellation support.
- Adapter startup failures produce degraded health and explicit errors.
- Adapter manifests are collected and published.
- No higher-risk separate adapter process is introduced unless already documented as Phase 1 scope.

### P1-BE-0803 — Implement System Health adapter

**Relevant ADRs:** ADR-016, ADR-021, ADR-022, ADR-026  
**Dependencies:** P1-BE-0802

**Acceptance criteria:**

- Adapter reports CPU, memory, disk, GPU where available, agent version, adapter version and recent errors.
- Health output maps to the health event contract.
- Disk-space alerts are generated.

### P1-BE-0804 — Implement simulated node adapter

**Relevant ADRs:** ADR-025, ADR-026, ADR-032  
**Dependencies:** P1-BE-0802, P1-BE-0104

**Acceptance criteria:**

- Simulator implements the same adapter contract and Phase 1 capabilities without TouchDesigner hardware.
- Simulator can execute all initial commands and produce deterministic state changes.
- Simulator is usable in integration tests before large-scale hardware integration.

### P1-BE-0805 — Implement TouchDesigner process launch

**Relevant ADRs:** ADR-016, ADR-024, ADR-026, ADR-032  
**Dependencies:** P1-BE-0802, P1-BE-0704

**Acceptance criteria:**

- Adapter starts TouchDesigner with assigned project from active configuration/release metadata.
- Adapter confirms expected project version.
- Licensing assumptions are documented as deployment prerequisites, not hidden runtime logic.
- Startup failures enter degraded mode with diagnostics.

### P1-BE-0806 — Implement TouchDesigner localhost WebSocket bridge

**Relevant ADRs:** ADR-002, ADR-008, ADR-015, ADR-016, ADR-026  
**Dependencies:** P1-BE-0805

**Acceptance criteria:**

- Adapter connects to TouchDesigner over localhost only.
- Cloud APIs and messages contain no TouchDesigner operator paths.
- Bridge validates message size and expected protocol version.
- Connection failure is visible in adapter health.

### P1-BE-0807 — Implement TouchDesigner command handlers

**Relevant ADRs:** ADR-008, ADR-015, ADR-016, ADR-017, ADR-026  
**Dependencies:** P1-BE-0806, P1-BE-0701

**Acceptance criteria:**

- Implement `holding.show`, `holding.hide`, `video.output.selectSource`, `audio.microphones.setMuted`, `audio.master.setVolume`, `preset.activate`, `system.getStatus` and permitted restart action.
- Preset execution validates first, executes sequentially, stops on critical failure and reports partial success where documented.
- Command results update reported state.

### P1-BE-0808 — Implement TouchDesigner heartbeat and restart policy

**Relevant ADRs:** ADR-021, ADR-024, ADR-027, ADR-026  
**Dependencies:** P1-BE-0806

**Acceptance criteria:**

- Adapter detects project heartbeat loss.
- Agent restarts TouchDesigner according to a documented policy.
- Repeated crashes enter degraded mode rather than endless restart loop.
- Restart policy is not a speculative fallback chain; it is documented and tested.

## Epic 9 — Cloud web application Phase 1 screens

### P1-BE-0901 — Build admin unclaimed-device queue

**Relevant ADRs:** ADR-011, ADR-026, ADR-028  
**Dependencies:** P1-BE-0301, P1-BE-0302

**Acceptance criteria:**

- Admin can view unclaimed devices with name, model, first seen time, short fingerprint, local IP and agent version.
- Queue excludes company secrets and production controls for unclaimed devices.
- Duplicate pending registrations are presented clearly.

### P1-BE-0902 — Build pairing claim flow

**Relevant ADRs:** ADR-002, ADR-011, ADR-026  
**Dependencies:** P1-BE-0304, P1-BE-0901

**Acceptance criteria:**

- Admin/Technician can enter pairing code or use QR token.
- UI shows device confirmation details and confirmation phrase before claim.
- Expired, reused or rate-limited codes display explicit errors.
- Successful claim updates device status and audit trail.

### P1-BE-0903 — Build room assignment screen

**Relevant ADRs:** ADR-008, ADR-011, ADR-026, ADR-028  
**Dependencies:** P1-BE-0306, P1-BE-0902

**Acceptance criteria:**

- Claimed device can be assigned to Phase 1 room.
- UI displays current assignment and active configuration revision.
- Removing or changing assignment does not delete room.

### P1-BE-0904 — Build device detail and diagnostics screen

**Relevant ADRs:** ADR-021, ADR-022, ADR-023, ADR-026  
**Dependencies:** P1-BE-0402, P1-BE-0407, P1-BE-0706

**Acceptance criteria:**

- Screen shows online/offline, health, agent version, adapter versions, active preset, active configuration revision and recent errors.
- Screen allows only documented constrained support actions such as diagnostic bundle and permitted restart.
- It does not expose remote shell or arbitrary file access.

### P1-BE-0905 — Build basic room control page

**Relevant ADRs:** ADR-008, ADR-012, ADR-013, ADR-014, ADR-026  
**Dependencies:** P1-BE-0403, P1-BE-0404, P1-BE-0406

**Acceptance criteria:**

- Page displays presentation controls, holding controls, microphone mute and master volume using logical capability labels.
- Page shows online/offline, current state, command pending/acknowledged/completed/failed status and active controller.
- Unauthorized controls are hidden or disabled based on server-side authorisation.

### P1-BE-0906 — Build event log view

**Relevant ADRs:** ADR-019, ADR-021, ADR-022, ADR-023, ADR-026  
**Dependencies:** P1-BE-0204, P1-BE-0407

**Acceptance criteria:**

- View shows pairing, claim, assignment, configuration publication, commands, failures, health changes and support actions.
- Timestamps display in room timezone while stored in UTC.
- Sensitive values are not displayed.

## Epic 10 — Packaging, deployment and infrastructure as code

### P1-BE-1001 — Add Phase 1 cloud infrastructure module skeleton

**Relevant ADRs:** ADR-003, ADR-028, ADR-029  
**Dependencies:** P1-BE-0001

**Acceptance criteria:**

- Define infrastructure-as-code modules for the single Blue Elephant Phase 1 environment.
- Include placeholders for API, gateway, database, Redis/session store, object storage and web app where used by implementation.
- No manual infrastructure steps are required except documented credentials/bootstrap inputs.

### P1-BE-1002 — Add environment configuration contract

**Relevant ADRs:** ADR-003, ADR-028, ADR-029  
**Dependencies:** P1-BE-1001

**Acceptance criteria:**

- Define required environment variables, secrets and deployment manifest fields.
- Separate deployment configuration from runtime code.
- Document how future client environments would reuse the same modules without copying and editing the project.

### P1-BE-1003 — Build endpoint installer package

**Relevant ADRs:** ADR-003, ADR-010, ADR-024, ADR-026, ADR-029  
**Dependencies:** P1-BE-0601, P1-BE-0603

**Acceptance criteria:**

- Installer installs Windows service, required local directories, adapter package and commissioning UI/local access point.
- Installer registers service for auto-start.
- Installer records installed version metadata.
- Installer does not embed long-lived shared fleet secrets.

### P1-BE-1004 — Build TouchDesigner project package manifest

**Relevant ADRs:** ADR-010, ADR-020, ADR-024, ADR-026  
**Dependencies:** P1-BE-0506, P1-BE-0805

**Acceptance criteria:**

- Package manifest records project version, hash, signature metadata, required TouchDesigner version and asset references.
- Licensing prerequisite is documented outside runtime logic.
- Package can be validated by the endpoint before launch.

### P1-BE-1005 — Implement package validation on endpoint

**Relevant ADRs:** ADR-002, ADR-003, ADR-010, ADR-026  
**Dependencies:** P1-BE-0506, P1-BE-1003, P1-BE-1004

**Acceptance criteria:**

- Endpoint verifies package hash and signature before install or activation.
- Unsigned or altered packages are rejected with explicit errors.
- Current and previous packages remain available for rollback.

### P1-BE-1006 — Add release and rollback documentation

**Relevant ADRs:** ADR-003, ADR-010, ADR-027, ADR-029  
**Dependencies:** P1-BE-1005

**Acceptance criteria:**

- Document release creation, deployment rings, activation, failure handling and rollback target selection.
- Rollback is a documented operating mode with trigger, owner, test plan and failure behaviour.
- Documentation includes recovery notes for endpoint, adapter and project package failures.

## Epic 11 — Monitoring, diagnostics and support

### P1-BE-1101 — Implement structured logging standard in cloud services

**Relevant ADRs:** ADR-019, ADR-021, ADR-022, ADR-023  
**Dependencies:** P1-BE-0106

**Acceptance criteria:**

- Logs include correlation ID, actor/device where applicable, UTC timestamp and error code.
- Sensitive values such as passwords, private keys, tokens and signed URLs are not logged.
- Failed operations remain failed in logs and API responses.

### P1-BE-1102 — Implement structured logging standard in endpoint agent

**Relevant ADRs:** ADR-019, ADR-021, ADR-022, ADR-023  
**Dependencies:** P1-BE-0601, P1-BE-0106

**Acceptance criteria:**

- Endpoint logs include correlation ID, command ID/device ID where applicable, UTC timestamp and error code.
- Private keys, device tokens and pairing permanent secrets are never logged.
- Logs are stored in protected writable directories and can be included in diagnostic bundle.

### P1-BE-1103 — Implement diagnostic bundle export

**Relevant ADRs:** ADR-021, ADR-022, ADR-023, ADR-026  
**Dependencies:** P1-BE-0607, P1-BE-1102

**Acceptance criteria:**

- Bundle includes logs, local configuration summary, versions, recent health, recent commands and environment summary.
- Bundle excludes private keys, tokens, passwords and sensitive media URLs.
- Bundle can be triggered locally and by a constrained cloud support action.

### P1-BE-1104 — Implement offline and disk-space alerts

**Relevant ADRs:** ADR-021, ADR-022, ADR-026  
**Dependencies:** P1-BE-0402, P1-BE-0803

**Acceptance criteria:**

- Cloud identifies offline device after missed heartbeat threshold.
- Endpoint reports low disk capacity before local queues or packages become unsafe.
- Alerts are visible on device detail and event log.

## Epic 12 — Security hardening and permission checks

### P1-BE-1201 — Implement user/device authentication separation tests

**Relevant ADRs:** ADR-002, ADR-011, ADR-028  
**Dependencies:** P1-BE-0305, P1-BE-0401

**Acceptance criteria:**

- User credentials cannot authenticate to device APIs or gateway as a device.
- Device credentials cannot authenticate to user/admin APIs.
- Suspended, retired and revoked devices cannot connect.

### P1-BE-1202 — Implement tenant and ownership authorisation tests

**Relevant ADRs:** ADR-008, ADR-011, ADR-028  
**Dependencies:** P1-BE-0306, P1-BE-0404

**Acceptance criteria:**

- Server-side checks prevent one company from controlling another company's device, even though Phase 1 has one deployment.
- Browser-provided company IDs are not trusted without authenticated user membership validation.
- Device assignment and command routing verify ownership.

### P1-BE-1203 — Implement command allow-list security tests

**Relevant ADRs:** ADR-008, ADR-015, ADR-023, ADR-026  
**Dependencies:** P1-BE-0404, P1-BE-0701

**Acceptance criteria:**

- Generic shell, PowerShell, arbitrary file write and arbitrary process launch commands are rejected.
- Unknown capabilities are rejected clearly.
- TouchDesigner paths are rejected at API and adapter boundaries.

### P1-BE-1204 — Implement local API exposure tests

**Relevant ADRs:** ADR-004, ADR-005, ADR-023, ADR-026  
**Dependencies:** P1-BE-0607

**Acceptance criteria:**

- Local API is not reachable from non-localhost interfaces by default.
- Local support actions require documented local authentication/IPC protection.
- Local API does not expose permanent secrets or arbitrary command execution.

### P1-BE-1205 — Implement certificate revocation and rotation tests

**Relevant ADRs:** ADR-001, ADR-002, ADR-011  
**Dependencies:** P1-BE-0305, P1-BE-0401, P1-BE-0606

**Acceptance criteria:**

- Revoked device certificate prevents reconnection.
- Certificate validation failure prevents connection.
- Certificate renewal/rotation can complete without losing ownership.
- Reconnection after IP change still performs fresh TLS/authentication validation.

## Epic 13 — End-to-end acceptance, resilience and operational readiness

### P1-BE-1301 — Create clean-environment rebuild test

**Relevant ADRs:** ADR-003, ADR-028, ADR-029  
**Dependencies:** P1-BE-0205, P1-BE-1001

**Acceptance criteria:**

- Test creates a clean database using migrations only.
- Test provisions reference data using code-owned seed process only.
- Test deploys required infrastructure from code in a non-production environment.
- Migration checksums/history are verified.

### P1-BE-1302 — Create simulator end-to-end lifecycle test

**Relevant ADRs:** ADR-001, ADR-002, ADR-011, ADR-025, ADR-026  
**Dependencies:** P1-BE-0804, P1-BE-0905

**Acceptance criteria:**

- Simulator installs/starts, registers, pairs, claims, assigns to room, receives configuration, executes command and reports state.
- Browser receives confirmed result.
- Test covers reconnect without command duplication.

### P1-BE-1303 — Create Windows endpoint installation acceptance test

**Relevant ADRs:** ADR-010, ADR-024, ADR-026  
**Dependencies:** P1-BE-1003, P1-BE-0606

**Acceptance criteria:**

- Clean supported Windows image installs agent package.
- Service starts automatically and displays/serves pairing data.
- Reboot preserves identity and service auto-starts.
- Diagnostic bundle can be exported.

### P1-BE-1304 — Create TouchDesigner hardware-path abstraction test

**Relevant ADRs:** ADR-008, ADR-015, ADR-016, ADR-032  
**Dependencies:** P1-BE-0807, P1-BE-0905

**Acceptance criteria:**

- Browser sends logical command such as `video.output.selectSource`.
- Cloud command records and gateway messages contain no TouchDesigner operator paths.
- Adapter maps command to TouchDesigner locally and reports logical state.

### P1-BE-1305 — Create network loss and roaming resilience test

**Relevant ADRs:** ADR-001, ADR-002, ADR-004, ADR-026  
**Dependencies:** P1-BE-0606, P1-BE-0706, P1-BE-0808

**Acceptance criteria:**

- Active video output continues when internet is removed.
- Agent reconnects after network recovery, DHCP change, wired/wireless move or NAT change without re-pairing.
- Expired commands are not replayed.
- Desired and reported revisions reconcile after reconnect.

### P1-BE-1306 — Create reboot while offline recovery test

**Relevant ADRs:** ADR-004, ADR-012, ADR-026, ADR-027  
**Dependencies:** P1-BE-0704, P1-BE-0805, P1-BE-1003

**Acceptance criteria:**

- Endpoint reboots while cloud is unavailable.
- Agent starts, loads last known configuration, starts TouchDesigner and restores active state without manual repair.
- Queued events upload after cloud reconnect.
- Any recovery action is visible in logs and event history.

### P1-BE-1307 — Create configuration failure rollback test

**Relevant ADRs:** ADR-009, ADR-012, ADR-027  
**Dependencies:** P1-BE-0704, P1-BE-0504

**Acceptance criteria:**

- Invalid or failed configuration activation is rejected with clear reason.
- Previous known-good configuration remains active.
- Cloud shows desired, failed and active revisions distinctly.
- Rollback path matches documented trigger and does not hide failure.

### P1-BE-1308 — Create update package validation and rollback test

**Relevant ADRs:** ADR-003, ADR-010, ADR-027, ADR-029  
**Dependencies:** P1-BE-1005, P1-BE-1006

**Acceptance criteria:**

- Valid package hash/signature passes.
- Unsigned or altered package is rejected.
- Failed update rolls back to previous package according to documented rollback mode.
- Update result is audited.

### P1-BE-1309 — Create Phase 1 demonstration script

**Relevant ADRs:** ADR-001, ADR-002, ADR-004, ADR-008, ADR-011, ADR-012, ADR-016, ADR-026  
**Dependencies:** P1-BE-1302, P1-BE-1303, P1-BE-1304, P1-BE-1305, P1-BE-1306

**Acceptance criteria:**

- Script covers install, identity generation, pairing code display, cloud claim, room assignment, configuration push, presentation command, TouchDesigner execution, browser state update, network loss/reconnect and reboot recovery.
- Script identifies exact expected evidence for each step.
- Known limitations and rollback/recovery notes are documented.

## Decision checkpoints before implementation

The following tasks reference ADRs currently proposed or in review and must verify decision status before code implementation:

- ADR-005 offline control: P1-BE-0707 and related local control tests.
- ADR-006/ADR-014 room control session behaviour: P1-BE-0403 and P1-BE-0905. ADR-014 is confirmed and should be used if ADR-006 remains superseded by it.
- ADR-007/ADR-017 preset partial failure: P1-BE-0807. ADR-017 is confirmed and should be used if ADR-007 remains superseded by it.
- ADR-009 configuration drift: P1-BE-0504, P1-BE-0704 and P1-BE-1307.
- ADR-010 compatibility matrix: P1-BE-0205, P1-BE-0506 and release/update tasks.

## Completion evidence expected for every task

Each completed task must record:

- Changed behaviour.
- Files changed.
- Tests and checks run with results.
- Migrations added or confirmation none were needed.
- Contracts updated or confirmation none were affected.
- Documentation updated.
- Known limitations.
- Recovery or rollback notes where applicable.
- Referenced ADRs.
