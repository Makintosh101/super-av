import assert from 'node:assert/strict';
import test from 'node:test';
import { createGatewayService } from '../cloud/gateway/gateway-service.mjs';
import { createProvisioningService } from '../cloud/provisioning/provisioning-service.mjs';
import { createPhase1WebAppScreens, WebAppScreenError } from '../cloud/web-app-screens.mjs';

const now = () => new Date('2026-07-15T00:00:00Z');
const admin = { userId: 'admin-1', companyId: 'blue-elephant-phase1', role: 'admin' };
const technician = { userId: 'tech-1', companyId: 'blue-elephant-phase1', role: 'technician' };
const user = { userId: 'user-1', companyId: 'blue-elephant-phase1', role: 'user' };
const otherCompany = { userId: 'other-1', companyId: 'other-company', role: 'admin' };
const input = {
  deviceId: 'dev-phase1-001',
  installationId: 'install-001',
  publicKey: 'public-key',
  fingerprint: 'abcdef123456',
  bootstrapVersion: '1.2.3',
  commissioning: { reportedHostname: 'phase1-node', reportedModel: 'nuc', shortFingerprint: 'abc123', localIp: '192.168.1.20', secret: 'hidden' }
};

function createServices() {
  const provisioningService = createProvisioningService({ now });
  const gatewayService = createGatewayService({ now });
  const screens = createPhase1WebAppScreens({ provisioningService, gatewayService, now });
  return { provisioningService, gatewayService, screens };
}

function assignedConnectedServices() {
  const services = createServices();
  services.provisioningService.registerDevice(input);
  const pairing = services.provisioningService.createPairingSession({ deviceId: input.deviceId });
  services.provisioningService.claimPairingSession(pairing.code, admin);
  services.provisioningService.assignRoom({ deviceId: input.deviceId }, admin);
  services.gatewayService.registerAssignedDevice({ deviceId: input.deviceId, companyId: 'blue-elephant-phase1', roomId: 'demo-room', credentialThumbprint: 'thumb-1', desiredConfigurationRevision: 7 });
  const welcome = services.gatewayService.connectDevice({ scheme: 'wss', credentialThumbprint: 'thumb-1', hello: { type: 'device.hello', messageId: 'hello-1', deviceId: input.deviceId, agentVersion: '1.2.3', protocolVersion: '1.0' } });
  services.gatewayService.receiveHeartbeat(welcome.connectionId, { type: 'device.heartbeat', messageId: 'hb-1', sentAt: now().toISOString(), agentUptimeSeconds: 10, adapterHealth: { adapterVersions: { touchdesigner: '0.1.0', systemHealth: '0.1.0' } } });
  return { ...services, welcome };
}

test('renders admin unclaimed-device queue with limited metadata and duplicate clarity', () => {
  const { provisioningService, screens } = createServices();
  provisioningService.registerDevice(input);
  const queue = screens.unclaimedDeviceQueue(admin);
  assert.equal(queue.type, 'admin.unclaimedDeviceQueue');
  assert.deepEqual(queue.data.devices[0], {
    deviceId: input.deviceId,
    name: 'phase1-node',
    model: 'nuc',
    firstSeenAt: '2026-07-15T00:00:00.000Z',
    shortFingerprint: 'abc123',
    localIp: '192.168.1.20',
    agentVersion: '1.2.3',
    duplicatePendingRegistrations: 1
  });
  assert.equal(queue.data.devices[0].secret, undefined);
  assert.throws(() => screens.unclaimedDeviceQueue(user), (error) => error instanceof WebAppScreenError && error.code === 'AUTH-3001');
});

test('renders pairing claim flow with confirmation phrase and explicit pairing errors', () => {
  const { provisioningService, screens } = createServices();
  provisioningService.registerDevice(input);
  const pairing = provisioningService.createPairingSession({ deviceId: input.deviceId });
  const start = screens.pairingClaimFlow(admin);
  assert.equal(start.data.step, 'enter_code_or_qr_token');
  const preview = screens.pairingClaimFlow(admin, { pairingCode: pairing.code, confirm: false });
  assert.equal(preview.data.step, 'confirm_device');
  assert.match(preview.data.confirmationPhrase, /install-001/);
  const claimed = screens.pairingClaimFlow(admin, { pairingCode: pairing.code, confirm: true });
  assert.equal(claimed.data.step, 'claimed');
  assert.equal(claimed.data.certificateIssued, true);
  const replay = screens.pairingClaimFlow(admin, { pairingCode: pairing.code, confirm: true });
  assert.equal(replay.data.errors[0].code, 'PAIRING-2001');
});

