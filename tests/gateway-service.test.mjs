import assert from 'node:assert/strict';
import test from 'node:test';
import { createGatewayService, GatewayError } from '../cloud/gateway/gateway-service.mjs';

const device = { deviceId: 'dev-phase1-001', companyId: 'blue-elephant-phase1', roomId: 'demo-room', credentialThumbprint: 'thumb-001', desiredConfigurationRevision: 43 };
const hello = { type: 'device.hello', messageId: 'msg-hello', deviceId: device.deviceId, agentVersion: '1.0.0', protocolVersion: '1.0', lastConfigurationRevision: 42, lastReportedStateRevision: 880 };
const admin = { userId: 'admin-1', companyId: 'blue-elephant-phase1', role: 'admin' };
const user = { userId: 'user-1', companyId: 'blue-elephant-phase1', role: 'user' };

function connectedService() {
  const service = createGatewayService({ now: () => new Date('2026-07-15T00:00:00Z') });
  service.registerAssignedDevice(device);
  const welcome = service.connectDevice({ scheme: 'wss', credentialThumbprint: 'thumb-001', hello });
  return { service, welcome };
}

test('authenticates device WebSocket handshake and rejects plaintext or invalid credentials', () => {
  const service = createGatewayService({ now: () => new Date('2026-07-15T00:00:00Z') });
  service.registerAssignedDevice(device);
  assert.throws(() => service.connectDevice({ scheme: 'ws', credentialThumbprint: 'thumb-001', hello }), (error) => error instanceof GatewayError && error.code === 'GATEWAY-4001');
  assert.throws(() => service.connectDevice({ scheme: 'wss', credentialThumbprint: 'wrong', hello }), (error) => error.code === 'AUTH-3001');

  const welcome = service.connectDevice({ scheme: 'wss', credentialThumbprint: 'thumb-001', hello });
  assert.equal(welcome.type, 'server.welcome');
  assert.equal(welcome.heartbeatIntervalSeconds, 20);
  assert.equal(welcome.desiredConfigurationRevision, 43);
  assert.equal(service._state.devices.get(device.deviceId).presence.status, 'online');
});

test('tracks heartbeat presence and broadcasts offline transition after stale heartbeat', () => {
  let current = new Date('2026-07-15T00:00:00Z');
  const service = createGatewayService({ now: () => current, heartbeatIntervalSeconds: 20 });
  service.registerAssignedDevice(device);
  const welcome = service.connectDevice({ scheme: 'wss', credentialThumbprint: 'thumb-001', hello });
  service.receiveHeartbeat(welcome.connectionId, { type: 'device.heartbeat', messageId: 'msg-hb', sentAt: current.toISOString(), agentUptimeSeconds: 1, adapterHealth: 'healthy' });
  current = new Date('2026-07-15T00:00:45Z');
  service.evaluatePresence();
  assert.equal(service._state.devices.get(device.deviceId).presence.status, 'offline');
  assert.equal(service._state.browserBroadcasts.at(-1).type, 'device.presenceChanged');
});

test('represents browser room sessions with one active controller and admin takeover', () => {
  const { service } = connectedService();
  const userSession = service.subscribeBrowser({ roomId: 'demo-room', auth: user });
  const activeUser = service.takeControl(userSession.sessionId);
  assert.equal(activeUser.role, 'user');
  const adminSession = service.subscribeBrowser({ roomId: 'demo-room', auth: admin });
  const activeAdmin = service.takeControl(adminSession.sessionId);
  assert.equal(activeAdmin.role, 'admin');
  assert.throws(() => service.takeControl(userSession.sessionId), (error) => error.code === 'AUTH-3001');
});

test('creates authorised logical commands, delivers once, and tracks acknowledgement and completion', () => {
  const { service, welcome } = connectedService();
  const session = service.subscribeBrowser({ roomId: 'demo-room', auth: admin });
  service.takeControl(session.sessionId);
  const expiresAt = '2026-07-15T00:01:00Z';
  const command = service.createCommand({ roomId: 'demo-room', auth: admin, action: 'audio.master.setVolume', parameters: { volume: 0.75 }, configurationRevision: 43, expiresAt, idempotencyKey: 'idem-1' });
  const duplicate = service.createCommand({ roomId: 'demo-room', auth: admin, action: 'audio.master.setVolume', parameters: { volume: 0.75 }, configurationRevision: 43, expiresAt, idempotencyKey: 'idem-1' });
  assert.equal(duplicate.commandId, command.commandId);
  assert.equal(service._state.outboundMessages.at(-1).message.command.commandId, command.commandId);

  const acknowledged = service.acknowledgeCommand(welcome.connectionId, { type: 'device.commandAcknowledged', commandId: command.commandId, status: 'accepted' });
  assert.equal(acknowledged.status, 'accepted');
  const completed = service.completeCommand(welcome.connectionId, { type: 'device.commandCompleted', commandId: command.commandId, status: 'succeeded', reportedStateRevision: 881 });
  assert.equal(completed.status, 'succeeded');
  assert.equal(service._state.auditEvents.at(-1).eventType, 'command.completed');
});

test('rejects unknown capabilities, invalid values and commands without active controller', () => {
  const { service } = connectedService();
  assert.throws(() => service.createCommand({ roomId: 'demo-room', auth: admin, action: 'executeShellCommand', expiresAt: '2026-07-15T00:01:00Z', idempotencyKey: 'idem-shell' }), (error) => error.code === 'COMMAND-5001');
  const session = service.subscribeBrowser({ roomId: 'demo-room', auth: admin });
  service.takeControl(session.sessionId);
  assert.throws(() => service.createCommand({ roomId: 'demo-room', auth: admin, action: 'audio.master.setVolume', parameters: { volume: 2 }, expiresAt: '2026-07-15T00:01:00Z', idempotencyKey: 'idem-bad-volume' }), (error) => error.code === 'COMMAND-5001');
});

test('ingests monotonically increasing reported state and rejects stale revisions', () => {
  const { service, welcome } = connectedService();
  const state = service.ingestState(welcome.connectionId, { type: 'device.stateChanged', messageId: 'msg-state-1', deviceId: device.deviceId, revision: 881, changes: { 'video.mainOutput.source': 'presentation' } });
  assert.equal(state.revision, 881);
  assert.equal(state.state['video.mainOutput.source'], 'presentation');
  assert.throws(() => service.ingestState(welcome.connectionId, { type: 'device.stateChanged', messageId: 'msg-state-old', deviceId: device.deviceId, revision: 880, changes: {} }), (error) => error.code === 'STATE-6002');
});

test('ingests health events with retention metadata and validates severity', () => {
  const { service, welcome } = connectedService();
  const health = service.ingestHealth(welcome.connectionId, { type: 'device.healthChanged', messageId: 'msg-health', deviceId: device.deviceId, status: 'degraded', issues: [{ code: 'TOUCHDESIGNER-8001', severity: 'Warning', firstObservedAt: '2026-07-15T00:00:00Z' }] });
  assert.equal(health.status, 'degraded');
  assert.equal(health.retention.detailedTelemetryDays, 30);
  assert.throws(() => service.ingestHealth(welcome.connectionId, { type: 'device.healthChanged', messageId: 'msg-health-bad', deviceId: device.deviceId, status: 'degraded', issues: [{ code: 'BAD', severity: 'Notice', firstObservedAt: '2026-07-15T00:00:00Z' }] }), (error) => error.code === 'HEALTH-7002');
});
