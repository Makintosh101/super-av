# ADR-005 — What level of offline control is permitted?

## Status

Proposed

## Area

Offline Operation

## Decision

User and Technician controls should work offline. Admin changes that affect ownership, certificates, tenant membership or cloud security remain cloud-only unless an emergency recovery process is used.

## Rationale

Offline access must be useful without allowing unsafe ownership or identity changes.

## Consequences and trade-offs

Requires a cached permission model and a clearly defined emergency-admin process.

## Related requirements

REQ-OFF-003

## Related documents

Offline Control Design

## Review trigger

Scheduled review

## Version

1

## Notes

Needs final agreement.