test('renders room assignment with current assignment and active configuration revision', () => {
  const { screens } = assignedConnectedServices();
  const assignment = screens.roomAssignmentScreen(technician, { deviceId: input.deviceId, assign: false });
  assert.equal(assignment.type, 'room.assignment');
  assert.equal(assignment.data.devices[0].currentAssignment.roomId, 'demo-room');
  assert.equal(assignment.data.devices[0].activeConfigurationRevision, 7);
});

test('renders device diagnostics with constrained support actions only', () => {
  const { gatewayService, screens, welcome } = assignedConnectedServices();
  gatewayService.ingestHealth(welcome.connectionId, { type: 'device.healthChanged', messageId: 'health-1', deviceId: input.deviceId, status: 'degraded', issues: [{ code: 'TOUCHDESIGNER-8001', severity: 'Error', firstObservedAt: now().toISOString() }] });
  const detail = screens.deviceDetailDiagnosticsScreen(admin, { deviceId: input.deviceId, requestedSupportAction: 'remote.shell' });
  assert.equal(detail.data.onlineStatus, 'online');
  assert.equal(detail.data.health, 'degraded');
  assert.equal(detail.data.agentVersion, '1.2.3');
  assert.equal(detail.data.adapterVersions.touchdesigner, '0.1.0');
  assert.equal(detail.data.recentErrors[0].code, 'TOUCHDESIGNER-8001');
  assert.equal(detail.data.requestedSupportAction.allowed, false);
  assert.equal(detail.data.remoteShellAvailable, false);
  assert.equal(detail.data.arbitraryFileAccessAvailable, false);
  assert.throws(() => screens.deviceDetailDiagnosticsScreen(otherCompany, { deviceId: input.deviceId }), (error) => error.code === 'AUTH-3001');
});

test('renders room control page with logical labels, active controller and command status', () => {
  const { gatewayService, screens } = assignedConnectedServices();
  const session = gatewayService.subscribeBrowser({ roomId: 'demo-room', auth: user });
  gatewayService.takeControl(session.sessionId);
  const command = gatewayService.createCommand({ roomId: 'demo-room', auth: user, action: 'audio.master.setVolume', parameters: { volume: 0.5 }, configurationRevision: 7, expiresAt: '2026-07-15T00:01:00Z', idempotencyKey: 'idem-ui' });
  const page = screens.roomControlPage(user, { roomId: 'demo-room' });
  assert.equal(page.data.controls.every((control) => !control.action.includes('TouchDesigner') && control.visible), true);
  assert.equal(page.data.commandStatus.commandId, command.commandId);
  assert.equal(page.data.commandStatus.status, 'queued');
  assert.equal(page.data.activeController.userId, user.userId);
  assert.equal(page.data.serverAuthorisationRequired, true);
});

test('renders event log in UTC storage order without sensitive values', () => {
  const { gatewayService, screens, welcome } = assignedConnectedServices();
  gatewayService.ingestHealth(welcome.connectionId, { type: 'device.healthChanged', messageId: 'health-2', deviceId: input.deviceId, status: 'healthy', issues: [{ code: 'OK', severity: 'Info', firstObservedAt: now().toISOString(), secretToken: 'hidden' }] });
  const log = screens.eventLogView(admin, { roomId: 'demo-room' });
  assert.equal(log.type, 'event.log');
  assert.equal(log.data.storageTimeStandard, 'UTC');
  assert.ok(log.data.events.some((event) => event.type === 'device.claimed'));
  assert.ok(log.data.events.some((event) => event.type === 'health.changed'));
  assert.equal(JSON.stringify(log).includes('hidden'), false);
});
