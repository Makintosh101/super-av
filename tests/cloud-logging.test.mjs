import assert from 'node:assert/strict';
import test from 'node:test';
import { CloudStructuredLogger } from '../cloud/structured-logger.mjs';

test('cloud structured logger includes correlation actor device timestamp and redacts sensitive fields', () => {
  const lines = [];
  const logger = new CloudStructuredLogger({ sink: (line) => lines.push(JSON.parse(line)), component: 'cloud.gateway', now: () => new Date('2026-07-15T00:00:00Z') });
  logger.error('Authorisation failed.', { correlationId: 'corr_1', actorId: 'user_1', deviceId: 'dev_1', errorCode: 'AUTH-3001', signedUrl: 'secret', password: 'secret' });
  assert.equal(lines[0].timestamp, '2026-07-15T00:00:00.000Z');
  assert.equal(lines[0].component, 'cloud.gateway');
  assert.equal(lines[0].correlationId, 'corr_1');
  assert.equal(lines[0].actorId, 'user_1');
  assert.equal(lines[0].deviceId, 'dev_1');
  assert.equal(lines[0].errorCode, 'AUTH-3001');
  assert.equal(lines[0].signedUrl, '[REDACTED]');
  assert.equal(lines[0].password, '[REDACTED]');
});
