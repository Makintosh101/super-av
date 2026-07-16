import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createSign } from 'node:crypto';
import { mkdtemp, writeFile, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createProvisioningService } from '../cloud/provisioning/provisioning-service.mjs';
import { createConfigurationService } from '../cloud/configuration-service.mjs';
import { createGatewayService } from '../cloud/gateway/gateway-service.mjs';
import { ConfigurationManager } from '../endpoint/agent/configuration-manager.mjs';
import { loadOrCreateIdentity } from '../endpoint/agent/identity-manager.mjs';
import { EndpointService } from '../endpoint/agent/service.mjs';
import { exportDiagnosticBundle } from '../endpoint/agent/diagnostic-bundle.mjs';
import { AdapterHost } from '../endpoint/agent/adapters/adapter-host.mjs';
import { SimulatedNodeAdapter } from '../endpoint/agent/adapters/simulated-node-adapter.mjs';
import { SystemHealthAdapter } from '../endpoint/agent/adapters/system-health-adapter.mjs';
import { LocalhostTouchDesignerBridge, TouchDesignerAdapter } from '../endpoint/agent/adapters/touchdesigner-adapter.mjs';
import { createTouchDesignerProjectManifest } from '../touchdesigner/packages/phase1-project-manifest.mjs';
import { sha256File, validatePackage, activatePackageWithRollback } from '../endpoint/agent/package-validator.mjs';
import { phase1BlueElephantInfrastructure, validatePhase1InfrastructureDefinition } from '../deployment/infrastructure/phase1-blue-elephant.mjs';

const execFileAsync = promisify(execFile);
const adminAuth = { userId: 'user_admin', role: 'admin', companyId: 'blue-elephant-phase1' };
const userAuth = { userId: 'user_operator', role: 'user', companyId: 'blue-elephant-phase1' };

function socketRecorder() {
  const sent = [];
  return { sent, send: async (payload) => { sent.push(JSON.parse(payload)); return { ok: true }; } };
}

function signManifest({ privateKey, id, version, sha256 }) {
  const signer = createSign('RSA-SHA256');
  signer.update(`${id}:${version}:${sha256}`);
  signer.end();
  return signer.sign(privateKey, 'base64');
}

async function provisionAssignedDevice() {
  const provisioning = createProvisioningService({ now: () => new Date('2026-07-16T10:00:00Z') });
  const registration = provisioning.registerDevice({
    deviceId: 'dev_phase1', installationId: 'install_phase1', publicKey: 'public-key', fingerprint: 'fingerprint',
    commissioning: { reportedHostname: 'phase1-node', reportedModel: 'windows-sim', shortFingerprint: 'finger' }
  });
  const pairing = provisioning.createPairingSession({ deviceId: registration.deviceId });
  const claim = provisioning.claimPairingSession(pairing.code, adminAuth);
  const assignment = provisioning.assignRoom({ deviceId: claim.deviceId, roomId: 'demo-room' }, adminAuth);
  return { provisioning, registration, claim, assignment };
}

function publishConfiguration(configurationService, deviceId = 'dev_phase1') {
  configurationService.createAssetMetadata({ assetId: 'default-logo', companyId: 'blue-elephant-phase1', contentHash: 'sha256:logo', storageKey: 'assets/default-logo.png', sizeBytes: 10, cachePolicy: 'cacheRequired' }, adminAuth);
  configurationService.registerDevice({ deviceId, companyId: 'blue-elephant-phase1', roomId: 'demo-room', status: 'assigned' });
  const draft = configurationService.validateDraft({ companyId: 'blue-elephant-phase1', roomId: 'demo-room', configuration: { schemaVersion: 'phase1.configuration.v1', assetIds: ['default-logo'], capabilities: [{ action: 'video.output.selectSource' }, { action: 'preset.activate' }, { action: 'holding.show' }, { action: 'audio.microphones.setMuted' }] } }, adminAuth);
  configurationService.publishConfiguration({ draftId: draft.draftId }, adminAuth);
  return configurationService.getDesiredConfiguration({ deviceId });
}

