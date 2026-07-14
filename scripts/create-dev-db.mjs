import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const repositoryRoot = resolve(import.meta.dirname, '..');
const dataDirectory = resolve(repositoryRoot, '.local');
const databasePath = resolve(dataDirectory, 'development.sqlite');
const migrationsDirectory = resolve(repositoryRoot, 'database', 'migrations');

mkdirSync(dataDirectory, { recursive: true });

const database = new DatabaseSync(databasePath);
try {
  database.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);');

  const migrations = readdirSync(migrationsDirectory)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();

  for (const migration of migrations) {
    const alreadyApplied = database.prepare('SELECT 1 FROM schema_migrations WHERE version = ?').get(migration);
    if (alreadyApplied) {
      continue;
    }

    database.exec(readFileSync(resolve(migrationsDirectory, migration), 'utf8'));
    database.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
      .run(migration, new Date().toISOString());
  }

  console.log(`Created development database at ${databasePath}`);
} finally {
  database.close();
}
