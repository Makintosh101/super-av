import assert from 'node:assert/strict';
import test from 'node:test';
import { createProvisioningService, ProvisioningError } from '../cloud/provisioning/provisioning-service.mjs';

const admin = { userId: 'user-admin', companyId: 'blue-elephant-phase1', role: 'admin' };
const deviceInput = {
  deviceId: 'dev-phase1-001',
  installationId: 'install-001',
  publicKey: '-----BEGIN PUBLIC KEY-----phase1-----END PUBLIC KEY-----',
  fingerprint: 'fp-001',
  bootstrapVersion: '1.0.0',
  commissioning: { reportedHostname: 'phase1-node', reportedModel: 'nuc', shortFingerprint: 'fp-001', secret: 'must-not-return' }
};

test('registers an unclaimed device with limited bootstrap metadata and audit evidence', () => {
  const service = createProvisioningService();
  const registration = service.registerDevice(deviceInput, { correlationId: 'corr-test' });
  assert.equal(registration.status, 'pending');
  assert.equal(registration.bootstrapStatus, 'limited');
  assert.ok(registration.registrationId);
  assert.equal(service._state.devices.get(deviceInput.deviceId).status, 'unclaimed');
  assert.equal(service._state.auditEvents.at(-1).action, 'device.registration.created');

  const duplicate = service.registerDevice(deviceInput);
  assert.equal(duplicate.registrationId, registration.registrationId);
  assert.equal(service._state.registrations.size, 1);
});

test('polling hides company and room details before authorised claim visibility', () => {
  const service = createProvisioningService();
  const registration = service.registerDevice(deviceInput);
  assert.deepEqual(service.getRegistrationStatus(registration.registrationId), {
    registrationId: registration.registrationId,
    deviceId: deviceInput.deviceId,
    status: 'unclaimed',
    bootstrapStatus: 'limited'
  });
});

test('creates hashed, expiring, one-time pairing sessions and rejects replay', () => {
  const service = createProvisioningService();
  service.registerDevice(deviceInput);
  const session = service.createPairingSession({ deviceId: deviceInput.deviceId });
  assert.match(session.code, /^\d{8}$/);
  assert.ok(session.qrToken.includes('.'));
  const stored = [...service._state.pairingSessions.values()][0];
  assert.notEqual(stored.codeHash, session.code);
  assert.match(stored.codeHash, /^sha256:/);

  const preview = service.claimPairingSession(session.code, admin, { confirm: false });
  assert.equal(preview.status, 'confirmation_required');
  assert.equal(preview.confirmation.fingerprint, 'fp-001');
  const claim = service.claimPairingSession(session.code, admin);
  assert.equal(claim.status, 'claimed');
  assert.equal(claim.companyId, 'blue-elephant-phase1');
  assert.equal(claim.certificate.status, 'active');
  assert.ok(claim.certificate.certificateThumbprint);
  assert.equal(claim.certificate.privateKey, undefined);
  assert.throws(() => service.claimPairingSession(session.code, admin), /already been used/);
});

test('enforces pairing expiry and company role ownership checks', () => {
  let current = new Date('2026-07-15T00:00:00Z');
  const service = createProvisioningService({ now: () => current });
  service.registerDevice(deviceInput);
  const session = service.createPairingSession({ deviceId: deviceInput.deviceId });
  current = new Date('2026-07-15T00:11:00Z');
  assert.throws(() => service.claimPairingSession(session.code, admin), (error) => error instanceof ProvisioningError && error.code === 'PAIRING-2001');

  const fresh = createProvisioningService();
  fresh.registerDevice({ ...deviceInput, deviceId: 'dev-phase1-002', fingerprint: 'fp-002' });
  const freshSession = fresh.createPairingSession({ deviceId: 'dev-phase1-002' });
  assert.throws(() => fresh.claimPairingSession(freshSession.code, { userId: 'viewer', companyId: 'blue-elephant-phase1', role: 'viewer' }), (error) => error.code === 'AUTH-3001');
});

test('assigns only claimed Phase 1 devices to the Phase 1 room and records audit events', () => {
  const service = createProvisioningService();
  service.registerDevice(deviceInput);
  const session = service.createPairingSession({ deviceId: deviceInput.deviceId });
  service.claimPairingSession(session.code, admin);
  const assignment = service.assignRoom({ deviceId: deviceInput.deviceId }, admin);
  assert.equal(assignment.roomId, 'demo-room');
  assert.equal(assignment.status, 'active');
  assert.equal(service._state.devices.get(deviceInput.deviceId).status, 'assigned');
  assert.equal(service._state.auditEvents.at(-1).action, 'device.room_assigned');
});

test('rejects endpoint private keys and suspended credential issuance', () => {
  const service = createProvisioningService();
  assert.throws(() => service.registerDevice({ ...deviceInput, privateKey: 'secret' }), (error) => error.code === 'AUTH-3001');
  service.registerDevice(deviceInput);
  service._state.devices.get(deviceInput.deviceId).suspended = true;
  assert.throws(() => service.issueCertificateRecord(deviceInput.deviceId), (error) => error.code === 'AUTH-3001');
});

test('tenant and ownership checks reject cross-company assignment and suspended revoked credentials', () => {
  const service = createProvisioningService();
  service.registerDevice(deviceInput);
  const session = service.createPairingSession({ deviceId: deviceInput.deviceId });
  service.claimPairingSession(session.code, admin);
  assert.throws(() => service.assignRoom({ deviceId: deviceInput.deviceId }, { userId: 'other', companyId: 'other-company', role: 'admin' }), (error) => error.code === 'AUTH-3001');
  service._state.devices.get(deviceInput.deviceId).revoked = true;
  assert.throws(() => service.issueCertificateRecord(deviceInput.deviceId), (error) => error.code === 'AUTH-3001');
});
