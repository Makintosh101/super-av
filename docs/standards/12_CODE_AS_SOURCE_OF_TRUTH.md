# Code as the Source of Truth

## Principle

The platform must be fully reproducible from source control. No environment may depend on undocumented manual database edits, hand-created tables or settings stored only in an engineer's memory.

```text
Source Code
    ↓
Automated Build and Validation
    ↓
Automated Migration and Deployment
    ↓
Reproducible Environment
```

## Everything owned by code

The repository must define:

- Application source
- Database schemas and migrations
- Indexes, constraints and reference data
- REST and WebSocket contracts
- Capability and configuration schemas
- Cloud infrastructure and networking
- IAM and service permissions
- Environment definitions
- Deployment pipelines
- Monitoring and alert policies
- Endpoint installers and Windows services
- Adapter and TouchDesigner package manifests
- Release and rollback procedures

## Database migrations

Every schema change must be an ordered migration committed to Git, using a migration framework such as Entity Framework Core, Flyway, Liquibase, Prisma or an equivalent.

Example:

```text
0001_create_companies.sql
0002_create_devices.sql
0003_create_pairing_sessions.sql
0004_add_device_certificates.sql
0005_add_reported_state_revision.sql
```

Rules:

1. Every schema change is committed.
2. Applied migrations are recorded in a migration-history table.
3. Migrations run automatically in development, test, staging and production.
4. Reference data is created through idempotent seed code.
5. Manual table creation and production editing are prohibited.
6. The application checks schema compatibility at startup.
7. Destructive changes use an expand-and-contract release pattern.
8. Production backups and restore tests are part of the release process.

## Infrastructure as code

Use Terraform, OpenTofu, Pulumi or an equivalent tool to define cloud projects, networking, gateways, databases, Redis, storage, service accounts, IAM, secrets references, logging, monitoring and DNS.

The same modules should create development, test, staging and production environments using environment-specific variables.

## Contracts as code

Keep machine-readable contracts in source control:

```text
contracts/openapi/
contracts/asyncapi/
contracts/commands/
contracts/events/
contracts/capabilities/
contracts/configuration/
```

Use OpenAPI for REST and JSON Schema or AsyncAPI for messages. Generate clients and validators where practical.

## Clean-environment rebuild test

Regularly prove that the platform can be rebuilt:

1. Create empty infrastructure.
2. Create an empty database.
3. Apply all migrations.
4. Apply reference data.
5. Deploy backend and web services.
6. Register and pair a test node.
7. Send a command and confirm state.
8. Tear the environment down.

A change is incomplete until it includes any required code, migration, contract update, tests, deployment changes and documentation.

**Production is not the source of truth. Source control, approved secrets and environment variables are the source of truth.**