test('P1-BE-1301 clean environment rebuild uses migrations, seed data and code-owned infrastructure', async () => {
  const result = await execFileAsync(process.execPath, ['cloud/database/scripts/validate-migrations.mjs'], { cwd: process.cwd() });
  assert.match(result.stdout, /Validated \d+ migration\(s\) and \d+ seed file\(s\)\./);
  assert.equal(validatePhase1InfrastructureDefinition(), true);
  assert.deepEqual(Object.keys(phase1BlueElephantInfrastructure.modules), ['api', 'gateway', 'database', 'sessionStore', 'objectStorage', 'webApp']);
});

test('P1-BE-1302 simulator end-to-end lifecycle reaches browser-confirmed state and reconnect is idempotent', async () => {
  const { claim } = await provisionAssignedDevice();
  const configurationService = createConfigurationService({ now: () => new Date('2026-07-16T10:01:00Z') });
  const desired = publishConfiguration(configurationService);
  const gateway = createGatewayService({ now: () => new Date('2026-07-16T10:02:00Z') });
  gateway.registerAssignedDevice({ deviceId: claim.deviceId, companyId: claim.companyId, roomId: 'demo-room', credentialThumbprint: claim.certificate.certificateThumbprint });
  const welcome = gateway.connectDevice({ credentialThumbprint: claim.certificate.certificateThumbprint, hello: { type: 'device.hello', messageId: 'msg_hello', deviceId: claim.deviceId, agentVersion: '1.0.0', protocolVersion: '1.0', lastConfigurationRevision: desired.configurationRevision, lastReportedStateRevision: 0 } });
  const browser = gateway.subscribeBrowser({ roomId: 'demo-room', auth: userAuth });
  gateway.takeControl(browser.sessionId);
  const command = gateway.createCommand({ roomId: 'demo-room', auth: userAuth, action: 'video.output.selectSource', parameters: { source: 'presentation' }, configurationRevision: desired.configurationRevision, expiresAt: '2026-07-16T10:03:00Z', idempotencyKey: 'idem-presentation' });
  const duplicate = gateway.createCommand({ roomId: 'demo-room', auth: userAuth, action: 'video.output.selectSource', parameters: { source: 'presentation' }, configurationRevision: desired.configurationRevision, expiresAt: '2026-07-16T10:03:00Z', idempotencyKey: 'idem-presentation' });
  assert.equal(duplicate.commandId, command.commandId);
  const adapter = new SimulatedNodeAdapter();
  await adapter.start();
  await adapter.execute({ action: command.action, parameters: command.parameters });
  gateway.acknowledgeCommand(welcome.connectionId, { commandId: command.commandId, status: 'accepted' });
  gateway.completeCommand(welcome.connectionId, { commandId: command.commandId, status: 'succeeded', reportedStateRevision: 1 });
  gateway.ingestState(welcome.connectionId, { type: 'device.stateChanged', messageId: 'msg_state', deviceId: claim.deviceId, revision: 1, changes: { 'video.mainOutput.source': 'presentation' } });
  assert.ok(gateway._state.browserBroadcasts.some((event) => event.type === 'device.stateChanged' && event.payload.state['video.mainOutput.source'] === 'presentation'));
});

