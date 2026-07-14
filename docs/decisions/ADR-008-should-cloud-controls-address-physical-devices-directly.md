# ADR-008 — Should cloud controls address physical devices directly?

## Status

Confirmed

## Area

Hardware Abstraction

## Decision

No. The cloud uses logical capabilities such as presentation input, master volume and lectern camera. Installation configuration maps these to physical hardware.

## Rationale

Rooms will use different capture cards, DSPs, cameras and display systems.

## Consequences and trade-offs

Requires adapter contracts and installation mappings.

## Related requirements

REQ-ABS-001

## Related documents

06_API_AND_MESSAGE_CONTRACTS.md

## Review trigger

Technology change

## Version

1

## Notes
