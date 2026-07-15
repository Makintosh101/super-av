# Tests

## Ownership

Integration, resilience, protocol and repository validation tests belong here or beside the package they validate when a scoped task approves them.

## Phase 1 status

Epic 1 adds documentation validation. Epic 2 adds contract validation. Epic 3 adds database migration validation. These checks do not implement product runtime behaviour.

## Build commands

No test build command exists yet.

## Test commands

Run documentation validation from the repository root with:

```sh
npm run check:docs
```

Run contract validation with:

```sh
npm run check:contracts
```

Run database migration validation with:

```sh
npm run check:db
```

Run the root aggregate check with:

```sh
npm run check
```

## Related specifications

- [Acceptance Tests](../docs/11_ACCEPTANCE_TESTS.md)
- [Development Playbook](../docs/15_DEVELOPMENT_PLAYBOOK.md)
- [AI Agent Delivery Framework](../docs/13_AI_AGENT_DELIVERY_FRAMEWORK.md)
