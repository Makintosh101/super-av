# Development Playbook

Version: 1.0  
Status: Approved for Phase 1

## 1. Purpose

This playbook defines how the Endpoint Platform is designed, implemented, reviewed, tested and released.

It exists to ensure that every contributor, human or AI, builds the platform consistently.

The playbook defines how work is performed. It does not define what the product should do.

Platform behaviour is defined by:

- Platform Principles
- Architecture Decision Records (ADRs)
- Specifications
- API, message and configuration contracts
- Approved roadmaps, epics and tasks

This document defines the engineering process used to turn those sources of truth into implementation.

## 2. Documentation hierarchy

The repository documentation hierarchy is:

```text
Platform Principles
        │
        ▼
Architecture Decision Records (ADRs)
        │
        ▼
Engineering Standards
        │
        ▼
Development Playbook
        │
        ▼
Roadmaps
        │
        ▼
Epics
        │
        ▼
Tasks
        │
        ▼
Implementation
```

Each layer has a distinct purpose:

- Platform Principles define the enduring laws of the platform.
- ADRs record confirmed architectural and product decisions.
- Engineering Standards define mandatory technical standards.
- This Development Playbook defines the daily workflow for building the platform.
- Roadmaps define planned delivery increments.
- Epics group related outcomes.
- Tasks define approved implementation scope.
- Implementation is the source-controlled code, infrastructure, contracts, migrations, tests and documentation that satisfy the approved task.

The Development Playbook must not be used to invent product behaviour. It only defines how approved work moves through the engineering process.

## 3. Relationship to other operating documents

This playbook complements, and does not replace, the existing repository controls:

- `docs/00_PLATFORM_PRINCIPLES.md` explains what the platform stands for.
- `AGENTS.md` contains mandatory repository rules for coding agents and developers.
- `docs/13_AI_AGENT_DELIVERY_FRAMEWORK.md` explains how individual AI-assisted tasks are executed and handed over.
- This document explains how development flows through the project from intake to merge and release.

When these documents overlap, follow the source-of-truth hierarchy in this playbook and the stricter rule.

## 4. Guiding principles

Every contributor must follow these principles.

### Correctness over convenience

The correct solution is always preferred over the easiest solution.

Do not make a failed implementation appear successful. Diagnose and fix the approved implementation.

### Simplicity first

Build the smallest implementation that satisfies the approved requirements.

Do not implement future features "while you are there."

### Code is the source of truth

Everything required to recreate the platform must exist inside the repository, including:

- Source code
- Infrastructure
- Database schema
- Migrations
- Configuration
- Documentation
- Contracts
- Tests

Nothing required to operate or rebuild the platform should exist only in production or in a human operator's memory.

### Documentation is part of the product

A task is not complete while documentation is outdated.

Documentation changes belong in the same pull request as the implementation changes that require them.

### No speculative fallback chains

Never hide failures behind undocumented alternative behaviour.

A fallback is permitted only when it is:

- Intentionally designed
- Documented
- Tested
- Approved

Offline operation is an operating mode. It is not a fallback.

### Failures must be visible and actionable

Failures must produce diagnostic evidence that helps operators and developers understand what happened and what to do next.

## 5. Source-of-truth hierarchy

When documents, contracts or code disagree, use this order:

1. Platform Principles
2. Confirmed ADRs
3. Security Standards
4. Engineering Standards
5. API, message and configuration contracts
6. Approved roadmap
7. Approved epic
8. Approved task
9. Existing implementation

Production systems are never the source of truth.

If a lower layer conflicts with a higher layer, do not silently choose one. Continue unblocked work and create a Decision Request for the conflict.

## 6. Development lifecycle

Every task follows the same lifecycle:

```text
Receive Task
      │
      ▼
Read Playbook
      │
      ▼
Read Platform Principles, ADRs and Standards
      │
      ▼
Check Dependencies
      │
      ▼
Implementation Plan
      │
      ▼
Architecture Check
      │
      ▼
Code
      │
      ▼
Tests
      │
      ▼
Documentation
      │
      ▼
Validation
      │
      ▼
Pull Request
      │
      ▼
Review
      │
      ▼
Merge
```

No step may be skipped.

## 7. Before starting work

Before making changes, every contributor must:

