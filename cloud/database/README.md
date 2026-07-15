# Cloud Database

This directory contains the code-owned Phase 1 database foundation for `P1-EPIC-03`.

## Migration framework

- Migrations live in `cloud/database/migrations`.
- Migration files are ordered with four-digit numeric prefixes and descriptive names.
- Each migration is a PostgreSQL SQL file with an explicit `BEGIN` / `COMMIT` transaction.
- `0001_migration_framework.sql` creates `schema_migrations` and `seed_runs` so applied migrations and seed files can be tracked by the future application migration runner.

## Seed data

- Seed files live in `cloud/database/seeds`.
- Seed data is idempotent and uses `ON CONFLICT` rather than manual database edits.
- The Phase 1 seed creates only the initial Blue Elephant company, site and room required by the approved deployment model.

## Validation

Run the repository database validation with:

```sh
npm run check:db
```

The validation checks ordering, transaction wrappers, primary keys, migration tracking tables and idempotent seed behaviour.

## Recovery and rollback notes

Phase 1 migrations are additive foundation migrations. Rollback for a failed pre-production deployment is to recreate the empty database from the ordered migration chain. Destructive production rollback scripts are intentionally not introduced in this epic.
