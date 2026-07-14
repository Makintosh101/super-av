# Database

All schema changes must be added through ordered migrations.

## Migration tooling

The initial scaffold uses ordered SQL files in `database/migrations` and the Node `node:sqlite` module to create a local development database.

```sh
npm run db:create
```

The command applies migrations to `.local/development.sqlite`. The current baseline migration is intentionally empty because TASK-001 does not introduce product data entities.
