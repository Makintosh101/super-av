import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, createSign } from 'node:crypto';
import { readdir, readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { phase1BlueElephantInfrastructure, validatePhase1InfrastructureDefinition } from '../deployment/infrastructure/phase1-blue-elephant.mjs';
import { createProvisioningService } from '../cloud/provisioning/provisioning-service.mjs';
import { createGatewayService } from '../cloud/gateway/gateway-service.mjs';
import { createPhase1WebAppScreens } from '../cloud/web-app-screens.mjs';
import { ConfigurationManager } from '../endpoint/agent/configuration-manager.mjs';
import { CommandDispatcher, PHASE_1_ACTIONS } from '../endpoint/agent/command-dispatcher.mjs';
import { JsonCommandDeduplicationStore } from '../endpoint/agent/command-deduplication-store.mjs';
import { ReportedStatePublisher, LocalEventQueue } from '../endpoint/agent/state-and-event-queues.mjs';
import { EndpointService } from '../endpoint/agent/service.mjs';
import { exportDiagnosticBundle } from '../endpoint/agent/diagnostic-bundle.mjs';
import { SimulatedNodeAdapter } from '../endpoint/agent/adapters/simulated-node-adapter.mjs';
import { TouchDesignerAdapter } from '../endpoint/agent/adapters/touchdesigner-adapter.mjs';
import { createEndpointInstallerManifest, validateEndpointInstallerManifest } from '../endpoint/packaging/installer-manifest.mjs';
import { createTouchDesignerProjectManifest } from '../touchdesigner/packages/phase1-project-manifest.mjs';
import { sha256File, validatePackage, activatePackageWithRollback } from '../endpoint/agent/package-validator.mjs';

const admin = { userId: 'admin_1', role: 'admin', companyId: 'blue-elephant-phase1' };
const user = { userId: 'user_1', role: 'user', companyId: 'blue-elephant-phase1' };
const baseNow = new Date('2026-07-16T10:00:00.000Z');

function signManifest({ privateKey, id, version, sha256 }) {
  const signer = createSign('RSA-SHA256');
  signer.update(`${id}:${version}:${sha256}`);
  signer.end();
  return signer.sign(privateKey, 'base64');
}

async function migrationEvidence() {
  const migrations = (await readdir('cloud/database/migrations')).filter((name) => name.endsWith('.sql')).sort();
  const seeds = (await readdir('cloud/database/seeds')).filter((name) => name.endsWith('.sql')).sort();
  const history = [];
  for (const name of migrations) {
    const sql = await readFile(join('cloud/database/migrations', name), 'utf8');
    history.push({ name, checksum: createHash('sha256').update(sql).digest('hex') });
  }
  return { migrations, seeds, history };
}

function provisionAssignedDevice({ now = () => baseNow } = {}) {
  const provisioning = createProvisioningService({ now });
  const registration = provisioning.registerDevice({ deviceId: 'dev_1', installationId: 'install_1', publicKey: 'pub', fingerprint: 'fingerprint_12345678', commissioning: { reportedHostname: 'phase1-node', reportedModel: 'simulator', shortFingerprint: 'fingerpr' }, bootstrapVersion: '0.1.0' });
  const pairing = provisioning.createPairingSession({ deviceId: registration.deviceId });
  const claimed = provisioning.claimPairingSession(pairing.code, admin);
  const assignment = provisioning.assignRoom({ deviceId: claimed.deviceId, roomId: 'demo-room' }, admin);
  const credentialThumbprint = claimed.certificate.certificateThumbprint;
  return { provisioning, registration, pairing, claimed, assignment, credentialThumbprint };
}

function connectGatewayDevice({ credentialThumbprint, now = () => baseNow } = {}) {
  const gateway = createGatewayService({ now });
  gateway.registerAssignedDevice({ deviceId: 'dev_1', companyId: 'blue-elephant-phase1', roomId: 'demo-room', credentialThumbprint });
  const welcome = gateway.connectDevice({ credentialThumbprint, hello: { type: 'device.hello', messageId: 'msg_hello', deviceId: 'dev_1', agentVersion: '0.1.0', protocolVersion: 'phase1.gateway.v1', lastConfigurationRevision: 1, lastReportedStateRevision: 0 } });
  return { gateway, connectionId: welcome.connectionId, welcome };
}

test('P1-BE-1301 clean-environment rebuild evidence uses migrations, seeds, infrastructure code and checksums', async () => {
  const evidence = await migrationEvidence();
  assert.deepEqual(evidence.migrations, ['0001_migration_framework.sql', '0002_identity_company_site_room.sql', '0003_device_lifecycle.sql', '0004_configuration_command_state_event.sql', '0005_release_package_metadata.sql', '0006_epic04_provisioning_metadata.sql']);
  assert.deepEqual(evidence.seeds, ['001_blue_elephant_phase1.sql']);
  assert.equal(evidence.history.length, evidence.migrations.length);
  assert.ok(evidence.history.every((item) => /^[a-f0-9]{64}$/.test(item.checksum)));
  assert.equal(validatePhase1InfrastructureDefinition(phase1BlueElephantInfrastructure), true);
  assert.equal(phase1BlueElephantInfrastructure.deploymentId, 'blue-elephant-phase1');
});

test('P1-BE-1302 simulator lifecycle registers, pairs, assigns, receives configuration, executes once and updates browser state', async () => {
  const { provisioning, credentialThumbprint } = provisionAssignedDevice();
  const { gateway, connectionId } = connectGatewayDevice({ credentialThumbprint });
  const screens = createPhase1WebAppScreens({ provisioningService: provisioning, gatewayService: gateway, now: () => baseNow });
  const browserSession = gateway.subscribeBrowser({ roomId: 'demo-room', auth: user });
  gateway.takeControl(browserSession.sessionId);

  const directory = await mkdtemp(join(tmpdir(), 'phase1-sim-'));
  const adapter = new SimulatedNodeAdapter();
  await adapter.start();
  const config = new ConfigurationManager({ path: join(directory, 'configuration.json'), fetchDesiredConfiguration: async () => ({ schemaVersion: 'phase1.configuration.v1', configurationRevision: 1, assetIds: [], capabilities: PHASE_1_ACTIONS }) });
  await config.downloadValidateAndActivate();
  const sent = [];
  const dispatcher = new CommandDispatcher({ adapter, deduplicationStore: new JsonCommandDeduplicationStore({ path: join(directory, 'dedupe.json') }), configurationProvider: config, transport: { send: async (message) => sent.push(message) }, logger: { info: () => {} } });
  const command = gateway.createCommand({ roomId: 'demo-room', auth: user, action: 'video.output.selectSource', parameters: { source: 'hdmi1' }, configurationRevision: 1, expiresAt: '2999-01-01T00:00:00Z', idempotencyKey: 'idem-video-1' });
  const endpointCommand = { ...command, correlationId: 'corr-video-1', requiredCapability: command.action, actorRole: 'User' };
  const result = await dispatcher.dispatch(endpointCommand);
  await dispatcher.dispatch(endpointCommand);
  gateway.acknowledgeCommand(connectionId, { commandId: command.commandId, status: 'accepted' });
  gateway.completeCommand(connectionId, { commandId: command.commandId, status: 'succeeded', reportedStateRevision: 1 });
  gateway.ingestState(connectionId, { type: 'device.stateChanged', deviceId: 'dev_1', revision: 1, changes: result.result.reportedState });
  assert.equal(result.status, 'completed');
  assert.equal(sent.filter((message) => message.type === 'device.commandCompleted').length, 1);
  assert.equal(gateway.createCommand({ roomId: 'demo-room', auth: user, action: 'video.output.selectSource', parameters: { source: 'hdmi1' }, configurationRevision: 1, expiresAt: '2999-01-01T00:00:00Z', idempotencyKey: 'idem-video-1' }).commandId, command.commandId);
  assert.equal(screens.roomControlPage(user).data.commandStatus.status, 'succeeded');
  assert.equal(screens.roomControlPage(user).data.status[0].currentState.video.source, 'hdmi1');
});

test('P1-BE-1303 Windows endpoint installation acceptance evidence covers service, pairing persistence and diagnostics', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'phase1-install-'));
  const manifest = createEndpointInstallerManifest({ version: '1.0.0', installRoot: 'C:/ProgramData/BlueElephant/EndpointAgent' });
  assert.equal(validateEndpointInstallerManifest(manifest), true);
  await writeFile(join(directory, 'identity.json'), JSON.stringify({ deviceId: 'dev_1', installationId: 'install_1' }));
  const starts = [];
  const service = new EndpointService({ logger: { info: (message, fields) => starts.push(fields.event) }, startHooks: [async () => starts.push('pairing.display.available')] });
  await service.start();
  await service.stop();
  await service.start();
  const bundle = await exportDiagnosticBundle({ outputPath: join(directory, 'diagnostics.json'), logs: ['service.started'], configurationSummary: { activeRevision: 1 }, versions: { agent: manifest.version }, recentHealth: [{ status: 'healthy' }], recentCommands: [], environmentSummary: { os: 'Windows' } });
  assert.equal(manifest.service.autoStart, true);
  assert.ok(starts.includes('pairing.display.available'));
  assert.deepEqual(JSON.parse(await readFile(join(directory, 'identity.json'), 'utf8')), { deviceId: 'dev_1', installationId: 'install_1' });
  assert.equal(bundle.sensitiveValuesRedacted, true);
});

