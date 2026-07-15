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

import { CommandDispatcher, PHASE_1_ACTIONS } from '../endpoint/agent/command-dispatcher.mjs';
import { JsonCommandDeduplicationStore } from '../endpoint/agent/command-deduplication-store.mjs';
import { ConfigurationManager } from '../endpoint/agent/configuration-manager.mjs';
import { ReportedStatePublisher, LocalEventQueue } from '../endpoint/agent/state-and-event-queues.mjs';
import { OfflineControlBoundary } from '../endpoint/agent/offline-control.mjs';

test('command dispatcher validates, acknowledges, completes, and deduplicates commands', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'endpoint-command-'));
  const sent = [];
  const dispatcher = new CommandDispatcher({
    adapter: { execute: async (command) => ({ appliedAction: command.action }) },
    deduplicationStore: new JsonCommandDeduplicationStore({ path: join(directory, 'dedupe.json') }),
    configurationProvider: { active: () => ({ configurationRevision: 7, capabilities: PHASE_1_ACTIONS }) },
    transport: { send: async (message) => sent.push(message) },
    logger: { info: () => {} }
  });
  const command = { commandId: 'cmd_1', correlationId: 'corr_1', idempotencyKey: 'idem_1', actorRole: 'User', action: 'holding.show', requiredCapability: 'holding.show', configurationRevision: 7, expiresAt: '2999-01-01T00:00:00Z' };
  const first = await dispatcher.dispatch(command);
  const duplicate = await dispatcher.dispatch(command);
  assert.equal(first.status, 'completed');
  assert.equal(duplicate.status, 'completed');
  assert.deepEqual(sent.map((message) => message.type), ['device.commandAcknowledged', 'device.commandCompleted']);
  await assert.rejects(() => dispatcher.dispatch({ ...command, commandId: 'cmd_2', idempotencyKey: 'idem_2', action: '/project1/base1' }), /Unsupported/);
});

test('configuration manager validates desired configuration and preserves known-good on rejection', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'endpoint-config-'));
  const reports = [];
  const manager = new ConfigurationManager({ path: join(directory, 'configuration.json'), fetchDesiredConfiguration: async () => ({ schemaVersion: 'phase1.configuration.v1', configurationRevision: 3, assetIds: ['asset_1'], capabilities: ['holding.show'] }), reportConfiguration: async (report) => reports.push(report), assetExists: async () => true });
  const active = await manager.downloadValidateAndActivate();
  assert.equal(active.configurationRevision, 3);
  assert.equal(reports[0].status, 'active');
  const rejecting = new ConfigurationManager({ path: join(directory, 'bad.json'), fetchDesiredConfiguration: async () => ({ schemaVersion: 'phase1.configuration.v1', configurationRevision: 4, assetIds: [], capabilities: ['touchdesigner.operator.path'] }) });
  await assert.rejects(() => rejecting.downloadValidateAndActivate(), /unsupported capabilities/);
  assert.equal(rejecting.active().configurationRevision, 0);
});

test('state publisher queues offline state and refuses stale overwrite', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'endpoint-state-'));
  let online = false;
  const sent = [];
  const publisher = new ReportedStatePublisher({ path: join(directory, 'state.json'), transport: { send: async (message) => { if (!online) throw new Error('offline'); sent.push(message); } } });
  await publisher.publish({ system: { online: true }, video: { source: 'hdmi1' }, holding: { visible: false }, audio: { masterVolume: 50 } });
  online = true;
  await publisher.reconcile(0);
  assert.equal(sent[0].type, 'device.stateChanged');
  await assert.rejects(() => publisher.reconcile(99), /newer than local/);
});

test('event queue uploads in UTC order and preserves failed uploads with diagnostics', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'endpoint-events-'));
  const sent = [];
  const queue = new LocalEventQueue({ path: join(directory, 'events.json'), transport: { send: async (event) => { if (event.eventId === 'evt_fail') throw new Error('upload failed'); sent.push(event); } }, maxEvents: 1, diskSpaceAvailable: () => false });
  await queue.enqueue({ eventId: 'evt_late', eventType: 'command.completed', correlationId: 'corr_1', occurredAt: '2026-07-15T00:02:00Z' });
  await queue.enqueue({ eventId: 'evt_fail', eventType: 'health.changed', correlationId: 'corr_2', occurredAt: '2026-07-15T00:01:00Z' });
  const result = await queue.flush();
  assert.equal(result.remaining, 1);
  assert.equal(sent[0].eventId, 'evt_late');
  assert.equal(result.diagnostics.diskSpace, 'low');
});

test('offline control boundary permits cached User and Technician actions only', async () => {
  const dispatched = [];
  const boundary = new OfflineControlBoundary({ dispatcher: { dispatch: async (command) => { dispatched.push(command); return { status: 'completed' }; } }, cachedRoomActions: ['holding.hide'], draftStore: { save: async () => {} } });
  await boundary.execute({ actorRole: 'User', action: 'holding.hide' });
  assert.equal(dispatched[0].source, 'offlineLocal');
  await assert.rejects(() => boundary.execute({ actorRole: 'Admin', action: 'holding.hide' }), /User and Technician/);
  await assert.rejects(() => boundary.execute({ actorRole: 'Technician', action: 'certificate.rotate' }), /cloud-only/);
  const draft = await boundary.createDraftProgramming({ actorRole: 'Technician', draft: { name: 'Preset draft' } });
  assert.equal(draft.requiresCloudReview, true);
});
