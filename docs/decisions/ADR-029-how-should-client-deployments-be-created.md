# ADR-029 — How should client deployments be created?

## Status

Confirmed

## Area

Deployment

## Decision

Create each client environment from the same repository using infrastructure-as-code, deployment manifests, environment variables and tenant branding/configuration. Never copy and manually edit the project.

## Rationale

Maintains one product while providing strong client isolation.

## Consequences and trade-offs

Requires automated environment creation, version tracking and shared release management.

## Related requirements

REQ-DEP-002

## Related documents

12_CODE_AS_SOURCE_OF_TRUTH.md

## Review trigger

New client onboarding

## Version

1

## Notes

Each deployment has separate database, storage, credentials and service boundary.
