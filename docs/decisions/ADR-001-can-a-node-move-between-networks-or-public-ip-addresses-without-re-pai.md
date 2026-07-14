# ADR-001 — Can a node move between networks or public IP addresses without re-pairing?

## Status

Confirmed

## Area

Connectivity

## Decision

Yes. Node identity is based on its device ID and certificate, not its IP address. The agent reconnects using a new TLS session and reconciles state revisions.

## Rationale

Nodes will be moved between venues, VLANs and internet connections.

## Consequences and trade-offs

Requires robust reconnect, heartbeat, replay protection and state reconciliation.

## Related requirements

REQ-CONN-001; REQ-SEC-001

## Related documents

02_SYSTEM_ARCHITECTURE.md; 07_SECURITY_AND_TRUST_MODEL.md

## Review trigger

Technology change

## Version

1

## Notes

IP changes are diagnostic metadata only.
