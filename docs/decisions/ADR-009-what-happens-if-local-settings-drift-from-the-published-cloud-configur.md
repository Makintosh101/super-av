# ADR-009 — What happens if local settings drift from the published cloud configuration?

## Status

In Review

## Area

Configuration

## Decision

Proposed: published configuration remains authoritative; permitted live adjustments are state, not configuration. Unapproved local drift is reported and can be restored.

## Rationale

Local manual edits can make support and replacement unreliable.

## Consequences and trade-offs

Technicians need an explicit save-and-publish workflow for legitimate changes.

## Related requirements

REQ-CFG-001

## Related documents



## Review trigger

Deployment learning

## Version

1

## Notes
