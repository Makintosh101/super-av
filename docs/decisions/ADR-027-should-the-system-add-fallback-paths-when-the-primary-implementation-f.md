# ADR-027 — Should the system add fallback paths when the primary implementation fails?

## Status

Confirmed

## Area

Engineering Principle

## Decision

No. Do not add speculative fallback chains. Identify and fix the correct implementation. A fallback is allowed only when it is an explicitly designed operating mode with a defined trigger, owner, test plan and failure behaviour.

## Rationale

Fallbacks that conceal defects create unpredictable behaviour and make support difficult.

## Consequences and trade-offs

Requires errors to fail clearly and be diagnosed rather than silently routed through alternative logic.

## Related requirements

REQ-ENG-002

## Related documents

Platform Principles; AI_AGENT_RULES.md

## Review trigger

Development review

## Version

1

## Notes

Offline local control is an intentional operating mode, not a hidden fallback.
