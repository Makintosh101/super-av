import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const migrationsDir = path.join(root, 'cloud/database/migrations');
const seedsDir = path.join(root, 'cloud/database/seeds');
const failures = [];

function fail(message) {
  failures.push(message);
}

function readSqlFiles(dir) {
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => ({ name, text: fs.readFileSync(path.join(dir, name), 'utf8') }));
}

const migrations = readSqlFiles(migrationsDir);
if (migrations.length === 0) fail('No migration files found.');

let expected = 1;
for (const { name, text } of migrations) {
  const match = /^(\d{4})_[a-z0-9_]+\.sql$/.exec(name);
  if (!match) {
    fail(`${name}: migration filename must be 0001_descriptive_name.sql.`);
    continue;
  }

  const version = Number.parseInt(match[1], 10);
  if (version !== expected) {
    fail(`${name}: expected migration prefix ${String(expected).padStart(4, '0')}.`);
  }
  expected += 1;

  if (!/^\s*--/.test(text)) fail(`${name}: migration must start with a comment describing the task.`);
  if (!/\bBEGIN\s*;/i.test(text)) fail(`${name}: migration must open an explicit transaction.`);
  if (!/\bCOMMIT\s*;/i.test(text)) fail(`${name}: migration must close an explicit transaction.`);

  const createTables = [...text.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+([a-z_]+)/gi)];
  for (const table of createTables) {
    const tableName = table[1];
    const tableStart = table.index ?? 0;
    const nextCreate = text.slice(tableStart + 1).search(/CREATE TABLE|ALTER TABLE|COMMIT\s*;/i);
    const tableSql = nextCreate === -1 ? text.slice(tableStart) : text.slice(tableStart, tableStart + 1 + nextCreate);
    if (!/PRIMARY KEY/i.test(tableSql)) {
      fail(`${name}: table ${tableName} must declare a primary key.`);
    }
  }
}

const framework = migrations.find((migration) => migration.name.startsWith('0001_'))?.text ?? '';
if (!/CREATE TABLE IF NOT EXISTS schema_migrations/i.test(framework)) {
  fail('0001 migration must create schema_migrations.');
}
if (!/CREATE TABLE IF NOT EXISTS seed_runs/i.test(framework)) {
  fail('0001 migration must create seed_runs.');
}

const allMigrationSql = migrations.map((migration) => migration.text).join('\n');
for (const required of ['companies', 'rooms', 'devices', 'device_credentials', 'pairing_sessions', 'room_configurations', 'device_commands', 'device_events', 'audit_events', 'releases']) {
  if (!new RegExp(`CREATE TABLE(?: IF NOT EXISTS)?\\s+${required}\\b`, 'i').test(allMigrationSql)) {
    fail(`Required table ${required} is missing from migrations.`);
  }
}

if (/raw_code|pairing_code\s+text/i.test(allMigrationSql)) {
  fail('Pairing migrations must not store raw pairing codes. Store code_hash instead.');
}

const seeds = readSqlFiles(seedsDir);
for (const { name, text } of seeds) {
  if (!/\bBEGIN\s*;/i.test(text) || !/\bCOMMIT\s*;/i.test(text)) {
    fail(`${name}: seed must use an explicit transaction.`);
  }
  if (!/ON CONFLICT/i.test(text)) {
    fail(`${name}: seed must be idempotent with ON CONFLICT.`);
  }
}

if (failures.length > 0) {
  console.error('Database validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Validated ${migrations.length} migration(s) and ${seeds.length} seed file(s).`);
