# AI and Developer Instructions

These rules apply to every developer and coding agent working in this repository.

## Required reading

Before making changes, read:

1. `docs/00_PLATFORM_PRINCIPLES.md`
2. Any ADRs referenced by the task
3. Relevant architecture and security documents
4. Relevant API, message and configuration contracts
5. The complete task specification

## Non-negotiable rules

1. **Do not create speculative fallback chains.**
   Fix the approved implementation. An alternative path is allowed only when it is a deliberately designed operating mode with a documented trigger, security model and test plan.

2. **Do not hide failures.**
   Do not swallow exceptions, convert failed actions into apparent success, or silently substitute defaults.

3. **Do not make manual database changes.**
   All database changes require ordered migrations committed to source control.

4. **Do not make manual infrastructure changes.**
   Infrastructure, IAM, networking, monitoring and deployment configuration must be defined as code.

5. **Do not expose engine-specific implementation paths to cloud APIs.**
   Cloud interfaces use logical capabilities and product-level commands.

6. **Do not change confirmed ADRs without approval.**

7. **Do not introduce a new service, database entity, public API, permission boundary, authentication method, inbound port, tenancy model or adapter contract without an approved decision.**

8. **Do not make security, ownership, tenancy or destructive migration decisions silently.**

9. **Code, tests, migrations, contracts and documentation must change together.**
   A task is incomplete while they disagree.

10. **Use the smallest correct implementation.**
    Phase 1 exists to prove identity, pairing, secure communication, commands, state, configuration and offline control.

## Material ambiguity

When a requirement is materially ambiguous:

- Continue any unblocked work.
- Do not invent a product or architecture decision.
- Create a Decision Request using `docs/tasks/DECISION_REQUEST_TEMPLATE.md`.
- State your recommendation, consequences and blocked scope.

## Allowed normal implementation decisions

Agents may decide ordinary details consistent with existing standards, including:

- Internal function and class names
- Private module structure
- Test fixture layout
- Refactoring within an approved boundary
- Logging placement
- Normal error handling that follows the error standard

## Required completion evidence

Every completed task must include:

- Summary of changed behaviour
- Files changed
- Tests run and results
- Migrations added or confirmation none were needed
- Contracts updated or confirmation none were affected
- Documentation updated
- Known limitations
- Recovery or rollback notes where applicable
- Referenced ADRs