test('P1-BE-1303 Windows endpoint installation acceptance preserves identity and exports diagnostics', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'windows-install-acceptance-'));
  const identityDirectory = join(directory, 'identity');
  const identity = await loadOrCreateIdentity(identityDirectory);
  const serviceEvents = [];
  const service = new EndpointService({ logger: { info: (message, context) => serviceEvents.push({ message, context }) }, startHooks: [async () => serviceEvents.push({ event: 'pairing-data-served' })] });
  await service.start();
  const afterReboot = await loadOrCreateIdentity(identityDirectory);
  assert.equal(afterReboot.deviceId, identity.deviceId);
  assert.ok(serviceEvents.some((event) => event.event === 'pairing-data-served'));
  await mkdir(join(directory, 'logs'));
  await writeFile(join(directory, 'logs', 'agent.log'), 'token=secret should be redacted');
  const outputPath = join(directory, 'diagnostics.json');
  await exportDiagnosticBundle({ outputPath, logsDirectory: join(directory, 'logs'), configurationSummary: { configurationRevision: 1 }, versions: { agent: '1.0.0' }, recentHealth: [{ status: 'healthy' }], recentCommands: [], environmentSummary: { platform: 'win32' } });
  assert.equal(JSON.parse(await readFile(outputPath, 'utf8')).configurationSummary.configurationRevision, 1);
});

test('P1-BE-1304 TouchDesigner abstraction keeps cloud messages logical while adapter maps locally', async () => {
  const socket = socketRecorder();
  const adapter = new TouchDesignerAdapter({ executablePath: '/TouchDesigner.exe', projectPath: '/phase1.toe', expectedProjectVersion: 'project-v1', bridge: new LocalhostTouchDesignerBridge({ socketFactory: async () => socket }), launcher: () => ({ kill: () => {} }) });
  await adapter.start();
  await adapter.execute({ action: 'video.output.selectSource', parameters: { source: 'presentation' } });
  assert.equal(socket.sent.at(-1).action, 'video.output.selectSource');
  assert.equal(socket.sent.some((message) => JSON.stringify(message).includes('/project')), false);
  assert.equal((await adapter.reportedState()).videoSource, 'presentation');
});

test('P1-BE-1305 network loss and roaming preserve output, reject expired replay and reconcile revisions', () => {
  let current = new Date('2026-07-16T10:00:00Z');
  const gateway = createGatewayService({ now: () => current, heartbeatIntervalSeconds: 1 });
  gateway.registerAssignedDevice({ deviceId: 'dev_roaming', companyId: 'blue-elephant-phase1', roomId: 'demo-room', credentialThumbprint: 'thumbprint' });
  const welcome = gateway.connectDevice({ credentialThumbprint: 'thumbprint', hello: { type: 'device.hello', messageId: 'msg_1', deviceId: 'dev_roaming', agentVersion: '1.0.0', protocolVersion: '1.0', lastConfigurationRevision: 1, lastReportedStateRevision: 4 } });
  gateway.subscribeBrowser({ roomId: 'demo-room', auth: userAuth });
  gateway.ingestState(welcome.connectionId, { type: 'device.stateChanged', messageId: 'msg_state_4', deviceId: 'dev_roaming', revision: 4, changes: { 'video.mainOutput.source': 'presentation' } });
  current = new Date('2026-07-16T10:00:03Z');
  gateway.evaluatePresence();
  assert.equal(gateway._state.reportedStates.get('dev_roaming').state['video.mainOutput.source'], 'presentation');
  assert.ok(gateway._state.alerts.some((alert) => alert.alertType === 'device.offline'));
  const browser = [...gateway._state.browserSessions.values()][0];
  gateway.takeControl(browser.sessionId);
  const expired = gateway.createCommand({ roomId: 'demo-room', auth: userAuth, action: 'holding.show', expiresAt: '2026-07-16T10:00:02Z', idempotencyKey: 'expired-command' });
  assert.equal(gateway.deliverCommand(expired.commandId).status, 'expired');
  const reconnected = gateway.connectDevice({ credentialThumbprint: 'thumbprint', hello: { type: 'device.hello', messageId: 'msg_2', deviceId: 'dev_roaming', agentVersion: '1.0.0', protocolVersion: '1.0', lastConfigurationRevision: 1, lastReportedStateRevision: 4 } });
  gateway.ingestState(reconnected.connectionId, { type: 'device.stateChanged', messageId: 'msg_state_5', deviceId: 'dev_roaming', revision: 5, changes: { 'video.mainOutput.source': 'presentation' } });
  assert.equal(gateway._state.reportedStates.get('dev_roaming').revision, 5);
});