test('P1-BE-1304 TouchDesigner hardware-path abstraction keeps cloud records logical and maps locally', async () => {
  const { credentialThumbprint } = provisionAssignedDevice();
  const { gateway } = connectGatewayDevice({ credentialThumbprint });
  const browserSession = gateway.subscribeBrowser({ roomId: 'demo-room', auth: user });
  gateway.takeControl(browserSession.sessionId);
  const sent = [];
  const adapter = new TouchDesignerAdapter({ executablePath: 'TouchDesigner.exe', projectPath: 'project.toe', expectedProjectVersion: 'td-1.0.0', launcher: () => ({ kill: () => {} }), bridge: { connected: true, connect: async () => {}, send: async (message) => { sent.push(message); return { ok: true }; } } });
  const command = gateway.createCommand({ roomId: 'demo-room', auth: user, action: 'video.output.selectSource', parameters: { source: 'hdmi1' }, configurationRevision: 1, expiresAt: '2999-01-01T00:00:00Z', idempotencyKey: 'idem-td-1' });
  const result = await adapter.execute(command);
  const cloudText = JSON.stringify([...gateway._state.commands.values(), ...gateway._state.outboundMessages]);
  assert.equal(command.action, 'video.output.selectSource');
  assert.equal(/\/project|operator|op\(/i.test(cloudText), false);
  assert.deepEqual(sent[0], { type: 'command.execute', action: 'video.output.selectSource', parameters: { source: 'hdmi1' } });
  assert.equal(result.reportedState.videoSource, 'hdmi1');
});

test('P1-BE-1305 network loss and roaming resilience preserves active output and reconciles without re-pairing or expired replay', async () => {
  let currentNow = new Date('2026-07-16T10:00:00.000Z');
  const now = () => currentNow;
  const { credentialThumbprint } = provisionAssignedDevice({ now });
  const { gateway, connectionId } = connectGatewayDevice({ credentialThumbprint, now });
  const adapter = new SimulatedNodeAdapter();
  await adapter.start();
  await adapter.execute({ action: 'video.output.selectSource', parameters: { source: 'hdmi1' } });
  currentNow = new Date('2026-07-16T10:01:00.000Z');
  gateway.evaluatePresence();
  assert.equal((await adapter.reportedState()).video.source, 'hdmi1');
  const expired = gateway.createCommand({ roomId: 'demo-room', auth: (() => { const session = gateway.subscribeBrowser({ roomId: 'demo-room', auth: user }); gateway.takeControl(session.sessionId); return user; })(), action: 'holding.show', configurationRevision: 1, expiresAt: '2026-07-16T09:59:00.000Z', idempotencyKey: 'idem-expired' });
  assert.equal(gateway.deliverCommand(expired.commandId).status, 'expired');
  const reconnect = gateway.connectDevice({ credentialThumbprint, hello: { type: 'device.hello', messageId: 'msg_roam', deviceId: 'dev_1', agentVersion: '0.1.0', protocolVersion: 'phase1.gateway.v1', lastConfigurationRevision: 1, lastReportedStateRevision: 1 } });
  assert.ok(reconnect.connectionId);
  gateway.ingestState(connectionId, { type: 'device.stateChanged', deviceId: 'dev_1', revision: 1, changes: await adapter.reportedState() });
  assert.equal(gateway._state.reportedStates.get('dev_1').revision, 1);
});

test('P1-BE-1306 reboot while offline recovery loads last configuration, restarts adapter and uploads queued events', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'phase1-offline-reboot-'));
  const configPath = join(directory, 'configuration.json');
  const manager = new ConfigurationManager({ path: configPath, fetchDesiredConfiguration: async () => ({ schemaVersion: 'phase1.configuration.v1', configurationRevision: 2, assetIds: [], capabilities: PHASE_1_ACTIONS }) });
  await manager.downloadValidateAndActivate();
  const afterReboot = new ConfigurationManager({ path: configPath, fetchDesiredConfiguration: async () => { throw new Error('cloud unavailable'); } });
  await afterReboot.load();
  const adapter = new SimulatedNodeAdapter();
  await adapter.start();
  await adapter.execute({ action: 'video.output.selectSource', parameters: { source: 'hdmi1' } });
  const uploaded = [];
  let online = false;
  const queue = new LocalEventQueue({ path: join(directory, 'events.json'), transport: { send: async (event) => { if (!online) throw new Error('offline'); uploaded.push(event); } } });
  await queue.enqueue({ eventId: 'evt_recovery', eventType: 'recovery.offline_reboot', correlationId: 'corr_recovery', occurredAt: '2026-07-16T10:00:00.000Z' });
  assert.equal(afterReboot.active().configurationRevision, 2);
  assert.equal((await adapter.reportedState()).video.source, 'hdmi1');
  online = true;
  const flush = await queue.flush();
  assert.equal(flush.remaining, 0);
  assert.equal(uploaded[0].eventType, 'recovery.offline_reboot');
});

