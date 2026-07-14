# ADR-007 — How should multi-device presets handle partial failure?

## Status

In Review

## Area

Presets

## Decision

Proposed: validate first; execute as a transaction; classify steps as critical or non-critical; report partial success and roll back critical changes where safe.

## Rationale

Presets may coordinate video, audio, cameras, lighting and displays.

## Consequences and trade-offs

Rollback is not always physically possible, so failure semantics must be explicit.

## Related requirements

REQ-PRE-001

## Related documents



## Review trigger

New requirement

## Version

1

## Notes
