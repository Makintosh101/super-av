# ADR-030 — How should AI coding agents be given authority to implement the platform?

## Status

Confirmed

## Area

AI Delivery

## Decision

AI agents work from a controlled documentation hierarchy and task specification. They may implement approved scope, but must not invent architecture, permissions, schema changes or fallbacks. Material ambiguity is recorded as a decision request for the Product Owner or Lead Developer.

## Rationale

Prevents agents drifting from platform fundamentals.

## Consequences and trade-offs

Requires repository-level agent instructions, acceptance tests, documentation checks and review gates.

## Related requirements

REQ-AI-001

## Related documents

AI_AGENT_DELIVERY_FRAMEWORK.md; AGENTS.md

## Review trigger

AI agent onboarding

## Version

1

## Notes

Agents update documentation and migrations in the same change as code.
