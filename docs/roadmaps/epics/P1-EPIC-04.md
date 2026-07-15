# P1-EPIC-04 — Cloud Provisioning, Identity, Pairing and Assignment

**Roadmap:** [RM-P1-02](../RM-P1-02.md)

## Goal

Allow a new endpoint to register, be claimed, receive a credential and be assigned to the Phase 1 room.

## Scope

This Epic groups closely related Phase 1 management tasks from the existing engineering backlog. It is a planning document only and does not introduce code changes or new architecture.

## Tasks

- [P1-BE-0301](../../tasks/PHASE_1_ENGINEERING_BACKLOG.md#p1-be-0301-implement-unclaimed-device-registration-endpoint) — Implement unclaimed device registration endpoint
- [P1-BE-0302](../../tasks/PHASE_1_ENGINEERING_BACKLOG.md#p1-be-0302-implement-registration-status-polling-endpoint) — Implement registration status polling endpoint
- [P1-BE-0303](../../tasks/PHASE_1_ENGINEERING_BACKLOG.md#p1-be-0303-implement-pairing-session-creation-endpoint) — Implement pairing session creation endpoint
- [P1-BE-0304](../../tasks/PHASE_1_ENGINEERING_BACKLOG.md#p1-be-0304-implement-pairing-claim-endpoint) — Implement pairing claim endpoint
- [P1-BE-0305](../../tasks/PHASE_1_ENGINEERING_BACKLOG.md#p1-be-0305-implement-device-certificate-issuance-record) — Implement device certificate issuance record
- [P1-BE-0306](../../tasks/PHASE_1_ENGINEERING_BACKLOG.md#p1-be-0306-implement-room-assignment-endpoint) — Implement room assignment endpoint

## Dependencies

- [P1-EPIC-02](P1-EPIC-02.md)
- [P1-EPIC-03](P1-EPIC-03.md)

## ADR cross-reference

- [ADR-001](../../decisions/ADR-001-can-a-node-move-between-networks-or-public-ip-addresses-without-re-pai.md)
- [ADR-002](../../decisions/ADR-002-how-is-communication-between-cloud-services-and-nodes-encrypted.md)
- [ADR-008](../../decisions/ADR-008-should-cloud-controls-address-physical-devices-directly.md)
- [ADR-011](../../decisions/ADR-011-what-is-the-default-device-lifecycle.md)
- [ADR-019](../../decisions/ADR-019-time-standard.md)
- [ADR-026](../../decisions/ADR-026-phase-1-mvp.md)
- [ADR-028](../../decisions/ADR-028-what-tenancy-model-should-be-used-initially-and-for-future-external-cu.md)

## Dependency diagram

```mermaid
flowchart TD
  P1_EPIC_04["P1-EPIC-04<br/>Cloud Provisioning, Identity, Pairing and Assignment"]
  P1_EPIC_02 --> P1_EPIC_04
  P1_EPIC_03 --> P1_EPIC_04
  P1_EPIC_04 --> P1_BE_0301["P1-BE-0301"]
  P1_EPIC_04 --> P1_BE_0302["P1-BE-0302"]
  P1_EPIC_04 --> P1_BE_0303["P1-BE-0303"]
  P1_EPIC_04 --> P1_BE_0304["P1-BE-0304"]
  P1_EPIC_04 --> P1_BE_0305["P1-BE-0305"]
  P1_EPIC_04 --> P1_BE_0306["P1-BE-0306"]
```

## Review Gate checklist

- Task links point to the authoritative Phase 1 Engineering Backlog.
- Referenced ADRs have been reviewed for the task scope.
- Any proposed or in-review ADR dependency is handled by a Decision Request before implementation.
- Deliverables remain inside Phase 1 and do not create new architecture.
- Completion evidence covers behaviour, files, tests, migrations, contracts, documentation, limitations, rollback notes and ADRs.

## Implementation status

- Status: Complete.
- Completed tasks: P1-BE-0301, P1-BE-0302, P1-BE-0303, P1-BE-0304, P1-BE-0305 and P1-BE-0306.
- Review Gate: ready for Product Owner review after remote repository verification.

## Epic Completion Report

### Executive summary

Epic 4 adds the Phase 1 provisioning implementation for unclaimed device registration, registration status polling, pairing session creation, pairing claim, certificate metadata issuance and room assignment.

### Deliverables

- Framework-neutral cloud provisioning service functions for the approved endpoint behaviour.
- OpenAPI response contracts for registration, status polling, pairing, claim and room assignment.
- Additive migration `0006` for provisioning metadata alignment with the implemented contract.
- Unit tests covering duplicate registration, limited pre-claim visibility, hashed one-time pairing codes, expiry, role checks, certificate metadata-only storage and ownership-validated room assignment.

### Migration summary

Migration `0006_epic04_provisioning_metadata.sql` adds public-key fingerprint, installation, fingerprint, commissioning, QR token, claim actor and revocation-reason metadata. It also renames certificate fingerprint terminology to certificate thumbprint. No manual database changes are required or permitted.

### Contract updates

`contracts/openapi/node-api.yaml` now documents concrete response bodies for the Epic 4 provisioning endpoints and the Phase 1 room assignment endpoint.

### Security review

Pairing codes are hashed in stored session records and exposed only in the creation response. Claim enforces Blue Elephant company admin/technician access, expiry and one-time use. Certificate records contain thumbprint and lifecycle metadata only; endpoint private keys are rejected. Registration and polling keep pre-claim access limited.

### Known limitations

No deployed HTTP server or infrastructure is introduced in this epic. The implementation is transport-neutral product logic to be wired into the approved cloud runtime by a later scoped task.

### Recovery / rollback notes

For a failed pre-production deployment, rebuild the empty database from the ordered migration chain and revert the Epic 4 code, contract, migration, test and documentation changes together.

### Decision Requests

None.

### Referenced ADRs

ADR-001, ADR-002, ADR-008, ADR-011, ADR-019, ADR-026 and ADR-028.
