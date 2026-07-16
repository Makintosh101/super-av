export function createEndpointInstallerManifest({ version, serviceName = 'BEEndpointNodeAgent', installRoot = 'C:/ProgramData/BlueElephant/EndpointAgent', adapterPackage = 'adapter-package.zip', commissioningAccess = 'local-api-127.0.0.1' } = {}) {
  if (!version) throw new Error('Installer version is required.');
  return {
    manifestVersion: 'phase1.endpoint-installer.v1',
    version,
    service: { name: serviceName, autoStart: true, entryPoint: 'endpoint/agent/service.mjs' },
    directories: [`${installRoot}/config`, `${installRoot}/logs`, `${installRoot}/packages`, `${installRoot}/rollback`],
    adapterPackage,
    commissioningAccess,
    installedVersionMetadata: `${installRoot}/installed-version.json`,
    embeddedFleetSecrets: false
  };
}

export function validateEndpointInstallerManifest(manifest) {
  if (manifest?.embeddedFleetSecrets !== false) throw new Error('Installer must not embed long-lived shared fleet secrets.');
  if (manifest?.service?.autoStart !== true) throw new Error('Endpoint service must register for auto-start.');
  if (!manifest?.directories?.some((dir) => dir.endsWith('/rollback'))) throw new Error('Installer must create rollback package directory.');
  return true;
}