1. Read `AGENTS.md`.
2. Read `docs/00_PLATFORM_PRINCIPLES.md`.
3. Read this Development Playbook.
4. Read referenced ADRs.
5. Read relevant architecture and security documents.
6. Read relevant API, message and configuration contracts.
7. Read the roadmap, epic and task that authorize the work.
8. Review relevant standards.
9. Check task dependencies.
10. Confirm task scope.

If dependencies are incomplete, stop the blocked work. Do not invent missing prerequisites. Continue only work that is clearly unblocked.

## 8. Dependency checks

Before implementation, check whether the task depends on:

- Prior tasks or epics
- Confirmed ADRs
- Existing contracts
- Database migrations
- Infrastructure modules
- Security model decisions
- Adapter contracts
- Configuration schemas
- Test fixtures or simulators
- Documentation updates

If a dependency is missing or contradictory:

1. Record the dependency gap.
2. Continue any unblocked work.
3. Create a Decision Request when the gap requires a material decision.
4. Do not implement speculative behaviour to bypass the dependency.

## 9. Task planning

Before writing code, produce an implementation plan that includes:

- Goal
- In-scope work
- Out-of-scope work
- Referenced ADRs
- Expected files to change
- Tests required
- Documentation updates
- Contract updates
- Migration requirements
- Infrastructure requirements
- Security considerations
- Known risks or ambiguities

No code should be written until the implementation plan is complete.

## 10. Scope rules

Every task has approved scope.

In scope means the work explicitly required to satisfy the approved task.

Out of scope means everything else.

Out-of-scope work must not be implemented, even if it appears useful.

Refactoring is allowed only when it is within the approved boundary, improves the current task, and does not introduce new architecture, contracts, permissions or behaviour.

## 11. Architecture check

Before and during implementation, verify that the change:

- Follows Platform Principles
- Follows confirmed ADRs
- Does not introduce unapproved services
- Does not introduce unapproved database entities
- Does not introduce unapproved public APIs
- Does not introduce unapproved permission boundaries
- Does not introduce unapproved authentication or authorization methods
- Does not introduce unapproved inbound ports
- Does not change tenancy behaviour without approval
- Does not expose engine-specific implementation paths to cloud APIs
- Does not create speculative fallback behaviour

If any item is uncertain, create a Decision Request.

## 12. Material decisions

AI agents and contributors must never silently decide:

- Architecture
- Security model
- Authentication
- Authorization
- Database design
- Public APIs
- Network topology
- Tenancy
- Data ownership
- Infrastructure
- Adapter contracts
- Breaking changes
- Destructive migrations
- Permission boundaries

Instead, create a Decision Request.

## 13. Decision Request workflow

Use `docs/tasks/DECISION_REQUEST_TEMPLATE.md` for material ambiguity.

A Decision Request must include:

- Task
- Decision required
- Existing constraints
- Available options
- Recommendation
- Consequences
- Blocked work
- Unblocked work

After creating a Decision Request:

1. Continue unblocked work.
2. Do not implement the blocked decision.
3. Reference the Decision Request in the task handoff or pull request.
4. Wait for approval before implementing the blocked scope.

## 14. Coding workflow

Code should be:

- Small
- Explicit
- Readable
- Testable
- Modular
- Typed where appropriate
- Consistent with existing conventions

Avoid:

- Clever code
- Hidden behaviour
- Large functions
- Duplicate logic
- Magic values
- Speculative extension points
- Unapproved abstractions

Implement the smallest correct change that satisfies the task and preserves the approved architecture.

## 15. Error handling workflow

Errors must:

- Fail clearly
- Use structured error codes where applicable
- Include correlation IDs where applicable
- Preserve context
- Be observable
- Be logged once at the correct boundary

Never:

- Ignore errors
- Hide failures
- Retry forever
- Swallow exceptions
- Convert failed actions into apparent success
- Substitute undocumented defaults

Error handling must follow the repository error standards.

## 16. Logging workflow

Logs must be:

- Structured
- Consistent
- Machine readable
- Actionable
- Appropriate to the component boundary

Sensitive information must never be logged.

Log messages should help diagnose failures without exposing secrets, credentials, private customer data or unnecessary implementation details.

## 17. Configuration workflow

Configuration must be:

- Version controlled
- Validated
- Documented
- Schema driven where appropriate
- Reproducible across environments

