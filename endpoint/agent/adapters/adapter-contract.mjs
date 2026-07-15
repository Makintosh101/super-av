import { EndpointError, ERROR_CODES } from '../errors.mjs';

export const PHASE_1_ADAPTER_TYPES = Object.freeze(['systemHealth', 'touchdesigner']);
export const ADAPTER_STATUS = Object.freeze({ stopped: 'stopped', starting: 'starting', running: 'running', degraded: 'degraded', stoppedWithError: 'stoppedWithError' });

export function createAdapterManifest({ adapterId, type, displayName, version, capabilities }) {
  if (!adapterId || !PHASE_1_ADAPTER_TYPES.includes(type) || !displayName || !version || !Array.isArray(capabilities)) {
    throw new EndpointError(ERROR_CODES.adapterContractInvalid, 'Adapter manifest is invalid.', { adapterId, type });
  }
  return Object.freeze({ adapterId, type, displayName, version, capabilities: Object.freeze([...capabilities]) });
}

export function assertAdapterContract(adapter) {
  const requiredMethods = ['manifest', 'start', 'stop', 'validateConfiguration', 'execute', 'reportedState', 'health'];
  for (const method of requiredMethods) {
    if (typeof adapter?.[method] !== 'function') {
      throw new EndpointError(ERROR_CODES.adapterContractInvalid, `Adapter is missing required method: ${method}.`, { method });
    }
  }
  const manifest = adapter.manifest();
  if (!PHASE_1_ADAPTER_TYPES.includes(manifest.type)) {
    throw new EndpointError(ERROR_CODES.adapterContractInvalid, `Unsupported Phase 1 adapter type: ${manifest.type}.`, { type: manifest.type });
  }
  return adapter;
}

export function createHealth({ status, adapterId, checks = {}, errors = [], observedAt = new Date().toISOString() }) {
  return { adapterId, status, observedAt, checks, errors: errors.map((error) => ({ code: error.code ?? ERROR_CODES.adapterHealthDegraded, message: error.message ?? String(error) })) };
}
