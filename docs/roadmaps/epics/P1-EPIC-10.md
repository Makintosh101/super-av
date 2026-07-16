# P1-EPIC-10 — Phase 1 Web Application Screens

**Roadmap:** [RM-P1-04](../RM-P1-04.md)

## Goal

Build the minimum admin, technician, device detail, room control and event log screens.

## Scope

This Epic groups closely related Phase 1 management tasks from the existing engineering backlog. It is a planning document only and does not introduce code changes or new architecture.

## Tasks

- [P1-BE-0901](../../tasks/PHASE_1_ENGINEERING_BACKLOG.md#p1-be-0901-build-admin-unclaimed-device-queue) — Build admin unclaimed-device queue
- [P1-BE-0902](../../tasks/PHASE_1_ENGINEERING_BACKLOG.md#p1-be-0902-build-pairing-claim-flow) — Build pairing claim flow
- [P1-BE-0903](../../tasks/PHASE_1_ENGINEERING_BACKLOG.md#p1-be-0903-build-room-assignment-screen) — Build room assignment screen
- [P1-BE-0904](../../tasks/PHASE_1_ENGINEERING_BACKLOG.md#p1-be-0904-build-device-detail-and-diagnostics-screen) — Build device detail and diagnostics screen
- [P1-BE-0905](../../tasks/PHASE_1_ENGINEERING_BACKLOG.md#p1-be-0905-build-basic-room-control-page) — Build basic room control page
- [P1-BE-0906](../../tasks/PHASE_1_ENGINEERING_BACKLOG.md#p1-be-0906-build-event-log-view) — Build event log view

## Dependencies

- [P1-EPIC-04](P1-EPIC-04.md)
- [P1-EPIC-06](P1-EPIC-06.md)
- [P1-EPIC-07](P1-EPIC-07.md)
- [P1-EPIC-08](P1-EPIC-08.md)

## ADR cross-reference

- [ADR-002](../../decisions/ADR-002-how-is-communication-between-cloud-services-and-nodes-encrypted.md)
- [ADR-008](../../decisions/ADR-008-should-cloud-controls-address-physical-devices-directly.md)
- [ADR-011](../../decisions/ADR-011-what-is-the-default-device-lifecycle.md)
- [ADR-012](../../decisions/ADR-012-should-long-term-settings-use-commands-or-desired-state.md)
- [ADR-013](../../decisions/ADR-013-command-priority.md)
- [ADR-014](../../decisions/ADR-014-room-control-sessions.md)
- [ADR-019](../../decisions/ADR-019-time-standard.md)
- [ADR-021](../../decisions/ADR-021-monitoring.md)
- [ADR-022](../../decisions/ADR-022-telemetry-retention.md)
- [ADR-023](../../decisions/ADR-023-remote-support.md)
- [ADR-026](../../decisions/ADR-026-phase-1-mvp.md)
- [ADR-028](../../decisions/ADR-028-what-tenancy-model-should-be-used-initially-and-for-future-external-cu.md)

## Dependency diagram

```mermaid
flowchart TD
  P1_EPIC_10["P1-EPIC-10<br/>Phase 1 Web Application Screens"]
  P1_EPIC_04 --> P1_EPIC_10
  P1_EPIC_06 --> P1_EPIC_10
  P1_EPIC_07 --> P1_EPIC_10
  P1_EPIC_08 --> P1_EPIC_10
  P1_EPIC_10 --> P1_BE_0901["P1-BE-0901"]
  P1_EPIC_10 --> P1_BE_0902["P1-BE-0902"]
  P1_EPIC_10 --> P1_BE_0903["P1-BE-0903"]
  P1_EPIC_10 --> P1_BE_0904["P1-BE-0904"]
  P1_EPIC_10 --> P1_BE_0905["P1-BE-0905"]
  P1_EPIC_10 --> P1_BE_0906["P1-BE-0906"]
```

## Review Gate checklist

- Task links point to the authoritative Phase 1 Engineering Backlog.
- Referenced ADRs have been reviewed for the task scope.
- Any proposed or in-review ADR dependency is handled by a Decision Request before implementation.
- Deliverables remain inside Phase 1 and do not create new architecture.
- Completion evidence covers behaviour, files, tests, migrations, contracts, documentation, limitations, rollback notes and ADRs.
## P1-EPIC-10 completion evidence

Status: Complete pending Review Gate approval.

Completed tasks:

- P1-BE-0901 — Build admin unclaimed-device queue.
- P1-BE-0902 — Build pairing claim flow.
- P1-BE-0903 — Build room assignment screen.
- P1-BE-0904 — Build device detail and diagnostics screen.
- P1-BE-0905 — Build basic room control page.
- P1-BE-0906 — Build event log view.

Changed behaviour: the cloud implementation now includes framework-neutral Phase 1 web application screen view models for the admin unclaimed-device queue, pairing claim flow, room assignment, device diagnostics, room controls and event log. The screens enforce server-side role and company checks, expose only logical capability labels, preserve explicit pairing and authorization errors, constrain support actions, and sanitise event-log details before display.

Files changed: `cloud/web-app-screens.mjs`, `cloud/provisioning/provisioning-service.mjs`, `tests/web-app-screens.test.mjs`, `cloud/README.md`, `docs/roadmaps/epics/P1-EPIC-10.md`, `docs/tasks/PHASE_1_ENGINEERING_BACKLOG.md` and `docs/CHANGELOG.md`.

Tests and checks: `npm test` passed, including documentation, contract, database and unit-test validation. `git diff --check` passed.

Migrations: none; no database schema change was required.

Contracts: none; existing provisioning, gateway, configuration and message contracts were reused without public API changes.

Documentation: cloud README, P1-EPIC-10 record, Engineering Backlog and changelog were updated.

Known limitations: no deployed browser framework, HTTP route, infrastructure module, packaged installer or monitoring hardening is introduced by this Epic; those remain later authorised scope.

Recovery/rollback: revert the P1-EPIC-10 commit to remove screen view models and tests; no database rollback is required.

Referenced ADRs: ADR-002, ADR-008, ADR-011, ADR-012, ADR-013, ADR-014, ADR-019, ADR-021, ADR-022, ADR-023, ADR-026 and ADR-028.

Review Gate: reached; do not begin P1-EPIC-11 until P1-EPIC-10 Review Gate approval is complete.
