const REQUIRED_ENVIRONMENT = Object.freeze({
  NODE_ENV: { secret: false, description: 'Runtime mode.' },
  PLATFORM_PUBLIC_BASE_URL: { secret: false, description: 'Operator/admin API base URL.' },
  DEVICE_GATEWAY_WSS_URL: { secret: false, description: 'Secure WebSocket gateway URL.' },
  DATABASE_URL: { secret: true, description: 'Primary database connection string.' },
  REDIS_URL: { secret: true, description: 'Redis/session store connection string.' },
  OBJECT_STORAGE_BUCKET: { secret: false, description: 'Package and asset bucket.' },
  PACKAGE_SIGNING_PUBLIC_KEY: { secret: false, description: 'Public key used by endpoints to verify signed packages.' },
  SESSION_SECRET: { secret: true, description: 'User session signing secret.' }
});

const REQUIRED_MANIFEST = Object.freeze(['deploymentId', 'environmentName', 'region', 'version', 'api', 'gateway', 'database', 'sessionStore', 'objectStorage', 'webApp']);

export function environmentContract() { return { requiredEnvironment: REQUIRED_ENVIRONMENT, requiredDeploymentManifestFields: REQUIRED_MANIFEST }; }

export function validateEnvironmentConfiguration({ env = {}, manifest = {} } = {}) {
  const missingEnv = Object.keys(REQUIRED_ENVIRONMENT).filter((key) => !env[key]);
  const missingManifest = REQUIRED_MANIFEST.filter((key) => manifest[key] === undefined);
  if (missingEnv.length || missingManifest.length) throw new Error(`Missing deployment configuration: env=${missingEnv.join(',') || 'none'} manifest=${missingManifest.join(',') || 'none'}`);
  if (!String(env.DEVICE_GATEWAY_WSS_URL).startsWith('wss://')) throw new Error('DEVICE_GATEWAY_WSS_URL must use secure WebSocket.');
  return true;
}
