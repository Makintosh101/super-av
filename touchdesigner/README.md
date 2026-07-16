# TouchDesigner

## Ownership

TouchDesigner project, modules and test project files belong here when a scoped task approves them.

## Phase 1 status

This directory is intentionally a placeholder for Epic 1. It does not define a TouchDesigner project, operator path, bridge protocol, adapter behaviour or runtime behaviour.

## Build commands

No TouchDesigner build or packaging command exists yet. Future tasks must add commands with the project/package implementation they authorize.

## Test commands

No TouchDesigner-specific test command exists yet. Repository documentation checks run from the root with:

```sh
npm run check:docs
```

## Related specifications

- [Phase 1 Build Plan](../docs/10_PHASE_1_BUILD_PLAN.md)
- [Endpoint Agent Specification](../docs/specifications/04_ENDPOINT_AGENT_SPECIFICATION.md)
- [API and Message Contracts](../docs/specifications/06_API_AND_MESSAGE_CONTRACTS.md)

## P1-EPIC-12 project package manifest

`touchdesigner/packages/phase1-project-manifest.mjs` defines the TouchDesigner project package manifest. The manifest records project version, package hash, signature metadata, required TouchDesigner version and asset references. TouchDesigner licensing remains a deployment prerequisite and is not embedded in runtime logic.
