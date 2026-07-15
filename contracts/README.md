# Contracts

## Ownership

Machine-readable API, message, capability, configuration and error contracts belong here.

## Phase 1 status

Epic 2 defines the initial Phase 1 contracts only. These files describe approved interfaces and validation fixtures; they do not implement runtime services, database entities, infrastructure or adapter behaviour.

## Contents

- `schemas/ws/` — JSON Schemas for device gateway WebSocket messages.
- `schemas/capability/` — Capability manifest schema for the Phase 1 TouchDesigner and System Health adapters.
- `schemas/configuration/` — Room configuration and preset schemas using desired state and logical actions.
- `schemas/errors/` — Canonical error catalogue schema.
- `fixtures/` — Valid and invalid examples used by contract validation.
- `openapi/` — OpenAPI stubs for node provisioning/device/configuration APIs and the operator command API.

## Build commands

Contracts are static source files and do not require a build step.

## Test commands

Run contract validation from the repository root with:

```sh
npm run check:contracts
```

Run all repository checks with:

```sh
npm run check
```

## Related specifications

- [API and Message Contracts](../docs/specifications/06_API_AND_MESSAGE_CONTRACTS.md)
- [Data Model](../docs/specifications/09_DATA_MODEL.md)
- [Code as Source of Truth](../docs/standards/12_CODE_AS_SOURCE_OF_TRUTH.md)