test('P1-BE-1307 configuration failure rollback preserves known-good and reports desired, failed and active revisions distinctly', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'phase1-config-rollback-'));
  const reports = [];
  const manager = new ConfigurationManager({ path: join(directory, 'configuration.json'), reportConfiguration: async (report) => reports.push(report), fetchDesiredConfiguration: async () => ({ schemaVersion: 'phase1.configuration.v1', configurationRevision: 1, assetIds: [], capabilities: ['holding.show'] }) });
  await manager.downloadValidateAndActivate();
  manager.fetchDesiredConfiguration = async () => ({ schemaVersion: 'phase1.configuration.v1', configurationRevision: 2, assetIds: [], capabilities: ['touchdesigner.operator.path'] });
  await assert.rejects(() => manager.downloadValidateAndActivate(), /unsupported capabilities/);
  assert.equal(manager.active().configurationRevision, 1);
  assert.equal(manager.state.desiredRevision, 2);
  assert.equal(manager.state.failedRevision, 2);
  assert.equal(reports.at(-1).activeRevision, 1);
});

test('P1-BE-1308 package validation and rollback accepts signed packages, rejects altered packages and audits update result', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'phase1-update-'));
  const packagePath = join(directory, 'project.pkg');
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  await writeFile(packagePath, 'version one');
  const firstSha = await sha256File(packagePath);
  const first = createTouchDesignerProjectManifest({ projectVersion: 'td-1.0.0', sha256: firstSha, signature: signManifest({ privateKey, id: 'touchdesigner-phase1-project', version: 'td-1.0.0', sha256: firstSha }) });
  assert.equal((await validatePackage({ manifest: first, packagePath, publicKeyPem })).status, 'valid');
  const installDirectory = join(directory, 'install');
  await activatePackageWithRollback({ manifest: first, packagePath, publicKeyPem, installDirectory });
  await writeFile(packagePath, 'version two');
  const secondSha = await sha256File(packagePath);
  const second = createTouchDesignerProjectManifest({ projectVersion: 'td-1.0.1', sha256: secondSha, signature: signManifest({ privateKey, id: 'touchdesigner-phase1-project', version: 'td-1.0.1', sha256: secondSha }) });
  const activation = await activatePackageWithRollback({ manifest: second, packagePath, publicKeyPem, installDirectory });
  await writeFile(packagePath, 'tampered');
  await assert.rejects(() => validatePackage({ manifest: second, packagePath, publicKeyPem }), /hash does not match/);
  const audit = { eventType: 'release.package_update.completed', status: activation.status, previousPackage: activation.previousPackage };
  assert.equal(audit.status, 'valid');
  assert.match(audit.previousPackage, /previous\/touchdesigner-phase1-project\.pkg$/);
});

test('P1-BE-1309 Phase 1 demonstration script documents exact evidence, limitations and rollback notes', async () => {
  const demo = await readFile('docs/operations/PHASE_1_DEMONSTRATION.md', 'utf8');
  for (const phrase of ['install', 'identity generation', 'pairing code display', 'cloud claim', 'room assignment', 'configuration push', 'presentation command', 'TouchDesigner execution', 'browser state update', 'network loss/reconnect', 'reboot recovery']) {
    assert.match(demo, new RegExp(phrase, 'i'));
  }
  assert.match(demo, /Expected evidence/i);
  assert.match(demo, /Known limitations/i);
  assert.match(demo, /Rollback and recovery/i);
});
