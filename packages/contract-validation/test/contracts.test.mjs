import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertJsonSchema, validateRequiredObjectFields } from '../src/index.mjs';

const repositoryRoot = resolve(import.meta.dirname, '../../..');

function readJson(pathFromRoot) {
  return JSON.parse(readFileSync(resolve(repositoryRoot, pathFromRoot), 'utf8'));
}

describe('contract schemas', () => {
  for (const schemaPath of [
    'contracts/capabilities/capability-manifest.schema.json',
    'contracts/commands/command-envelope.schema.json',
    'contracts/configuration/room-configuration.schema.json'
  ]) {
    it(`validates ${schemaPath}`, () => {
      assert.equal(assertJsonSchema(readJson(schemaPath)), true);
    });
  }

  it('accepts a minimal command envelope with all required fields', () => {
    const result = validateRequiredObjectFields(readJson('contracts/commands/command-envelope.schema.json'), {
      commandId: '018fdc2a-9b5b-7d31-b4fb-111111111111',
      deviceId: 'node-001',
      action: 'system.getStatus',
      issuedAt: '2026-07-14T00:00:00Z',
      expiresAt: '2026-07-14T00:01:00Z',
      parameters: {}
    });

    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });
});
