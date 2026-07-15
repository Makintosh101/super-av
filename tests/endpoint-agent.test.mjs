import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EndpointService } from '../endpoint/agent/service.mjs';
import { validateSchemaVersion, migrationPlan, REQUIRED_SCHEMA_VERSION } from '../endpoint/agent/local-database.mjs';
import { loadOrCreateIdentity } from '../endpoint/agent/identity-manager.mjs';
import { ProvisioningClient } from '../endpoint/agent/provisioning-client.mjs';
import { PairingDisplaySource } from '../endpoint/agent/pairing-source.mjs';
import { CloudConnectionManager } from '../endpoint/agent/cloud-connection-manager.mjs';
import { createLocalApi, listenLocalhost } from '../endpoint/agent/local-api.mjs';

test('service emits structured startup and shutdown logs', async () => {
  const lines = [];
  const logger = { info: (message, fields) => lines.push({ message, fields }) };
  const service = new EndpointService({ logger });
  await service.start();
  await service.stop();
  assert.deepEqual(lines.map((line) => line.fields.event), ['service.start', 'service.started', 'service.stop', 'service.stopped']);
});

test('local schema rejects incompatible versions explicitly', () => {
  assert.equal(validateSchemaVersion(REQUIRED_SCHEMA_VERSION), true);
  assert.throws(() => validateSchemaVersion(0), /incompatible/);
  assert.deepEqual(migrationPlan([]), [1]);
});

test('identity is generated once, persisted, and private key is not in metadata', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'endpoint-identity-'));
  const first = await loadOrCreateIdentity(directory);
  const second = await loadOrCreateIdentity(directory);
  assert.equal(first.deviceId, second.deviceId);
  assert.equal(first.installationId, second.installationId);
  assert.equal(first.privateKeyPem, undefined);
  assert.ok(first.privateKeyRef.endsWith('identity.key'));
  const metadata = await readFile(join(directory, 'identity.json'), 'utf8');
  assert.equal(metadata.includes('PRIVATE KEY'), false);
});

test('provisioning client treats API failure as failure', async () => {
  const client = new ProvisioningClient({ baseUrl: 'https://cloud.example', fetchImpl: async () => ({ ok: false, status: 500 }) });
  await assert.rejects(() => client.registerUnclaimed({ deviceId: 'dev_1', installationId: 'inst_1', publicKeyPem: 'pub', fingerprint: 'fp' }), /registration failed/);
});

test('pairing source does not reuse expired or claimed sessions', async () => {
  const client = { baseUrl: 'https://cloud.example', fetch: async () => ({ ok: true, json: async () => ({ code: '123456', expiresAt: '2026-07-15T00:05:00Z', confirmationPhrase: 'BLUE RIVER 47' }) }) };
  const source = new PairingDisplaySource({ provisioningClient: client });
  await source.requestSession('dev_1');
  assert.equal(source.current(new Date('2026-07-15T00:01:00Z')).status, 'active');
  assert.equal(source.current(new Date('2026-07-15T00:06:00Z')).status, 'expired');
});

test('cloud connection manager sends hello and heartbeat over transport', async () => {
  const sent = [];
  const manager = new CloudConnectionManager({ identity: { deviceId: 'dev_1' }, transport: { connect: async () => {}, send: async (message) => sent.push(message) } });
  await manager.connect();
  await manager.handle({ type: 'server.welcome', connectionId: 'conn_1', heartbeatIntervalSeconds: 20 });
  await manager.heartbeat(10);
  assert.equal(sent[0].type, 'device.hello');
  assert.equal(sent[1].type, 'device.heartbeat');
  assert.equal(manager.connectionId, 'conn_1');
});

test('local API binds to localhost and requires bearer token', async () => {
  const server = createLocalApi({ authToken: 'local-secret', diagnostics: () => ({ identity: { deviceId: 'dev_1' }, network: { state: 'offline' }, pairing: { status: 'unavailable' }, cloud: { state: 'disconnected' }, assignment: null, logsPath: 'logs', diagnosticExport: { supported: true } }) });
  const address = await listenLocalhost(server);
  assert.equal(address.address, '127.0.0.1');
  const unauthorized = await fetch(`http://127.0.0.1:${address.port}/diagnostics`);
  assert.equal(unauthorized.status, 401);
  const authorized = await fetch(`http://127.0.0.1:${address.port}/diagnostics`, { headers: { authorization: 'Bearer local-secret' } });
  assert.equal(authorized.status, 200);
  const body = await authorized.json();
  assert.equal(body.identity.deviceId, 'dev_1');
  await new Promise((resolve) => server.close(resolve));
});
