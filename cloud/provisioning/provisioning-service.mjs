import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

const ADMIN_ROLES = new Set(['admin', 'technician']);
const PHASE1_COMPANY = 'blue-elephant-phase1';
const PHASE1_ROOM = 'demo-room';
const PAIRING_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export class ProvisioningError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ProvisioningError';
    this.code = code;
    this.details = details;
  }
}

export function createProvisioningService({ now = () => new Date(), qrTokenSecret = 'phase1-dev-secret' } = {}) {
  const registrations = new Map();
  const registrationsByIdentity = new Map();
  const devices = new Map();
  const pairingSessions = new Map();
  const credentials = new Map();
  const roomAssignments = new Map();
  const auditEvents = [];

  function registerDevice(input, headers = {}) {
    requireFields(input, ['deviceId', 'installationId', 'publicKey', 'fingerprint', 'commissioning']);
    requireNoPrivateKey(input);
    const identityKey = `${input.deviceId}:${input.fingerprint}`;
    const existingId = registrationsByIdentity.get(identityKey);
    if (existingId) return registrationView(registrations.get(existingId));

    const registration = {
      registrationId: randomUUID(),
      deviceId: input.deviceId,
      installationId: input.installationId,
      publicKeyFingerprint: sha256(input.publicKey),
      fingerprint: input.fingerprint,
      commissioning: limitedCommissioning(input.commissioning),
      bootstrapVersion: input.bootstrapVersion ?? null,
      status: 'pending',
      requestedAt: now().toISOString(),
      expiresAt: new Date(now().getTime() + 24 * 60 * 60 * 1000).toISOString(),
      correlationId: headers.correlationId ?? null
    };
    registrations.set(registration.registrationId, registration);
    registrationsByIdentity.set(identityKey, registration.registrationId);
    devices.set(input.deviceId, {
      deviceId: input.deviceId,
      installationId: input.installationId,
      fingerprint: input.fingerprint,
      publicKeyFingerprint: registration.publicKeyFingerprint,
      status: 'unclaimed',
      companyId: null,
      roomId: null,
      suspended: false,
      retired: false,
      revoked: false
    });
    audit('device.registration.created', 'device', input.deviceId, { registrationId: registration.registrationId });
    return registrationView(registration);
  }

  function getRegistrationStatus(registrationId, auth = null) {
    const registration = registrations.get(registrationId);
    if (!registration) throw new ProvisioningError('PROVISIONING-1001', 'Registration not found.');
    const device = devices.get(registration.deviceId);
    const status = deviceStatus(device);
    const base = { registrationId, deviceId: registration.deviceId, status, bootstrapStatus: status === 'unclaimed' || status === 'pending' ? 'limited' : 'claimed' };
    if (status === 'assigned' && isCompanyActor(auth, device.companyId)) {
      return { ...base, companyId: device.companyId, assignedRoom: { roomId: device.roomId, roomCodeName: PHASE1_ROOM } };
    }
    if ((status === 'claimed' || status === 'assigned') && !isCompanyActor(auth, device.companyId)) return base;
    return base;
  }

  function createPairingSession({ deviceId }) {
    const device = devices.get(deviceId);
    if (!device || device.status !== 'unclaimed') throw new ProvisioningError('PROVISIONING-1001', 'Only unclaimed devices can create pairing sessions.');
    const code = randomDigits(8);
    const session = {
      pairingSessionId: randomUUID(),
      deviceId,
      codeHash: hashPairingCode(code),
      status: 'pending',
      attempts: 0,
      createdAt: now().toISOString(),
      expiresAt: new Date(now().getTime() + PAIRING_TTL_MS).toISOString(),
      claimedAt: null,
      claimedByUserId: null
    };
    pairingSessions.set(session.pairingSessionId, session);
    audit('pairing.session.created', 'device', deviceId, { pairingSessionId: session.pairingSessionId });
    return { pairingSessionId: session.pairingSessionId, deviceId, code, qrToken: signQrToken(session.pairingSessionId, deviceId, session.expiresAt, qrTokenSecret), expiresAt: session.expiresAt, attempts: 0 };
  }

  function claimPairingSession(code, auth, { confirm = true } = {}) {
    requireCompanyAdminOrTechnician(auth);
    const session = [...pairingSessions.values()].find((candidate) => verifyPairingCode(code, candidate.codeHash));
    if (!session) throw new ProvisioningError('PAIRING-2001', 'Pairing code is invalid or expired.');
    if (session.status !== 'pending') throw new ProvisioningError('PAIRING-2001', 'Pairing code has already been used.');
    if (new Date(session.expiresAt) <= now()) { session.status = 'expired'; throw new ProvisioningError('PAIRING-2001', 'Pairing code is invalid or expired.'); }
    session.attempts += 1;
    if (session.attempts > MAX_ATTEMPTS) throw new ProvisioningError('PAIRING-2001', 'Pairing attempt limit exceeded.');
    const device = devices.get(session.deviceId);
    if (!confirm) return { deviceId: device.deviceId, status: 'confirmation_required', confirmation: { fingerprint: device.fingerprint, installationId: device.installationId } };
    device.companyId = PHASE1_COMPANY;
    device.status = 'claimed';
    session.status = 'claimed';
    session.claimedAt = now().toISOString();
    session.claimedByUserId = auth.userId;
    const credential = issueCertificateRecord(device.deviceId);
    audit('device.claimed', 'device', device.deviceId, { claimedByUserId: auth.userId, pairingSessionId: session.pairingSessionId });
    return { deviceId: device.deviceId, companyId: device.companyId, status: device.status, certificate: credential };
  }

  function assignRoom({ deviceId, roomId = PHASE1_ROOM }, auth) {
    requireCompanyAdminOrTechnician(auth);
    const device = devices.get(deviceId);
    if (!device || device.companyId !== PHASE1_COMPANY) throw new ProvisioningError('AUTH-3001', 'Device is not owned by the Phase 1 company.');
    if (device.status !== 'claimed' && device.status !== 'assigned') throw new ProvisioningError('PROVISIONING-1001', 'Only claimed devices can be assigned.');
    device.roomId = roomId;
    device.status = 'assigned';
    const assignment = { assignmentId: randomUUID(), deviceId, roomId, status: 'active', assignedAt: now().toISOString() };
    roomAssignments.set(assignment.assignmentId, assignment);
    audit('device.room_assigned', 'device', deviceId, { roomId, assignmentId: assignment.assignmentId });
    return assignment;
  }

  function issueCertificateRecord(deviceId, input = {}) {
    requireNoPrivateKey(input);
    const device = devices.get(deviceId);
    if (!device || device.suspended || device.retired || device.revoked) throw new ProvisioningError('AUTH-3001', 'Device cannot receive a valid credential.');
    const issuedAt = now();
    const credential = { credentialId: randomUUID(), deviceId, certificateThumbprint: sha256(`${deviceId}:${randomBytes(32).toString('hex')}`), status: 'active', issuedAt: issuedAt.toISOString(), expiresAt: new Date(issuedAt.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(), revokedAt: null, revocationReason: null };
    credentials.set(credential.credentialId, credential);
    audit('device.certificate_issued', 'device', deviceId, { credentialId: credential.credentialId, certificateThumbprint: credential.certificateThumbprint });
    return credential;
  }

  function audit(action, targetType, targetId, metadata) { auditEvents.push({ action, targetType, targetId, occurredAt: now().toISOString(), metadata }); }
  return { registerDevice, getRegistrationStatus, createPairingSession, claimPairingSession, assignRoom, issueCertificateRecord, _state: { registrations, devices, pairingSessions, credentials, roomAssignments, auditEvents } };
}

function requireFields(input, fields) { for (const field of fields) if (!input?.[field]) throw new ProvisioningError('PROVISIONING-1001', `Missing required field: ${field}.`); }
function requireNoPrivateKey(input) { if (input?.privateKey || input?.endpointPrivateKey) throw new ProvisioningError('AUTH-3001', 'Cloud must not accept endpoint private keys.'); }
function requireCompanyAdminOrTechnician(auth) { if (!isCompanyActor(auth, PHASE1_COMPANY) || !ADMIN_ROLES.has(auth.role)) throw new ProvisioningError('AUTH-3001', 'Company admin or technician access is required.'); }
function isCompanyActor(auth, companyId) { return auth?.companyId === companyId && typeof auth.userId === 'string'; }
function deviceStatus(device) { if (device.revoked) return 'revoked'; if (device.retired) return 'retired'; if (device.suspended) return 'suspended'; if (device.status === 'assigned') return 'assigned'; if (device.status === 'claimed') return 'claimed'; return 'unclaimed'; }
function registrationView(registration) { return { registrationId: registration.registrationId, deviceId: registration.deviceId, status: registration.status, bootstrapStatus: 'limited', expiresAt: registration.expiresAt }; }
function limitedCommissioning(value) { return { reportedHostname: value.reportedHostname, reportedModel: value.reportedModel, shortFingerprint: value.shortFingerprint, localIp: value.localIp ?? null }; }
function sha256(value) { return createHash('sha256').update(String(value)).digest('hex'); }
function hashPairingCode(code) { return `sha256:${sha256(code)}`; }
function verifyPairingCode(code, storedHash) { const expected = Buffer.from(hashPairingCode(code)); const actual = Buffer.from(storedHash); return expected.length === actual.length && timingSafeEqual(expected, actual); }
function randomDigits(length) { return Array.from(randomBytes(length), (byte) => String(byte % 10)).join(''); }
function signQrToken(pairingSessionId, deviceId, expiresAt, secret) { const payload = Buffer.from(JSON.stringify({ pairingSessionId, deviceId, expiresAt })).toString('base64url'); const sig = createHmac('sha256', secret).update(payload).digest('base64url'); return `${payload}.${sig}`; }
