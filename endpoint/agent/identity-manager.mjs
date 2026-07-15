import { generateKeyPairSync, createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises';
import { join } from 'node:path';
export function createIdentity(now = new Date()) {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const deviceId = `dev_${randomUUID()}`;
  const installationId = `inst_${randomUUID()}`;
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const fingerprint = `SHA256:${createHash('sha256').update(publicKeyPem).digest('hex').slice(0, 16).toUpperCase()}`;
  return { deviceId, installationId, publicKeyPem, privateKeyPem, fingerprint, recoveryIdentifier: `rec_${randomUUID()}`, lifecycleStatus: 'prepared', createdAt: now.toISOString(), updatedAt: now.toISOString() };
}
export async function loadOrCreateIdentity(storageDirectory) {
  await mkdir(storageDirectory, { recursive: true, mode: 0o700 });
  const metadataPath = join(storageDirectory, 'identity.json');
  const keyPath = join(storageDirectory, 'identity.key');
  try { return JSON.parse(await readFile(metadataPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const identity = createIdentity();
  await writeFile(keyPath, identity.privateKeyPem, { mode: 0o600 });
  await chmod(keyPath, 0o600).catch(() => {});
  const persisted = { ...identity, privateKeyPem: undefined, privateKeyRef: keyPath };
  await writeFile(metadataPath, JSON.stringify(persisted, null, 2), { mode: 0o600 });
  return persisted;
}