Never rely on undocumented configuration.

Every configuration change must include:

- Updated schema or validation where applicable
- Updated documentation
- Test coverage where applicable
- Migration or rollout notes where applicable

## 18. Feature flag workflow

Use a feature flag only when it is an intentional operating control, not a substitute for unfinished design.

A feature flag requires:

- A documented purpose
- A default state
- Ownership
- Rollout or rollback guidance
- Test coverage for enabled and disabled states when both states are supported
- Removal criteria when the flag is temporary

Do not use feature flags to hide broken, incomplete or unapproved functionality.

## 19. Database workflow

Every database schema change requires:

- Ordered migration committed to source control
- Rollback or recovery path
- Validation plan
- Updated data model documentation
- Tests for migration behaviour where applicable

Never manually edit production databases.

Never make destructive migration decisions silently.

## 20. Infrastructure workflow

Infrastructure must be defined as code.

Never manually create or modify:

- Databases
- Buckets
- Secrets
- Networking
- IAM
- Load balancers
- Certificates
- Monitoring resources
- Deployment configuration

Every infrastructure change must include:

- Source-controlled infrastructure definition
- Validation command or plan
- Documentation updates
- Rollback or recovery notes
- Security review where applicable

## 21. API and contract workflow

Every API, message or configuration contract change requires:

- Updated contract
- Updated documentation
- Validation tests
- Version review
- Regenerated artifacts where applicable
- Compatibility assessment

Breaking changes require approval before implementation.

Cloud APIs must expose logical capabilities and product-level commands, not engine-specific implementation paths.

## 22. Adapter workflow

Adapters translate platform capabilities into implementation-specific behaviour.

The cloud must never depend directly on runtime-specific paths for:

- TouchDesigner
- OBS
- VLC
- PIXERA
- Q-SYS
- Any other runtime or device implementation

Adapter changes must preserve the approved adapter contract and include tests that prove the platform still communicates through logical capabilities.

## 23. Security workflow

Security must be reviewed for every task.

At minimum, check whether the task affects:

- Identity
- Pairing
- Authentication
- Authorization
- Secrets
- Certificates
- Encryption
- Audit history
- Network exposure
- Inbound ports
- Tenancy
- Data ownership
- Remote support
- Offline control

If the task affects any security boundary, verify that the change is already authorized by an ADR or create a Decision Request.

## 24. Testing workflow

Every task requires appropriate testing.

Possible test types include:

- Unit tests
- Integration tests
- Contract tests
- Protocol tests
- Resilience tests
- Acceptance tests
- Regression tests
- Migration tests
- Infrastructure validation

Tests should be written with, or before, the implementation they validate.

Do not disable, weaken or skip checks merely to complete a task.

If a check cannot run because of an environment limitation, document the limitation and run the closest available validation.

## 25. Documentation workflow

Documentation must be updated whenever:

- Behaviour changes
- Architecture changes
- Contracts change
- Configuration changes
- Security changes
- Database schema changes
- Infrastructure changes
- Operational procedures change
- Known limitations change

Documentation changes belong in the same pull request as the implementation.

Do not silently rewrite ADR history. Supersede confirmed ADRs explicitly through the approved decision process.

## 26. Validation workflow

Before opening a pull request, run the relevant validation commands for the changed areas, including as applicable:

- Build
- Unit tests
- Integration tests
- Type checks
- Linting
- Contract validation
- Migration validation
- Clean database creation
- Infrastructure validation
- Documentation checks

A task is not ready for review if required checks have not been run or if failures are unexplained.

## 27. Pull request workflow

Every pull request must include:

- Summary of changed behaviour
- Task reference
- ADR references
- Tests run and results
- Documentation updates
- Migration notes, or confirmation none were required
- Contract updates, or confirmation none were affected
- Infrastructure notes, or confirmation none were affected
- Security considerations
- Known limitations
- Recovery or rollback notes where applicable

The pull request must make it possible for a reviewer to verify scope, architecture, tests and operational impact without reconstructing the work from memory.

## 28. Review workflow

Reviewers must verify:

- Task scope was followed
- Platform Principles were followed
- Confirmed ADRs were respected
- Engineering standards were followed
- No speculative fallback behaviour was added
- Security boundaries were maintained
- Contracts were updated when affected
- Migrations were added when required
- Infrastructure changes were codified when required
- Tests are appropriate and pass
- Documentation is current
- Known limitations are documented
- Recovery or rollback notes are sufficient
- No hidden technical debt was introduced

