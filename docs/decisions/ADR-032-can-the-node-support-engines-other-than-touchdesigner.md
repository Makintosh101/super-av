# ADR-032 — Can the node support engines other than TouchDesigner?

## Status

Confirmed

## Area

Engine Architecture

## Decision

Yes. TouchDesigner is the first adapter only. The Node Agent exposes stable product capabilities and can later host adapters for VLC, vMix, PIXERA, OBS or other engines.

## Rationale

The cloud product should not be coupled to one media engine.

## Consequences and trade-offs

Each adapter must implement the same identity, configuration, command, state and health contracts.

## Related requirements

REQ-ADP-002

## Related documents

04_ENDPOINT_AGENT_SPECIFICATION.md; 06_API_AND_MESSAGE_CONTRACTS.md

## Review trigger

New engine requirement

## Version

1

## Notes

Phase 1 still implements only TouchDesigner and System Health adapters.
