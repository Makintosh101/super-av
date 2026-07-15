import { randomUUID } from 'node:crypto';

const HEARTBEAT_INTERVAL_SECONDS = 20;
const ALLOWED_ACTIONS = new Set([
  'holding.show',
  'holding.hide',
  'video.output.selectSource',
  'audio.microphones.setMuted',
  'audio.master.setVolume',
  'preset.activate',
  'system.getStatus',
  'system.restart'
]);
const CONTROLLER_PRIORITY = { user: 1, technician: 2, admin: 3 };
const VALID_SEVERITIES = new Set(['Info', 'Warning', 'Error', 'Critical']);
const VALID_HEALTH = new Set(['healthy', 'degraded', 'offline']);

export class GatewayError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'GatewayError';
    this.code = code;
    this.details = details;
  }
}

export function createGatewayService({ now = () => new Date(), heartbeatIntervalSeconds = HEARTBEAT_INTERVAL_SECONDS } = {}) {
  const devices = new Map();
  const rooms = new Map();
  const deviceConnections = new Map();
  const browserSessions = new Map();
  const commands = new Map();
  const commandsByIdempotency = new Map();
  const reportedStates = new Map();
  const healthEvents = [];
  const auditEvents = [];
  const outboundMessages = [];
  const browserBroadcasts = [];

  function registerAssignedDevice(device) {
    requireFields(device, ['deviceId', 'companyId', 'roomId', 'credentialThumbprint']);
    devices.set(device.deviceId, {
      desiredConfigurationRevision: 1,
      capabilities: [...ALLOWED_ACTIONS],
      suspended: false,
      revoked: false,
      retired: false,
      ...device
    });
    if (!rooms.has(device.roomId)) rooms.set(device.roomId, { roomId: device.roomId, companyId: device.companyId, activeController: null, desiredStateRevision: 1 });
    return devices.get(device.deviceId);
  }

  function connectDevice({ scheme = 'wss', credentialThumbprint, hello }) {
    if (scheme !== 'wss') throw new GatewayError('GATEWAY-4001', 'Device gateway requires secure WebSocket transport.');
    requireFields(hello, ['type', 'messageId', 'deviceId', 'agentVersion', 'protocolVersion']);
    if (hello.type !== 'device.hello') throw new GatewayError('GATEWAY-4002', 'Device connection must start with device.hello.');
    const device = devices.get(hello.deviceId);
    if (!device) throw new GatewayError('AUTH-3001', 'Device is not registered for gateway access.');
    if (device.credentialThumbprint !== credentialThumbprint || device.suspended || device.revoked || device.retired) throw new GatewayError('AUTH-3001', 'Device credential is invalid for gateway access.');
    const connection = {
      connectionId: `conn_${randomUUID()}`,
      deviceId: hello.deviceId,
      authenticated: true,
      connectedAt: now().toISOString(),
      lastHeartbeatAt: now().toISOString(),
      agentVersion: hello.agentVersion,
      protocolVersion: hello.protocolVersion,
      lastConfigurationRevision: hello.lastConfigurationRevision ?? null,
      lastReportedStateRevision: hello.lastReportedStateRevision ?? null,
      online: true
    };
    deviceConnections.set(connection.connectionId, connection);
    setPresence(device.deviceId, 'online', 'device.connected');
    const welcome = { type: 'server.welcome', messageId: `msg_${randomUUID()}`, connectionId: connection.connectionId, serverTime: now().toISOString(), heartbeatIntervalSeconds, desiredConfigurationRevision: device.desiredConfigurationRevision };
    outboundMessages.push({ connectionId: connection.connectionId, message: welcome });
    return welcome;
  }

  function receiveHeartbeat(connectionId, heartbeat) {
    const connection = authenticatedConnection(connectionId);
    requireFields(heartbeat, ['type', 'messageId', 'sentAt', 'agentUptimeSeconds', 'adapterHealth']);
    if (heartbeat.type !== 'device.heartbeat') throw new GatewayError('GATEWAY-4002', 'Expected device.heartbeat.');
    connection.lastHeartbeatAt = now().toISOString();
    connection.adapterHealth = heartbeat.adapterHealth;
    setPresence(connection.deviceId, 'online', 'device.heartbeat');
    return presenceView(connection.deviceId);
  }

  function evaluatePresence() {
    const staleMs = heartbeatIntervalSeconds * 2 * 1000;
    for (const connection of deviceConnections.values()) {
      if (connection.online && now() - new Date(connection.lastHeartbeatAt) > staleMs) {
        connection.online = false;
        setPresence(connection.deviceId, 'offline', 'device.heartbeat_lost');
      }
    }
  }

  function subscribeBrowser({ roomId, auth }) {
    const room = authoriseRoom(roomId, auth);
    const session = { sessionId: `browser_${randomUUID()}`, roomId, auth: { userId: auth.userId, role: auth.role, companyId: auth.companyId }, subscribedAt: now().toISOString() };
    browserSessions.set(session.sessionId, session);
    broadcast(roomId, 'browser.roomSubscribed', { sessionId: session.sessionId, presence: devicesForRoom(roomId).map((device) => presenceView(device.deviceId)), activeController: room.activeController });
    return { ...session, activeController: room.activeController };
  }

  function takeControl(sessionId) {
    const session = browserSessions.get(sessionId);
    if (!session) throw new GatewayError('AUTH-3001', 'Browser session is not active.');
    const room = rooms.get(session.roomId);
    const current = room.activeController;
    if (!current || priority(session.auth.role) >= priority(current.role)) {
      room.activeController = { sessionId, userId: session.auth.userId, role: session.auth.role, takenAt: now().toISOString() };
      broadcast(session.roomId, 'room.controllerChanged', { activeController: room.activeController });
      return room.activeController;
    }
    throw new GatewayError('AUTH-3001', 'An active controller with higher priority owns the room session.');
  }

  function createCommand({ roomId, auth, action, parameters = {}, configurationRevision, expiresAt, idempotencyKey }) {
    requireFields({ roomId, action, expiresAt, idempotencyKey }, ['roomId', 'action', 'expiresAt', 'idempotencyKey']);
    const room = authoriseRoom(roomId, auth);
    if (commandsByIdempotency.has(idempotencyKey)) return commands.get(commandsByIdempotency.get(idempotencyKey));
    if (!ALLOWED_ACTIONS.has(action)) throw new GatewayError('COMMAND-5001', 'Command action is not a logical Phase 1 capability.', { action });
    validateParameters(action, parameters);
    if (!room.activeController || room.activeController.userId !== auth.userId) throw new GatewayError('AUTH-3001', 'An active room controller session is required before creating commands.');
    const device = devicesForRoom(roomId)[0];
    if (!device) throw new GatewayError('COMMAND-5002', 'Room has no assigned device for command delivery.');
    if (!device.capabilities.includes(action)) throw new GatewayError('NODE-1001', 'The assigned node does not expose the required capability.', { capability: action });
    const command = { commandId: `cmd_${randomUUID()}`, roomId, deviceId: device.deviceId, action, parameters, status: 'queued', idempotencyKey, configurationRevision, issuedByUserId: auth.userId, issuedAt: now().toISOString(), expiresAt };
    commands.set(command.commandId, command);
    commandsByIdempotency.set(idempotencyKey, command.commandId);
    audit('command.created', auth, 'command', command.commandId, { action, roomId, deviceId: device.deviceId });
    deliverCommand(command.commandId);
    return command;
  }

  function acknowledgeCommand(connectionId, message) {
    const connection = authenticatedConnection(connectionId);
    const command = commandForDevice(connection.deviceId, message.commandId);
    command.status = message.status === 'accepted' ? 'accepted' : 'rejected';
    command.acknowledgedAt = now().toISOString();
    broadcast(command.roomId, 'command.statusChanged', command);
    return command;
  }

  function completeCommand(connectionId, message) {
    const connection = authenticatedConnection(connectionId);
    const command = commandForDevice(connection.deviceId, message.commandId);
    command.status = message.status === 'succeeded' ? 'succeeded' : 'failed';
    command.reportedStateRevision = message.reportedStateRevision ?? null;
    command.completedAt = now().toISOString();
    audit('command.completed', null, 'command', command.commandId, { status: command.status });
    broadcast(command.roomId, 'command.statusChanged', command);
    return command;
  }

  function ingestState(connectionId, message) {
    const connection = authenticatedConnection(connectionId);
    if (message.type !== 'device.stateChanged' || message.deviceId !== connection.deviceId) throw new GatewayError('STATE-6001', 'State message does not match the authenticated device connection.');
    const previous = reportedStates.get(message.deviceId);
    if (previous && message.revision <= previous.revision) throw new GatewayError('STATE-6002', 'Reported state revision is stale.', { currentRevision: previous.revision, receivedRevision: message.revision });
    const device = devices.get(message.deviceId);
    const record = { deviceId: message.deviceId, roomId: device.roomId, revision: message.revision, state: { ...(previous?.state ?? {}), ...message.changes }, reportedAt: now().toISOString() };
    reportedStates.set(message.deviceId, record);
    broadcast(device.roomId, 'device.stateChanged', record);
    return record;
  }

  function ingestHealth(connectionId, message) {
    const connection = authenticatedConnection(connectionId);
    if (message.type !== 'device.healthChanged' || message.deviceId !== connection.deviceId) throw new GatewayError('HEALTH-7001', 'Health message does not match the authenticated device connection.');
    if (!VALID_HEALTH.has(message.status)) throw new GatewayError('HEALTH-7002', 'Health status is not valid.');
    for (const issue of message.issues ?? []) if (!VALID_SEVERITIES.has(issue.severity) || !issue.code || !issue.firstObservedAt) throw new GatewayError('HEALTH-7002', 'Health issue requires code, valid severity and first observed time.');
    const device = devices.get(message.deviceId);
    const record = { deviceId: message.deviceId, roomId: device.roomId, status: message.status, issues: message.issues ?? [], observedAt: now().toISOString(), retention: { detailedTelemetryDays: 30, aggregatedMetricsMonths: 12 } };
    healthEvents.push(record);
    broadcast(device.roomId, 'device.healthChanged', record);
    return record;
  }

  function deliverCommand(commandId) {
    const command = commands.get(commandId);
    if (!command) throw new GatewayError('COMMAND-5002', 'Command not found.');
    if (new Date(command.expiresAt) <= now()) { command.status = 'expired'; return command; }
    const connection = [...deviceConnections.values()].find((candidate) => candidate.deviceId === command.deviceId && candidate.online && candidate.authenticated);
    if (!connection) return command;
    const message = { type: 'device.command', messageId: `msg_${randomUUID()}`, command: { commandId: command.commandId, action: command.action, parameters: command.parameters, expiresAt: command.expiresAt, configurationRevision: command.configurationRevision } };
    outboundMessages.push({ connectionId: connection.connectionId, message });
    command.deliveredAt = now().toISOString();
    return command;
  }

  function setPresence(deviceId, status, eventType) {
    const device = devices.get(deviceId);
    if (!device) return;
    device.presence = { status, updatedAt: now().toISOString() };
    healthEvents.push({ deviceId, roomId: device.roomId, status: status === 'online' ? 'healthy' : 'offline', issues: [], observedAt: now().toISOString(), eventType });
    broadcast(device.roomId, 'device.presenceChanged', presenceView(deviceId));
  }

  function authenticatedConnection(connectionId) {
    const connection = deviceConnections.get(connectionId);
    if (!connection?.authenticated) throw new GatewayError('AUTH-3001', 'Authenticated device WebSocket connection is required.');
    const device = devices.get(connection.deviceId);
    if (device.suspended || device.revoked || device.retired) throw new GatewayError('AUTH-3001', 'Device is not allowed to use the gateway.');
    return connection;
  }

  function commandForDevice(deviceId, commandId) {
    const command = commands.get(commandId);
    if (!command || command.deviceId !== deviceId) throw new GatewayError('COMMAND-5002', 'Command is not pending for this device.');
    return command;
  }

  function authoriseRoom(roomId, auth) {
    const room = rooms.get(roomId);
    if (!room || auth?.companyId !== room.companyId || !['user', 'technician', 'admin'].includes(auth.role)) throw new GatewayError('AUTH-3001', 'Authenticated room access is required.');
    return room;
  }

  function broadcast(roomId, type, payload) {
    browserBroadcasts.push({ roomId, type, payload, sentAt: now().toISOString() });
  }

  function audit(eventType, auth, targetType, targetId, details) { auditEvents.push({ eventType, actorUserId: auth?.userId ?? null, companyId: auth?.companyId ?? null, targetType, targetId, details, occurredAt: now().toISOString() }); }
  function devicesForRoom(roomId) { return [...devices.values()].filter((device) => device.roomId === roomId); }
  function presenceView(deviceId) { const device = devices.get(deviceId); return { deviceId, roomId: device.roomId, status: device.presence?.status ?? 'offline', updatedAt: device.presence?.updatedAt ?? null }; }

  return { registerAssignedDevice, connectDevice, receiveHeartbeat, evaluatePresence, subscribeBrowser, takeControl, createCommand, deliverCommand, acknowledgeCommand, completeCommand, ingestState, ingestHealth, _state: { devices, rooms, deviceConnections, browserSessions, commands, reportedStates, healthEvents, auditEvents, outboundMessages, browserBroadcasts } };
}

function requireFields(input, fields) { for (const field of fields) if (!input?.[field]) throw new GatewayError('GATEWAY-4002', `Missing required field: ${field}.`); }
function priority(role) { return CONTROLLER_PRIORITY[role] ?? 0; }
function validateParameters(action, parameters) {
  if (action === 'audio.master.setVolume' && (typeof parameters.volume !== 'number' || parameters.volume < 0 || parameters.volume > 1)) throw new GatewayError('COMMAND-5001', 'Master volume must be between 0 and 1.');
  if (action === 'audio.microphones.setMuted' && typeof parameters.muted !== 'boolean') throw new GatewayError('COMMAND-5001', 'Microphone muted value must be boolean.');
  if (action === 'video.output.selectSource' && typeof parameters.source !== 'string') throw new GatewayError('COMMAND-5001', 'Video source must be provided.');
  if (action === 'preset.activate' && typeof parameters.presetId !== 'string') throw new GatewayError('COMMAND-5001', 'Preset ID must be provided.');
}
