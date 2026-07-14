# ADR-003 — What is the source of truth for database, infrastructure and configuration?

## Status

Confirmed

## Area

Engineering

## Decision

Git-managed code is the source of truth. All schemas use ordered migrations; infrastructure, permissions, contracts and deployment pipelines are defined as code.

## Rationale

The platform must be reproducible for future products and environments.

## Consequences and trade-offs

Manual production changes are prohibited; every change requires migrations, tests and deployment code.

## Related requirements

REQ-ENG-001

## Related documents

12_CODE_AS_SOURCE_OF_TRUTH.md

## Review trigger

Deployment learning

## Version

1

## Notes

A clean-environment rebuild test is required.
