# Decision Request: DR-P1-EPIC-07-ADR-009-CONFIGURATION-REPORTING

## Task

P1-BE-0504 — Implement configuration report endpoint.

## Decision required

Confirm the authoritative behaviour for desired-versus-reported configuration drift before implementing the cloud configuration report endpoint.

## Existing constraints

- PP-009 requires AI agents to implement decisions rather than silently make material architecture or product decisions.
- PP-010 requires failures to be visible and actionable.
- ADR-009 is currently **In Review** and only proposes that published configuration remains authoritative and local drift can be restored.
- ADR-012 is Confirmed and states persistent configuration uses desired state.
- ADR-019 is Confirmed and requires UTC timestamps.

## Options

### Option A

Confirm ADR-009 as written: published configuration remains authoritative, permitted live adjustments are reported state rather than configuration, unapproved drift is reported explicitly, and restoration is handled by a later approved endpoint/agent workflow.

Benefits: preserves cloud desired-state authority and makes drift visible. Risks: requires explicit product wording for what counts as permitted live adjustment.

### Option B

Allow device-reported active configuration to supersede cloud desired configuration when a Technician made local changes.

Benefits: may reflect emergency local support workflows. Risks: weakens desired-state source of truth and could conflict with ADR-012 without a separate publish/review workflow.

## Recommendation

Choose Option A and confirm ADR-009 before implementing P1-BE-0504. This keeps Phase 1 small, explicit and aligned to desired-state authority.

## Work blocked

- P1-BE-0504 configuration report endpoint implementation.
- Marking P1-EPIC-07 complete and reaching its Review Gate.

## Work that can continue

- P1-BE-0501 configuration draft validation.
- P1-BE-0502 configuration publication.
- P1-BE-0503 desired configuration endpoint.
- P1-BE-0505 media asset metadata.
