import { createHash, createVerify } from 'node:crypto';
import { readFile, mkdir, copyFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { EndpointError, ERROR_CODES } from './errors.mjs';

export async function sha256File(path) { return createHash('sha256').update(await readFile(path)).digest('hex'); }

export async function validatePackage({ manifest, packagePath, publicKeyPem }) {
  if (!manifest?.signature?.value) throw new EndpointError(ERROR_CODES.packageValidationFailed, 'Package manifest is unsigned.');
  const hash = await sha256File(packagePath);
  if (hash !== manifest.package.sha256) throw new EndpointError(ERROR_CODES.packageValidationFailed, 'Package hash does not match manifest.', { expected: manifest.package.sha256, actual: hash });
  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${manifest.package.id}:${manifest.package.version}:${manifest.package.sha256}`);
  verifier.end();
  if (!verifier.verify(publicKeyPem, manifest.signature.value, 'base64')) throw new EndpointError(ERROR_CODES.packageValidationFailed, 'Package signature validation failed.');
  return { status: 'valid', packageId: manifest.package.id, version: manifest.package.version, sha256: hash };
}

export async function activatePackageWithRollback({ manifest, packagePath, publicKeyPem, installDirectory }) {
  const validation = await validatePackage({ manifest, packagePath, publicKeyPem });
  await mkdir(join(installDirectory, 'current'), { recursive: true });
  await mkdir(join(installDirectory, 'previous'), { recursive: true });
  const current = join(installDirectory, 'current', `${manifest.package.id}.pkg`);
  const previous = join(installDirectory, 'previous', `${manifest.package.id}.pkg`);
  try { await rename(current, previous); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await copyFile(packagePath, current);
  return { ...validation, currentPackage: current, previousPackage: previous };
}
