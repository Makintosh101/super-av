# Tests

## Ownership

Integration, resilience, protocol and repository validation tests belong here or beside the package they validate when a scoped task approves them.

## Phase 1 status

Epic 1 adds documentation validation only. It does not add product runtime tests, contract tests, database tests or infrastructure tests.

## Build commands

No test build command exists yet.

## Test commands

Run the Epic 1 documentation validation from the repository root with:

```sh
npm run check:docs
```

The root aggregate check currently runs the same validation:

```sh
npm run check
```

## Related specifications

- [Acceptance Tests](../docs/11_ACCEPTANCE_TESTS.md)
- [Development Playbook](../docs/15_DEVELOPMENT_PLAYBOOK.md)
- [AI Agent Delivery Framework](../docs/13_AI_AGENT_DELIVERY_FRAMEWORK.md)
