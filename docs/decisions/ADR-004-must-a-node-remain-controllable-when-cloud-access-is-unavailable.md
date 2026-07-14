# ADR-004 — Must a node remain controllable when cloud access is unavailable?

## Status

Confirmed

## Area

Offline Operation

## Decision

Yes. The node must continue operating and provide a local-network web interface reachable by local IP or local hostname. Local control is a core requirement, not an optional fallback.

## Rationale

Live events cannot lose control because the internet or cloud platform is unavailable.

## Consequences and trade-offs

Requires local UI hosting, local authentication, cached configuration, local command routing and later reconciliation with cloud state.

## Related requirements

REQ-OFF-001; REQ-OFF-002

## Related documents

Offline Control Design

## Review trigger

Incident or failure

## Version

1

## Notes

Example access: https://192.168.100.101 or a local DNS name.
