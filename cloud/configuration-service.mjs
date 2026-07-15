import { randomUUID } from 'node:crypto';

const PHASE1_SCHEMA_VERSION = 'phase1.configuration.v1';
const LOGICAL_CAPABILITIES = new Set([
  'holding.show',
  'holding.hide',
  'video.output.selectSource',
  'audio.microphones.setMuted',
  'audio.master.setVolume',
  'preset.activate',
  'system.getStatus',
  'system.restart'
]);
const ACTIVE_DEVICE_STATUSES = new Set(['claimed', 'assigned']);

export class ConfigurationError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ConfigurationError';
    this.code = code;
    this.details = details;
  }
}

export function createConfigurationService({ now = () => new Date() } = {}) {
  const assets = new Map();
  const devices = new Map();
  const drafts = new Map();
  const revisions = new Map();
  const desiredDeployments = new Map();
  const auditEvents = [];
  let nextRevision = 1;

  function registerDevice(device) {
    requireFields(device, ['deviceId', 'companyId', 'roomId', 'status']);
    devices.set(device.deviceId, { suspended: false, retired: false, revoked: false, ...device });
    return devices.get(device.deviceId);
  }

  function createAssetMetadata(input, auth) {
    requireAdminOrTechnician(auth, input.companyId);
    requireFields(input, ['assetId', 'companyId', 'contentHash', 'storageKey', 'sizeBytes', 'cachePolicy']);
    if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0) throw new ConfigurationError('CONFIG-8001', 'Asset size must be a positive integer.', { path: '/sizeBytes' });
    if (!['cacheRequired', 'cacheOptional'].includes(input.cachePolicy)) throw new ConfigurationError('CONFIG-8001', 'Asset cache policy is not valid.', { path: '/cachePolicy' });
    if (input.signedUrl || input.protectedUrl) throw new ConfigurationError('CONFIG-8003', 'Asset metadata must not contain signed or protected media URLs.');
    const record = { assetId: input.assetId, companyId: input.companyId, contentHash: input.contentHash, storageKey: input.storageKey, sizeBytes: input.sizeBytes, cachePolicy: input.cachePolicy, createdAt: now().toISOString() };
    assets.set(record.assetId, record);
    audit('asset.metadata.created', auth, 'asset', record.assetId, { cachePolicy: record.cachePolicy, sizeBytes: record.sizeBytes });
    return { ...record };
  }

  function validateDraft(input, auth) {
    requireAdminOrTechnician(auth, input.companyId);
    requireFields(input, ['companyId', 'roomId', 'configuration']);
    const errors = validateConfiguration(input.configuration);
    const result = { valid: errors.length === 0, errors };
    const draft = { draftId: input.draftId ?? `draft_${randomUUID()}`, companyId: input.companyId, roomId: input.roomId, configuration: input.configuration, validation: result, validatedAt: now().toISOString(), createdByUserId: auth.userId };
    drafts.set(draft.draftId, draft);
    audit('configuration.draft_validated', auth, 'configurationDraft', draft.draftId, { valid: result.valid, errorCount: errors.length });
    return { draftId: draft.draftId, ...result };
  }

  function publishConfiguration({ draftId }, auth) {
    const draft = drafts.get(draftId);
    if (!draft) throw new ConfigurationError('CONFIG-8002', 'Configuration draft was not found.');
    requireAdminOrTechnician(auth, draft.companyId);
    if (!draft.validation.valid) throw new ConfigurationError('CONFIG-8001', 'Invalid configuration draft cannot be published.', { errors: draft.validation.errors });
    const revision = { configurationRevision: nextRevision++, companyId: draft.companyId, roomId: draft.roomId, schemaVersion: PHASE1_SCHEMA_VERSION, configuration: structuredClone(draft.configuration), assetIds: assetIdsFor(draft.configuration), publishedAt: now().toISOString(), publishedByUserId: auth.userId, supersededAt: null };
    for (const existing of revisions.values()) if (existing.roomId === revision.roomId && existing.supersededAt === null) existing.supersededAt = revision.publishedAt;
    revisions.set(revision.configurationRevision, revision);
    for (const device of devices.values()) if (device.roomId === revision.roomId && device.companyId === revision.companyId && isDeviceAllowed(device)) {
      desiredDeployments.set(device.deviceId, { deploymentId: `dep_${randomUUID()}`, deviceId: device.deviceId, roomId: revision.roomId, configurationRevision: revision.configurationRevision, status: 'desired', desiredAt: revision.publishedAt });
    }
    audit('configuration.published', auth, 'configurationRevision', String(revision.configurationRevision), { roomId: revision.roomId });
    return revisionView(revision);
  }

  function getDesiredConfiguration({ deviceId }) {
    const device = devices.get(deviceId);
    if (!device || !isDeviceAllowed(device) || !device.roomId) throw new ConfigurationError('AUTH-3001', 'Device is not allowed to fetch production configuration.');
    const deployment = desiredDeployments.get(deviceId);
    if (!deployment) throw new ConfigurationError('CONFIG-8002', 'No desired configuration is published for this device.');
    const revision = revisions.get(deployment.configurationRevision);
    return { deviceId, deploymentId: deployment.deploymentId, configurationRevision: revision.configurationRevision, schemaVersion: revision.schemaVersion, publishedAt: revision.publishedAt, assetIds: [...revision.assetIds], packageReferences: revision.configuration.packageReferences ?? [] };
  }

  function validateConfiguration(configuration) {
    const errors = [];
    if (configuration.schemaVersion !== PHASE1_SCHEMA_VERSION) errors.push(error('/schemaVersion', 'CONFIG-8001', 'Unsupported configuration schema version.'));
    for (const [index, capability] of (configuration.capabilities ?? []).entries()) {
      if (!LOGICAL_CAPABILITIES.has(capability.action)) errors.push(error(`/capabilities/${index}/action`, 'CONFIG-8002', 'Unknown Phase 1 logical capability.'));
      if (capability.hardwarePath || capability.touchDesignerPath || capability.operatorPath) errors.push(error(`/capabilities/${index}`, 'CONFIG-8004', 'Configuration must not expose hardware or engine-specific paths.'));
    }
    for (const [index, assetId] of assetIdsFor(configuration).entries()) if (!assets.has(assetId)) errors.push(error(`/assetIds/${index}`, 'CONFIG-8003', 'Configuration references an unknown media asset.'));
    return errors;
  }

  function audit(action, auth, targetType, targetId, metadata) { auditEvents.push({ action, actorUserId: auth?.userId ?? null, targetType, targetId, occurredAt: now().toISOString(), metadata }); }
  return { registerDevice, createAssetMetadata, validateDraft, publishConfiguration, getDesiredConfiguration, _state: { assets, devices, drafts, revisions, desiredDeployments, auditEvents } };
}

function assetIdsFor(configuration) { return [...new Set([...(configuration.assetIds ?? []), ...((configuration.mediaAssets ?? []).map((asset) => asset.assetId))].filter(Boolean))]; }
function revisionView(revision) { return { configurationRevision: revision.configurationRevision, companyId: revision.companyId, roomId: revision.roomId, schemaVersion: revision.schemaVersion, assetIds: [...revision.assetIds], publishedAt: revision.publishedAt, supersededAt: revision.supersededAt }; }
function error(path, code, message) { return { path, code, message }; }
function requireFields(input, fields) { for (const field of fields) if (!input?.[field]) throw new ConfigurationError('CONFIG-8001', `Missing required field: ${field}.`, { path: `/${field}` }); }
function requireAdminOrTechnician(auth, companyId) { if (!auth || auth.companyId !== companyId || !['admin', 'technician'].includes(auth.role)) throw new ConfigurationError('AUTH-3001', 'Company admin or technician access is required.'); }
function isDeviceAllowed(device) { return ACTIVE_DEVICE_STATUSES.has(device.status) && !device.suspended && !device.retired && !device.revoked; }
