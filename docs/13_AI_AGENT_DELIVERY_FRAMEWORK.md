# AI Agent Delivery Framework

## Purpose

This document defines how ChatGPT Codex, Claude Code, GitHub Copilot and human developers may deliver changes without drifting from the approved platform design.

## Delivery stages

### 1. Task intake

Required:

- Task ID
- Goal
- In scope
- Out of scope
- Referenced ADRs
- Acceptance criteria
- Expected tests
- Expected migration and documentation impact

Output:

- Concise implementation plan
- Affected-file list
- Any immediate Decision Requests

### 2. Design check

The agent may choose ordinary implementation details consistent with existing standards.

The agent must not create new:

- Service boundaries
- Public APIs
- Database entities
- Authentication methods
- Permission models
- Inbound network access
- Tenancy behaviour
- Fallback behaviour
- Breaking contracts

without an approved decision.

### 3. Implementation

Implement the smallest correct change and include applicable:

- Code
- Tests
- Database migrations
- Contract schemas
- Documentation
- Release notes

### 4. Validation

Run the relevant:

- Build
- Unit tests
- Integration tests
- Type checks
- Linting
- Migration validation
- Clean database creation
- Contract validation
- Infrastructure validation

Never disable a check merely to complete the task.

### 5. Review handoff

Provide:

- Behavioural summary
- Referenced ADRs
- Test evidence
- Migration notes
- Security considerations
- Known limitations
- Recovery or rollback notes

### 6. Documentation maintenance

Update the relevant ADRs, changelog, schemas and runbooks in the same pull request.