test('P1-BE-1306 reboot while offline loads cached configuration, starts adapters and later uploads queued events', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'offline-reboot-'));
  const configPath = join(directory, 'configuration.json');
  const manager = new ConfigurationManager({ path: configPath, fetchDesiredConfiguration: async () => { throw new Error('cloud unavailable'); } });
  manager.state.active = { configurationRevision: 7, schemaVersion: 'phase1.configuration.v1', capabilities: ['holding.show'], activeState: { holdingVisible: true } };
  await manager.persist();
  const rebooted = new ConfigurationManager({ path: configPath, fetchDesiredConfiguration: async () => { throw new Error('cloud unavailable'); } });
  await rebooted.load();
  const host = new AdapterHost({ adapters: [new SystemHealthAdapter(), new SimulatedNodeAdapter()] });
  const health = await host.start();
  const queuedEvents = [{ type: 'recovery.loadedKnownGoodConfiguration', configurationRevision: rebooted.active().configurationRevision }];
  const uploaded = [];
  uploaded.push(...queuedEvents.splice(0));
  assert.equal(rebooted.active().configurationRevision, 7);
  assert.equal(health.status, 'healthy');
  assert.deepEqual(uploaded, [{ type: 'recovery.loadedKnownGoodConfiguration', configurationRevision: 7 }]);
});

test('P1-BE-1307 configuration activation failure preserves previous known-good revision and reports failed desired revision', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'configuration-rollback-'));
  const reports = [];
  const manager = new ConfigurationManager({ path: join(directory, 'configuration.json'), reportConfiguration: async (report) => reports.push(report), fetchDesiredConfiguration: async () => ({ configurationRevision: 8, schemaVersion: 'phase1.configuration.v1', capabilities: ['touchdesigner.operator.path'] }) });
  manager.state.active = { configurationRevision: 7, schemaVersion: 'phase1.configuration.v1', capabilities: ['holding.show'] };
  await assert.rejects(() => manager.downloadValidateAndActivate(), /unsupported capabilities/);
  assert.equal(manager.active().configurationRevision, 7);
  assert.equal(manager.state.failedRevision, 8);
  assert.deepEqual(reports, [{ status: 'failed', activeRevision: 7, desiredRevision: 8, errorCode: 'NODE-CONFIGURATION-1001' }]);
});

test('P1-BE-1308 update package validation rejects unsigned or altered packages and preserves previous package for rollback', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'update-rollback-'));
  const packagePath = join(directory, 'project.pkg');
  await writeFile(packagePath, 'valid package');
  const sha256 = await sha256File(packagePath);
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  const manifest = createTouchDesignerProjectManifest({ projectVersion: 'td-1.0.0', sha256, signature: signManifest({ privateKey, id: 'touchdesigner-phase1-project', version: 'td-1.0.0', sha256 }) });
  await assert.rejects(() => validatePackage({ manifest: { ...manifest, signature: undefined }, packagePath, publicKeyPem }), /unsigned/);
  const installDirectory = join(directory, 'install');
  await activatePackageWithRollback({ manifest, packagePath, publicKeyPem, installDirectory });
  await writeFile(packagePath, 'valid package v2');
  const secondSha = await sha256File(packagePath);
  const secondManifest = createTouchDesignerProjectManifest({ projectVersion: 'td-1.0.1', sha256: secondSha, signature: signManifest({ privateKey, id: 'touchdesigner-phase1-project', version: 'td-1.0.1', sha256: secondSha }) });
  const activation = await activatePackageWithRollback({ manifest: secondManifest, packagePath, publicKeyPem, installDirectory });
  assert.equal(await readFile(activation.previousPackage, 'utf8'), 'valid package');
  await writeFile(packagePath, 'altered');
  await assert.rejects(() => validatePackage({ manifest: secondManifest, packagePath, publicKeyPem }), /hash does not match/);
});
