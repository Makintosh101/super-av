export const phase1BlueElephantInfrastructure = Object.freeze({
  deploymentId: 'blue-elephant-phase1',
  tenancyModel: 'single-company-isolated-deployment',
  bootstrapInputs: ['cloudProjectId', 'region', 'operatorCredentials', 'packageSigningPublicKey'],
  modules: {
    api: { kind: 'service', purpose: 'Platform API', publicBasePath: '/api/v1' },
    gateway: { kind: 'service', purpose: 'Real-time device gateway', protocol: 'wss' },
    database: { kind: 'managed-postgres', migrations: 'cloud/database/migrations' },
    sessionStore: { kind: 'redis-compatible', purpose: 'presence, sessions, command correlation' },
    objectStorage: { kind: 'bucket', purpose: 'installers, adapter packages, TouchDesigner projects, diagnostic archives' },
    webApp: { kind: 'static-web-app', purpose: 'Phase 1 admin, technician and control screens' }
  },
  manualSteps: ['Provide documented credentials/bootstrap inputs only. All resources are created from code-owned modules.']
});

export function validatePhase1InfrastructureDefinition(definition = phase1BlueElephantInfrastructure) {
  const required = ['api', 'gateway', 'database', 'sessionStore', 'objectStorage', 'webApp'];
  const missing = required.filter((name) => !definition.modules?.[name]);
  if (missing.length > 0) throw new Error(`Missing Phase 1 infrastructure modules: ${missing.join(', ')}`);
  if (definition.deploymentId !== 'blue-elephant-phase1') throw new Error('Phase 1 infrastructure must target Blue Elephant only.');
  return true;
}
