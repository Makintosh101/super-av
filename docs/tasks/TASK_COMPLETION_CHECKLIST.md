# Task Completion Checklist

Use this checklist for every Phase 1 task before review handoff.

## Required task evidence

- Task ID and title are recorded.
- Referenced ADRs are listed and reviewed.
- Changed behaviour is summarized, or the task explicitly states that no runtime behaviour changed.
- Files changed are listed.
- Tests and checks are listed with pass/fail results.
- Migrations are listed, or the task explicitly confirms that no migrations were needed.
- Contracts are listed, or the task explicitly confirms that no contracts were affected.
- Documentation updates are listed.
- Known limitations are documented.
- Recovery or rollback notes are documented where applicable.
- Security, ownership, tenancy and destructive-change impacts are documented where applicable.

## Required guardrails

- Do not perform manual database changes. Schema and seed changes require ordered migrations committed to source control.
- Do not perform manual infrastructure changes. Infrastructure, IAM, networking, monitoring and deployment configuration must be defined as code.
- Do not hide failures, swallow exceptions or convert failed actions into apparent success.
- Do not add speculative fallback chains. Recovery modes must have a documented trigger, security model and test plan.
- Do not expose engine-specific implementation paths to cloud APIs.
- Do not introduce a new service, database entity, public API, permission boundary, authentication method, inbound port, tenancy model or adapter contract without an approved decision.

## Material ambiguity

If a requirement is materially ambiguous, continue only clearly unblocked work and create a Decision Request using [DECISION_REQUEST_TEMPLATE.md](DECISION_REQUEST_TEMPLATE.md). The Decision Request must state the recommendation, consequences and blocked scope.
