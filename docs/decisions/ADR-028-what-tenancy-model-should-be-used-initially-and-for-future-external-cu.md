# ADR-028 — What tenancy model should be used initially and for future external customers?

## Status

Confirmed

## Area

Tenancy

## Decision

Phase 1 is a single Blue Elephant deployment. Future customers receive separate isolated deployments created from the same codebase and infrastructure modules. Do not build shared multi-tenant data isolation into Phase 1.

## Rationale

Separate deployments reduce tenant-isolation risk and keep the first build manageable.

## Consequences and trade-offs

Higher infrastructure cost and duplicated operations; central fleet management may be added later.

## Related requirements

REQ-TEN-001

## Related documents

Deployment Model; 12_CODE_AS_SOURCE_OF_TRUTH.md

## Review trigger

Commercial onboarding

## Version

1

## Notes

Codebase must remain configuration-driven and cloneable without client-specific forks.
