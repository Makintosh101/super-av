const PHASE1_COMPANY = 'blue-elephant-phase1';
const PHASE1_ROOM = 'demo-room';
const CONTROL_ACTIONS = [
  { action: 'video.output.selectSource', label: 'Presentation source', parameters: { source: 'presentation' } },
  { action: 'holding.show', label: 'Show holding screen', parameters: {} },
  { action: 'holding.hide', label: 'Hide holding screen', parameters: {} },
  { action: 'audio.microphones.setMuted', label: 'Microphone mute', parameters: { muted: true } },
  { action: 'audio.master.setVolume', label: 'Master volume', parameters: { volume: 0.75 } }
];
const SUPPORT_ACTIONS = new Set(['diagnostic.bundle.export', 'system.restart']);
const SENSITIVE_KEYS = [/secret/i, /private/i, /token/i, /password/i, /signedUrl/i, /protectedUrl/i];

export class WebAppScreenError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'WebAppScreenError';
    this.code = code;
    this.details = details;
  }
}

export function createPhase1WebAppScreens({ provisioningService, gatewayService, configurationService = null, now = () => new Date() }) {
  if (!provisioningService?._state || !gatewayService?._state) throw new WebAppScreenError('WEB-9001', 'Provisioning and gateway state are required for Phase 1 screens.');

  function unclaimedDeviceQueue(auth) {
    requireAdminOrTechnician(auth);
    return screen('admin.unclaimedDeviceQueue', auth, {
      devices: [...provisioningService._state.devices.values()]
        .filter((device) => device.status === 'unclaimed')
        .map((device) => {
          const registration = registrationForDevice(device.deviceId);
          return {
            deviceId: device.deviceId,
            name: registration?.commissioning?.reportedHostname ?? device.deviceId,
            model: registration?.commissioning?.reportedModel ?? 'unknown',
            firstSeenAt: registration?.requestedAt ?? null,
            shortFingerprint: registration?.commissioning?.shortFingerprint ?? shortFingerprint(device.fingerprint),
            localIp: registration?.commissioning?.localIp ?? null,
            agentVersion: registration?.bootstrapVersion ?? null,
            duplicatePendingRegistrations: duplicatePendingCount(device.deviceId, device.fingerprint)
          };
        })
    });
  }

  function pairingClaimFlow(auth, { pairingCode = null, qrToken = null, confirm = false } = {}) {
    requireAdminOrTechnician(auth);
    if (!pairingCode && !qrToken) return screen('pairing.claimFlow', auth, { step: 'enter_code_or_qr_token', errors: [] });
    if (qrToken && !pairingCode) return screen('pairing.claimFlow', auth, { step: 'enter_pairing_code', qrTokenAccepted: true, errors: [] });
    try {
      const result = provisioningService.claimPairingSession(pairingCode, auth, { confirm });
      if (result.status === 'confirmation_required') {
        return screen('pairing.claimFlow', auth, {
          step: 'confirm_device',
          deviceId: result.deviceId,
          confirmationPhrase: `Confirm ${result.confirmation.installationId} / ${result.confirmation.fingerprint}`,
          confirmation: result.confirmation,
          errors: []
        });
      }
      return screen('pairing.claimFlow', auth, { step: 'claimed', deviceId: result.deviceId, status: result.status, certificateIssued: Boolean(result.certificate?.certificateThumbprint), errors: [] });
    } catch (error) {
      return screen('pairing.claimFlow', auth, { step: 'error', errors: [explicitError(error)] });
    }
  }

  function roomAssignmentScreen(auth, { deviceId = null, roomId = PHASE1_ROOM, assign = false } = {}) {
    requireAdminOrTechnician(auth);
    let assignment = null;
    let errors = [];
    if (assign && deviceId) {
      try { assignment = provisioningService.assignRoom({ deviceId, roomId }, auth); }
      catch (error) { errors = [explicitError(error)]; }
    }
    const devices = [...provisioningService._state.devices.values()]
      .filter((device) => device.companyId === auth.companyId && ['claimed', 'assigned'].includes(device.status))
      .map((device) => ({
        deviceId: device.deviceId,
        status: device.status,
        currentAssignment: device.roomId ? { roomId: device.roomId } : null,
        activeConfigurationRevision: gatewayService._state.devices.get(device.deviceId)?.desiredConfigurationRevision ?? null
      }));
    return screen('room.assignment', auth, { roomId, assignment, devices, errors });
  }

  function deviceDetailDiagnosticsScreen(auth, { deviceId, requestedSupportAction = null } = {}) {
    requireAdminOrTechnician(auth);
    const device = ownedDevice(deviceId, auth);
    const gatewayDevice = gatewayService._state.devices.get(deviceId);
    const recentHealth = [...gatewayService._state.healthEvents.values()].filter((event) => event.deviceId === deviceId).at(-1) ?? null;
    const activeAlerts = [...(gatewayService._state.alerts?.values?.() ?? gatewayService._state.alerts ?? [])].filter((alert) => alert.deviceId === deviceId && alert.status === 'active');
    const recentErrors = [...gatewayService._state.healthEvents.values()].filter((event) => event.deviceId === deviceId).flatMap((event) => event.issues ?? []).filter((issue) => ['Error', 'Critical'].includes(issue.severity)).slice(-5);
    const supportAction = requestedSupportAction ? evaluateSupportAction(requestedSupportAction) : null;
    return screen('device.detailDiagnostics', auth, {
      deviceId,
      onlineStatus: gatewayDevice?.presence?.status ?? 'offline',
      health: recentHealth?.status ?? 'offline',
      agentVersion: activeConnection(deviceId)?.agentVersion ?? null,
      adapterVersions: adapterVersions(deviceId),
      activePreset: gatewayService._state.reportedStates.get(deviceId)?.state?.activePreset ?? null,
      activeConfigurationRevision: gatewayDevice?.desiredConfigurationRevision ?? null,
      recentErrors,
      activeAlerts,
      supportActions: ['diagnostic.bundle.export', 'system.restart'],
      requestedSupportAction: supportAction,
      remoteShellAvailable: false,
      arbitraryFileAccessAvailable: false,
      deviceStatus: device.status
    });
  }

  function roomControlPage(auth, { roomId = PHASE1_ROOM } = {}) {
    requireRoomUser(auth);
    const room = gatewayService._state.rooms.get(roomId);
    if (!room || room.companyId !== auth.companyId) throw new WebAppScreenError('AUTH-3001', 'Authenticated room access is required.');
    const devices = [...gatewayService._state.devices.values()].filter((device) => device.roomId === roomId);
    const latestCommand = [...gatewayService._state.commands.values()].filter((command) => command.roomId === roomId).at(-1) ?? null;
    const canControl = Boolean(room.activeController?.userId === auth.userId);
    return screen('room.control', auth, {
      roomId,
      controls: CONTROL_ACTIONS.map((control) => ({ ...control, enabled: canControl, visible: canControl })),
      status: devices.map((device) => ({ deviceId: device.deviceId, onlineStatus: device.presence?.status ?? 'offline', currentState: gatewayService._state.reportedStates.get(device.deviceId)?.state ?? {} })),
      commandStatus: latestCommand ? { commandId: latestCommand.commandId, status: latestCommand.status, action: latestCommand.action } : null,
      activeController: room.activeController,
      serverAuthorisationRequired: true
    });
  }

  function eventLogView(auth, { roomId = PHASE1_ROOM } = {}) {
    requireRoomUser(auth);
    const events = [
      ...provisioningService._state.auditEvents.map((event) => ({ source: 'provisioning', type: event.action, targetType: event.targetType, targetId: event.targetId, occurredAtUtc: event.occurredAt, details: sanitise(event.metadata) })),
      ...gatewayService._state.auditEvents.map((event) => ({ source: 'gateway', type: event.eventType, targetType: event.targetType, targetId: event.targetId, occurredAtUtc: event.occurredAt, details: sanitise(event.details) })),
      ...gatewayService._state.healthEvents.map((event) => ({ source: 'gateway', type: event.eventType ?? 'health.changed', targetType: 'device', targetId: event.deviceId, occurredAtUtc: event.observedAt, details: sanitise({ status: event.status, issues: event.issues }) }))
    ].filter((event) => event.occurredAtUtc).sort((a, b) => a.occurredAtUtc.localeCompare(b.occurredAtUtc));
    return screen('event.log', auth, { roomId, timezone: 'room-timezone', storageTimeStandard: 'UTC', events });
  }

  function screen(type, auth, data) { return { type, generatedAt: now().toISOString(), companyId: auth.companyId, data }; }
  function registrationForDevice(deviceId) { return [...provisioningService._state.registrations.values()].find((registration) => registration.deviceId === deviceId); }
  function duplicatePendingCount(deviceId, fingerprint) { return [...provisioningService._state.registrations.values()].filter((registration) => registration.deviceId === deviceId && registration.fingerprint === fingerprint && registration.status === 'pending').length; }
  function activeConnection(deviceId) { return [...gatewayService._state.deviceConnections.values()].find((connection) => connection.deviceId === deviceId && connection.online) ?? null; }
  function adapterVersions(deviceId) { return activeConnection(deviceId)?.adapterHealth?.adapterVersions ?? {}; }
  function ownedDevice(deviceId, auth) {
    const device = provisioningService._state.devices.get(deviceId);
    if (!device || device.companyId !== auth.companyId) throw new WebAppScreenError('AUTH-3001', 'Device is not owned by the authenticated company.');
    return device;
  }

  return { unclaimedDeviceQueue, pairingClaimFlow, roomAssignmentScreen, deviceDetailDiagnosticsScreen, roomControlPage, eventLogView };
}

function requireAdminOrTechnician(auth) { if (auth?.companyId !== PHASE1_COMPANY || !['admin', 'technician'].includes(auth.role)) throw new WebAppScreenError('AUTH-3001', 'Admin or technician access is required.'); }
function requireRoomUser(auth) { if (auth?.companyId !== PHASE1_COMPANY || !['admin', 'technician', 'user'].includes(auth.role)) throw new WebAppScreenError('AUTH-3001', 'Authenticated room access is required.'); }
function shortFingerprint(value) { return String(value ?? '').slice(0, 8); }
function explicitError(error) { return { code: error.code ?? 'WEB-9001', message: error.message }; }
function evaluateSupportAction(action) { return SUPPORT_ACTIONS.has(action) ? { action, allowed: true } : { action, allowed: false, error: { code: 'AUTH-3001', message: 'Support action is not permitted in Phase 1.' } }; }
function sanitise(value) {
  if (Array.isArray(value)) return value.map(sanitise);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !SENSITIVE_KEYS.some((pattern) => pattern.test(key))).map(([key, item]) => [key, sanitise(item)]));
}
