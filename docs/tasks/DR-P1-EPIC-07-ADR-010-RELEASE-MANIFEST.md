# Decision Request: DR-P1-EPIC-07-ADR-010-RELEASE-MANIFEST

## Task

P1-BE-0506 — Implement release manifest API.

## Decision required

Confirm the compatibility matrix semantics required to block incompatible release deployments before implementing the release manifest API.

## Existing constraints

- PP-003 and ADR-003 require release metadata and deployment configuration to be code-owned source of truth.
- ADR-010 is currently **Proposed** and requires an explicit compatibility matrix that blocks incompatible deployments.
- ADR-024 is Confirmed and keeps TouchDesigner licence handling as a deployment concern, not runtime logic.
- ADR-029 is Confirmed and requires deployments to be created from the same repository rather than copied manually.

## Options

### Option A

Confirm ADR-010 with a Phase 1 compatibility matrix containing agent version range, adapter version range, configuration schema version, required TouchDesigner version metadata, package hash/signature metadata, supported versions, required disk space and rollback version.

Benefits: directly satisfies P1-BE-0506 while keeping licence handling outside runtime logic. Risks: matrix fields must remain stable for future endpoint packaging tasks.

### Option B

Implement release manifests without blocking compatibility until endpoint package validation is built later.

Benefits: less initial implementation. Risks: violates the P1-BE-0506 acceptance criterion that incompatible deployments are blocked by compatibility metadata.

## Recommendation

Choose Option A and confirm ADR-010 before implementing P1-BE-0506.

## Work blocked

- P1-BE-0506 release manifest API implementation.
- Marking P1-EPIC-07 complete and reaching its Review Gate.

## Work that can continue

- P1-BE-0501 configuration draft validation.
- P1-BE-0502 configuration publication.
- P1-BE-0503 desired configuration endpoint.
- P1-BE-0505 media asset metadata.
