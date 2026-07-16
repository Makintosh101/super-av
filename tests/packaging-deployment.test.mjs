import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createSign } from 'node:crypto';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { phase1BlueElephantInfrastructure, validatePhase1InfrastructureDefinition } from '../deployment/infrastructure/phase1-blue-elephant.mjs';
import { environmentContract, validateEnvironmentConfiguration } from '../deployment/contracts/environment-contract.mjs';
import { createEndpointInstallerManifest, validateEndpointInstallerManifest } from '../endpoint/packaging/installer-manifest.mjs';
import { createTouchDesignerProjectManifest, validateTouchDesignerProjectManifest } from '../touchdesigner/packages/phase1-project-manifest.mjs';
import { sha256File, validatePackage, activatePackageWithRollback } from '../endpoint/agent/package-validator.mjs';

function signManifest({ privateKey, id, version, sha256 }) {
  const signer = createSign('RSA-SHA256');
  signer.update(`${id}:${version}:${sha256}`);
  signer.end();
  return signer.sign(privateKey, 'base64');
}

test('Phase 1 infrastructure skeleton defines required code-owned modules', () => {
  assert.equal(validatePhase1InfrastructureDefinition(), true);
  assert.deepEqual(Object.keys(phase1BlueElephantInfrastructure.modules), ['api', 'gateway', 'database', 'sessionStore', 'objectStorage', 'webApp']);
  assert.equal(phase1BlueElephantInfrastructure.deploymentId, 'blue-elephant-phase1');
});

test('environment contract separates deployment configuration and requires secure gateway URL', () => {
  const contract = environmentContract();
  assert.equal(contract.requiredEnvironment.DATABASE_URL.secret, true);
  assert.throws(() => validateEnvironmentConfiguration({ env: {}, manifest: {} }), /Missing deployment configuration/);
  assert.equal(validateEnvironmentConfiguration({
    env: { NODE_ENV: 'production', PLATFORM_PUBLIC_BASE_URL: 'https://example.test', DEVICE_GATEWAY_WSS_URL: 'wss://devices.example.test', DATABASE_URL: 'postgres://db', REDIS_URL: 'redis://cache', OBJECT_STORAGE_BUCKET: 'packages', PACKAGE_SIGNING_PUBLIC_KEY: 'pub', SESSION_SECRET: 'secret' },
    manifest: { deploymentId: 'blue-elephant-phase1', environmentName: 'production', region: 'us-central1', version: '0.1.0', api: {}, gateway: {}, database: {}, sessionStore: {}, objectStorage: {}, webApp: {} }
  }), true);
});

test('endpoint installer manifest installs service assets without fleet secrets', () => {
  const manifest = createEndpointInstallerManifest({ version: '1.0.0' });
  assert.equal(validateEndpointInstallerManifest(manifest), true);
  assert.equal(manifest.service.autoStart, true);
  assert.equal(manifest.embeddedFleetSecrets, false);
  assert.ok(manifest.directories.some((dir) => dir.endsWith('/packages')));
});

test('TouchDesigner package manifest records project integrity and licensing prerequisite', () => {
  const manifest = createTouchDesignerProjectManifest({ projectVersion: 'td-1.0.0', sha256: 'abc123', signature: 'sig', assetReferences: ['asset_presentation'] });
  assert.equal(validateTouchDesignerProjectManifest(manifest), true);
  assert.equal(manifest.requiredTouchDesignerVersion, '2023.10000');
  assert.match(manifest.licensing.prerequisite, /deployment concern/);
});

test('endpoint package validation rejects unsigned and altered packages and preserves rollback package', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'package-validation-'));
  const packagePath = join(directory, 'project.pkg');
  await writeFile(packagePath, 'valid package');
  const sha256 = await sha256File(packagePath);
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  const manifest = createTouchDesignerProjectManifest({ projectVersion: 'td-1.0.0', sha256, signature: signManifest({ privateKey, id: 'touchdesigner-phase1-project', version: 'td-1.0.0', sha256 }) });
  await assert.rejects(() => validatePackage({ manifest: { ...manifest, signature: undefined }, packagePath, publicKeyPem }), /unsigned/);
  assert.equal((await validatePackage({ manifest, packagePath, publicKeyPem })).status, 'valid');
  const installDirectory = join(directory, 'install');
  await activatePackageWithRollback({ manifest, packagePath, publicKeyPem, installDirectory });
  await writeFile(packagePath, 'second valid package');
  const secondSha = await sha256File(packagePath);
  const secondManifest = createTouchDesignerProjectManifest({ projectVersion: 'td-1.0.1', sha256: secondSha, signature: signManifest({ privateKey, id: 'touchdesigner-phase1-project', version: 'td-1.0.1', sha256: secondSha }) });
  const activation = await activatePackageWithRollback({ manifest: secondManifest, packagePath, publicKeyPem, installDirectory });
  assert.equal(await readFile(activation.previousPackage, 'utf8'), 'valid package');
  await writeFile(packagePath, 'tampered');
  await assert.rejects(() => validatePackage({ manifest: secondManifest, packagePath, publicKeyPem }), /hash does not match/);
});
