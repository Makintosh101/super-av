import { readFile } from 'node:fs/promises';
import { EndpointError, ERROR_CODES } from './errors.mjs';
export const REQUIRED_SCHEMA_VERSION = 1;
export async function loadMigration(path) { return readFile(path, 'utf8'); }
export function validateSchemaVersion(currentVersion) {
  if (currentVersion !== REQUIRED_SCHEMA_VERSION) {
    throw new EndpointError(ERROR_CODES.incompatibleSchema, `Local schema version ${currentVersion} is incompatible with required version ${REQUIRED_SCHEMA_VERSION}.`, { currentVersion, requiredVersion: REQUIRED_SCHEMA_VERSION });
  }
  return true;
}
export function migrationPlan(appliedVersions) {
  return [1].filter((version) => !appliedVersions.includes(version));
}
