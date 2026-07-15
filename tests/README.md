# Tests

## Ownership

Integration, resilience, protocol and repository validation tests belong here or beside the package they validate when a scoped task approves them.

## Phase 1 status

The repository currently includes documentation validation and Epic 2 contract validation. No runtime cloud, endpoint, database, adapter or infrastructure tests exist yet because those implementation tasks are not in scope for this epic.

## Build commands

No test build command exists yet.

## Test commands

Run documentation validation from the repository root with:

```sh
npm run check:docs
```

Run contract validation from the repository root with:

```sh
npm run check:contracts
```

Run all current checks with:

```sh
npm run check
```

## Related specifications

- [Acceptance Tests](../docs/11_ACCEPTANCE_TESTS.md)
- [Development Playbook](../docs/15_DEVELOPMENT_PLAYBOOK.md)
- [AI Agent Delivery Framework](../docs/13_AI_AGENT_DELIVERY_FRAMEWORK.md)
