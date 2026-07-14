# Database Standards

- All schema changes use ordered migrations.
- No manual table creation or editing.
- Every table has a primary key and explicit constraints.
- Foreign keys and indexes are declared in migrations.
- Seed data is idempotent.
- Destructive changes use expand-and-contract releases.
- A clean empty database must be buildable from the full migration chain.
- Application startup checks schema compatibility.
