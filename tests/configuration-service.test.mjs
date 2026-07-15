import assert from 'node:assert/strict';
import test from 'node:test';
import { createConfigurationService, ConfigurationError } from '../cloud/configuration-service.mjs';

const admin = { userId: 'admin-1', companyId: 'blue-elephant-phase1', role: 'admin' };
const technician = { userId: 'tech-1', companyId: 'blue-elephant-phase1', role: 'technician' };
const validConfiguration = {
  schemaVersion: 'phase1.configuration.v1',
  capabilities: [
    { action: 'holding.show' },
    { action: 'video.output.selectSource' },
    { action: 'audio.master.setVolume' }
  ],
  assetIds: ['asset-holding-001'],
  packageReferences: [{ releaseId: 'release-phase1-demo' }]
};

function seededService() {
  const service = createConfigurationService({ now: () => new Date('2026-07-15T12:00:00Z') });
  service.registerDevice({ deviceId: 'dev-001', companyId: 'blue-elephant-phase1', roomId: 'demo-room', status: 'assigned' });
  service.createAssetMetadata({ assetId: 'asset-holding-001', companyId: 'blue-elephant-phase1', contentHash: 'sha256:abc123', storageKey: 'media/holding.png', sizeBytes: 1200, cachePolicy: 'cacheRequired' }, admin);
  return service;
}

test('validates configuration drafts without affecting desired deployments', () => {
  const service = seededService();
  const result = service.validateDraft({ companyId: 'blue-elephant-phase1', roomId: 'demo-room', configuration: validConfiguration }, technician);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(service._state.desiredDeployments.size, 0);
  assert.equal(service._state.auditEvents.at(-1).action, 'configuration.draft_validated');
});

test('rejects hardware paths, unknown capabilities and invalid asset references with paths', () => {
  const service = seededService();
  const result = service.validateDraft({ companyId: 'blue-elephant-phase1', roomId: 'demo-room', configuration: { schemaVersion: 'phase1.configuration.v1', capabilities: [{ action: 'touchdesigner.op', operatorPath: '/project1/out1' }], assetIds: ['missing-asset'] } }, admin);
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors.map((item) => item.code).sort(), ['CONFIG-8002', 'CONFIG-8003', 'CONFIG-8004']);
  assert.ok(result.errors.some((item) => item.path === '/capabilities/0/action'));
  assert.ok(result.errors.some((item) => item.path === '/capabilities/0'));
  assert.ok(result.errors.some((item) => item.path === '/assetIds/0'));
});

test('publishes immutable revisions, creates desired deployments and supersedes prior revisions', () => {
  const service = seededService();
  const draft = service.validateDraft({ companyId: 'blue-elephant-phase1', roomId: 'demo-room', configuration: validConfiguration }, admin);
  const first = service.publishConfiguration({ draftId: draft.draftId }, admin);
  assert.equal(first.configurationRevision, 1);
  assert.equal(first.publishedAt, '2026-07-15T12:00:00.000Z');
  assert.equal(service._state.desiredDeployments.get('dev-001').configurationRevision, 1);

  const secondDraft = service.validateDraft({ companyId: 'blue-elephant-phase1', roomId: 'demo-room', configuration: { ...validConfiguration, capabilities: [{ action: 'holding.hide' }], assetIds: ['asset-holding-001'] } }, admin);
  const second = service.publishConfiguration({ draftId: secondDraft.draftId }, admin);
  assert.equal(second.configurationRevision, 2);
  assert.equal(service._state.revisions.get(1).supersededAt, second.publishedAt);
  assert.equal(service._state.revisions.get(1).configuration.capabilities[0].action, 'holding.show');
  assert.equal(service._state.auditEvents.at(-1).action, 'configuration.published');
});

test('prevents invalid drafts from publication', () => {
  const service = seededService();
  const draft = service.validateDraft({ companyId: 'blue-elephant-phase1', roomId: 'demo-room', configuration: { schemaVersion: 'phase1.configuration.v1', capabilities: [{ action: 'unknown' }] } }, admin);
  assert.throws(() => service.publishConfiguration({ draftId: draft.draftId }, admin), (error) => error instanceof ConfigurationError && error.code === 'CONFIG-8001');
});

test('returns desired configuration to assigned active devices only with asset IDs and package references', () => {
  const service = seededService();
  const draft = service.validateDraft({ companyId: 'blue-elephant-phase1', roomId: 'demo-room', configuration: validConfiguration }, admin);
  service.publishConfiguration({ draftId: draft.draftId }, admin);
  const desired = service.getDesiredConfiguration({ deviceId: 'dev-001' });
  assert.equal(desired.configurationRevision, 1);
  assert.deepEqual(desired.assetIds, ['asset-holding-001']);
  assert.deepEqual(desired.packageReferences, [{ releaseId: 'release-phase1-demo' }]);
  assert.equal(desired.storageKey, undefined);

  service.registerDevice({ deviceId: 'dev-unclaimed', companyId: 'blue-elephant-phase1', roomId: 'demo-room', status: 'unclaimed' });
  assert.throws(() => service.getDesiredConfiguration({ deviceId: 'dev-unclaimed' }), (error) => error.code === 'AUTH-3001');
  service._state.devices.get('dev-001').revoked = true;
  assert.throws(() => service.getDesiredConfiguration({ deviceId: 'dev-001' }), (error) => error.code === 'AUTH-3001');
});

test('stores minimal media asset metadata without signed or protected URLs', () => {
  const service = createConfigurationService();
  const asset = service.createAssetMetadata({ assetId: 'asset-1', companyId: 'blue-elephant-phase1', contentHash: 'sha256:def456', storageKey: 'media/test.mp4', sizeBytes: 2048, cachePolicy: 'cacheOptional' }, admin);
  assert.deepEqual(Object.keys(asset).sort(), ['assetId', 'cachePolicy', 'companyId', 'contentHash', 'createdAt', 'sizeBytes', 'storageKey'].sort());
  assert.throws(() => service.createAssetMetadata({ assetId: 'asset-2', companyId: 'blue-elephant-phase1', contentHash: 'sha256:def456', storageKey: 'media/test.mp4', sizeBytes: 2048, cachePolicy: 'cacheOptional', signedUrl: 'https://signed.example.invalid' }, admin), (error) => error.code === 'CONFIG-8003');
});
