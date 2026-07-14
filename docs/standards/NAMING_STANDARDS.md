# Naming Standards

These standards keep repository, product, contract and operational names consistent.

Use `docs/standards/PRODUCT_TERMINOLOGY.md` as the source of truth for the words that may appear in names.

## Documents

Use uppercase filenames for repository-level and standards documents:

- `README.md`
- `CHANGELOG.md`
- `AGENTS.md`
- `PRODUCT_TERMINOLOGY.md`
- `NAMING_STANDARDS.md`
- `ERROR_STANDARD.md`
- `VERSIONING_POLICY.md`

## Roadmaps

Roadmap identifiers use `RM-P<phase>-<number>`:

- `RM-P1-01`
- `RM-P1-02`
- `RM-P2-01`

## Epics

Epic identifiers use `P<phase>-EPIC-<number>`:

- `P1-EPIC-01`
- `P1-EPIC-02`
- `P2-EPIC-01`

## Tasks

Task identifiers use `P<phase>-<area>-<four-digit-number>`:

- `P1-BE-0001`
- `P1-BE-0002`
- `P1-BE-0003`

Never reuse task numbers.

## ADRs

ADR identifiers use `ADR-<three-digit-number>`:

- `ADR-001`
- `ADR-002`
- `ADR-127`

Never renumber ADRs.

## Decision Requests

Decision Request identifiers use `DR-<three-digit-number>`:

- `DR-001`
- `DR-002`

## Branches

Use these branch prefixes:

- `feature/`
- `bugfix/`
- `epic/`
- `release/`
- `hotfix/`

Examples:

- `feature/node-health`
- `epic/p1-epic-01`
- `hotfix/node-crash`

## APIs

Use versioned API paths with lowercase path segments:

- `/api/v1/node`
- `/api/v1/pairing`
- `/api/v1/configuration`

Rules:

- Use lowercase.
- Use hyphens only when required for readability.
- Use plural nouns for collections.
- Use singular nouns for single-resource actions.
- Use product-level capabilities and commands, not runtime-specific implementation paths.

## JSON

Use `camelCase` for JSON field names.

Example:

```json
{
  "deviceId": "...",
  "desiredState": "...",
  "reportedState": "..."
}
```

## Database

Use `snake_case` for database identifiers.

Examples:

- `node_configuration`
- `node_health`
- `desired_state`

## Classes

Use `PascalCase` for classes.

## Interfaces

Do not prefix interfaces with `I`.

Examples:

- `NodeRepository`
- `DeviceGateway`
- `CapabilityProvider`

## Constants

Use `UPPER_SNAKE_CASE` for constants.

## Environment variables

Use `UPPER_SNAKE_CASE` for environment variables.

Examples:

- `NODE_AGENT_PORT`
- `DATABASE_CONNECTION`
- `JWT_PRIVATE_KEY`

## Feature flags

Use lowercase dot-separated feature flag names.

Examples:

- `feature.touchdesigner`
- `feature.local-control`

## Configuration files

Use lowercase filenames with `.yaml` for YAML configuration files.

Examples:

- `node.yaml`
- `deployment.yaml`
- `logging.yaml`