Review is an architecture and product-safety gate, not only a code-quality check.

## 29. Merge workflow

A change may merge only when:

- Required review is complete
- Required checks pass or documented environment limitations are accepted
- Required documentation is updated
- Required contracts are updated
- Required migrations are included
- Required infrastructure changes are codified
- Decision Requests are resolved or blocked scope is excluded
- Pull request evidence is complete

No epic may advance through its review gate while code, contracts, migrations, tests and documentation disagree.

## 30. Release workflow

Every release must produce:

- Release notes
- Migration notes
- Configuration changes
- Known issues
- Rollback or recovery procedure
- Version tag
- Deployment manifest or deployment reference

Release evidence must describe what changed, how it was validated, how it is deployed and how it can be recovered.

## 31. Epic workflow

Each epic follows:

```text
Plan
  │
  ▼
Implement
  │
  ▼
Validate
  │
  ▼
Review Gate
  │
  ▼
Merge
  │
  ▼
Tag
  │
  ▼
Next Epic
```

No epic begins implementation until its prerequisites are satisfied.

No epic is complete until its review gate has passed.

## 32. Review gates

Each review gate confirms:

- Architecture is still valid
- Documentation is current
- Technical debt is acceptable and documented
- Security is maintained
- Performance is acceptable for the phase
- Platform Principles are still followed
- No unnecessary complexity was introduced
- Required contracts, migrations and tests are aligned

## 33. Repository structure

The repository is organized around these concerns:

- Documentation
- Decisions
- Standards
- Specifications
- Contracts
- Infrastructure
- Database
- Endpoint
- Cloud
- Web
- Tests

Every change should fit naturally within this structure.

If a change does not fit the current structure, do not silently create a new boundary. Create a Decision Request when a new service, module boundary or ownership model is required.

## 34. Definition of Done

A task is complete only when all applicable items are true:

- Code builds successfully.
- Tests pass.
- Documentation is updated.
- API, message or configuration contracts are updated if affected.
- Database migrations are included if required.
- Infrastructure changes are codified if required.
- No undocumented configuration changes exist.
- No speculative fallback behaviour has been added.
- Logging follows standards.
- Error handling follows standards.
- Security considerations have been reviewed.
- The pull request references the task and ADRs.
- Known limitations are documented.
- Recovery or rollback notes are included where applicable.
- Migrations added, or confirmation none were needed.
- Contracts updated, or confirmation none were affected.
- Documentation updated, or confirmation none was required.
- Referenced ADRs are listed.

If any applicable item is incomplete, the task is not Done.

## 35. Escalation rules

Stop the blocked work and create a Decision Request if:

- Architecture is unclear
- Security is unclear
- Authentication changes
- Authorization changes
- Public APIs change
- Database design changes
- Breaking changes are required
- Tenancy changes
- Infrastructure changes
- Permission boundaries change
- Adapter contracts change
- Destructive migrations are possible
- Task scope conflicts with Platform Principles or ADRs

Continue all unblocked work.

## 36. AI behaviour rules

AI agents may:

- Implement approved tasks
- Refactor within approved scope
- Improve readability
- Improve tests
- Improve documentation
- Generate migrations
- Generate contracts
- Produce Decision Requests

AI agents must not:

- Invent features
- Expand scope
- Ignore ADRs
- Hide failures
- Create speculative fallback behaviour
- Silently change architecture
- Silently change security
- Silently change APIs
- Silently change schemas
- Silently change infrastructure
- Silently change permissions
- Silently change tenancy
- Treat production as source of truth

AI agents must leave clear completion evidence for every task.

## 37. Engineering philosophy

The platform is built on a small number of enduring principles:

- Build the smallest correct solution.
- Keep components independent.
- Separate control from execution.
- Prefer explicit behaviour over hidden automation.
- Make failures visible.
- Design for long-term maintainability.
- Optimize for understanding before optimization.
- Deliver working increments through roadmaps, epics and tasks.
- Keep documentation and implementation permanently aligned.
- Leave the platform in a better state than it was found.

This playbook is the standard operating procedure for every contributor to the Endpoint Platform.
