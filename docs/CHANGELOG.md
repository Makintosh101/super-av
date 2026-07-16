# Documentation Changelog

## P1-EPIC-13 — End-to-End Acceptance, Resilience and Operational Readiness

- Added aggregate Phase 1 acceptance and resilience coverage for clean rebuild, simulator lifecycle, Windows endpoint installation evidence, TouchDesigner abstraction, network loss/roaming, offline reboot recovery, configuration rollback and package validation rollback.
- Added the Phase 1 demonstration script with expected evidence, known limitations and recovery notes.
- No migrations, public API changes, WebSocket contract changes or infrastructure changes were required.
- Validation: `npm test` and `git diff --check` passed.


## P1-EPIC-12 — Packaging, Deployment, Infrastructure and Package Validation

- Added Phase 1 Blue Elephant infrastructure module skeleton and environment configuration contract.
- Added endpoint installer manifest, TouchDesigner package manifest and endpoint package hash/signature validation with rollback package preservation.
- Added release and rollback operating documentation.
- Validation: `npm test` and `git diff --check` passed.

## 2026-07-15 — Revision 7

Completed Epic 3 cloud database migration foundation. Added ordered PostgreSQL migrations, idempotent Blue Elephant seed data, `check:db` validation and database recovery documentation while preserving the Epic 2 contract validation baseline.

## 2026-07-14 — Revision 5

Completed Epic 1 repository, delivery controls and documentation baseline. Added placeholder implementation-area READMEs, the Phase 1 task completion checklist, automated documentation checks for task metadata and relative Markdown links, and updated Epic/backlog task status.

## 2026-07-14 — Revision 4

Added the Phase 1 Development Playbook as the permanent engineering workflow for human and AI contributors, including lifecycle, source-of-truth hierarchy, Decision Request workflow, review gates and Definition of Done.

## 2026-07-14 — Revision 3

Added a complete Phase 1 engineering backlog with epics, sub-day tasks, ADR references, dependencies, acceptance criteria, decision checkpoints and completion evidence expectations.

## 2026-07-14 — Revision 2

Added network roaming, TLS reconnection, certificate lifecycle, replay protection, database migrations, infrastructure as code, clean-environment rebuild testing and related acceptance tests.

## P1-EPIC-04

Implemented Phase 1 cloud provisioning, identity, pairing and assignment logic. Added framework-neutral provisioning handlers, endpoint contract schemas, provisioning metadata migration, tests for registration/pairing/credential/assignment security rules and Epic 4 completion evidence.
## 2026-07-15 — P1-EPIC-05 Endpoint Agent Foundation

- Added the Phase 1 endpoint agent foundation with service lifecycle stubs, local schema migration, protected identity metadata storage, provisioning client, pairing display source, cloud connection manager and localhost diagnostics API.
- Added endpoint unit coverage for service logging, schema compatibility checks, identity persistence, provisioning failure visibility, pairing expiry handling, cloud hello/heartbeat messages and local API localhost authentication.
- Documented endpoint scope boundaries, Windows service scripts, local database schema and diagnostics API behaviour.


## 2026-07-15 — P1-EPIC-06 Real-Time Gateway, Presence, Commands and State Transport

- Added the Phase 1 repository-local real-time gateway implementation covering authenticated device WebSocket handshake, temporary presence, browser room sessions, command creation/delivery/status tracking, reported state ingestion and health ingestion.
- Added unit coverage for secure gateway handshake rejection, heartbeat/offline transitions, room controller takeover, command idempotency/status lifecycle, logical command validation, stale reported-state rejection and health severity validation.
- Documented gateway scope boundaries, contract reuse, no-migration impact, security constraints and Epic 6 completion evidence.

## 2026-07-15 — P1-EPIC-08 endpoint command, state, configuration and offline operation

Completed P1-EPIC-08 local endpoint execution scope. Added command dispatch and deduplication modules, desired-configuration validation and known-good activation state, reported-state and local event queues, offline User/Technician control boundary, endpoint documentation, backlog completion evidence and unit tests. No public contract, cloud migration, endpoint migration or infrastructure change was required.

## 2026-07-15 — P1-EPIC-07 partial implementation

- Added cloud configuration service support for draft validation, immutable publication, desired configuration fetch and minimal media asset metadata.
- Added unit coverage for validation failures, publication supersession, desired configuration authorization and media metadata URL rejection.
- Added desired configuration contract details and Decision Requests blocking configuration report and release manifest implementation until ADR-009 and ADR-010 are confirmed.

## 2026-07-15 — P1-EPIC-09 Adapter Host, Simulator and TouchDesigner Adapter

Completed P1-EPIC-09 endpoint adapter scope. Added the internal adapter contract, adapter host lifecycle, System Health adapter, deterministic simulated TouchDesigner adapter, TouchDesigner process/localhost bridge boundary, logical command handlers, heartbeat detection and bounded restart policy. Added unit coverage for adapter contract enforcement, degraded startup diagnostics, health reporting, simulator state changes, localhost/protocol/message validation, TouchDesigner command mapping and restart-limit degradation. No public API, cloud contract, database migration or infrastructure change was required.
## P1-EPIC-10 — Phase 1 Web Application Screens

- Added framework-neutral Phase 1 web application screen view models for unclaimed-device queue, pairing claim, room assignment, device diagnostics, room controls and event log.
- Preserved server-side role/company checks, logical capability labels, constrained support actions and sanitized event display.
- Added unit coverage for all P1-EPIC-10 tasks.
- Migrations: none. Contracts: none. Infrastructure: none.

## P1-EPIC-11 — Monitoring, Diagnostics, Support and Security Hardening

- Added cloud and endpoint structured logging helpers with UTC timestamps, correlation context, actor/device or command context, explicit error codes and sensitive-field redaction.
- Added endpoint diagnostic bundle export with redacted logs, configuration summary, versions, recent health, recent commands and environment summary.
- Added gateway offline and low-disk alert records surfaced through diagnostics/event-log state.
- Added Phase 1 security regression coverage for user/device authentication separation, tenant ownership checks, command allow-list rejection, localhost local API exposure and certificate revocation/rotation.
- Migrations: none. Contracts: none. Infrastructure: none.


## 2026-07-16 — P1-EPIC-13 — End-to-End Acceptance, Resilience and Operational Readiness

- Added repository-owned Phase 1 acceptance coverage for clean rebuild evidence, simulator lifecycle, Windows endpoint installation evidence, TouchDesigner hardware-path abstraction, network loss/roaming resilience, offline reboot recovery, configuration failure rollback, update package validation/rollback and the Phase 1 demonstration script.
- Updated configuration activation failure handling so rejected desired revisions are persisted and reported distinctly from the previous known-good active revision.
- Added the Phase 1 demonstration script with expected evidence, limitations and rollback/recovery notes.
- Migrations: none. Contracts: none. Infrastructure: none.
