# ADR-002 — How is communication between cloud services and nodes encrypted?

## Status

Confirmed

## Area

Security

## Decision

Use HTTPS and secure WebSockets over TLS 1.2 minimum, TLS 1.3 preferred. Authenticate each node with a unique certificate or certificate-backed short-lived token.

## Rationale

Commands, configuration, telemetry and software packages must remain confidential and tamper-resistant.

## Consequences and trade-offs

Requires certificate issuance, renewal, revocation, signed packages and secure key storage.

## Related requirements

REQ-SEC-001; REQ-SEC-002

## Related documents

07_SECURITY_AND_TRUST_MODEL.md

## Review trigger

Security issue

## Version

1

## Notes

Fresh TLS session keys are negotiated after each reconnect.
