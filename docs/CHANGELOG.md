# Documentation Changelog

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

## 2026-07-15 — P1-EPIC-07 partial implementation

- Added cloud configuration service support for draft validation, immutable publication, desired configuration fetch and minimal media asset metadata.
- Added unit coverage for validation failures, publication supersession, desired configuration authorization and media metadata URL rejection.
- Added desired configuration contract details and Decision Requests blocking configuration report and release manifest implementation until ADR-009 and ADR-010 are confirmed.
