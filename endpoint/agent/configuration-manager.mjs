import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { EndpointError, ERROR_CODES } from './errors.mjs';
import { PHASE_1_ACTIONS } from './command-dispatcher.mjs';

export class ConfigurationManager {
  constructor({ path, fetchDesiredConfiguration, reportConfiguration, assetExists = async () => true, now = () => new Date() }) {
    this.path = path;
    this.fetchDesiredConfiguration = fetchDesiredConfiguration;
    this.reportConfiguration = reportConfiguration;
    this.assetExists = assetExists;
    this.now = now;
    this.state = { active: { configurationRevision: 0, capabilities: PHASE_1_ACTIONS }, desiredRevision: 0, failedRevision: null };
  }

  async load() { try { this.state = JSON.parse(await readFile(this.path, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; } return this.state; }
  active() { return this.state.active; }

  async downloadValidateAndActivate() {
    const desired = await this.fetchDesiredConfiguration();
    await this.validate(desired);
    this.state.desiredRevision = desired.configurationRevision;
    try {
      this.state.active = { ...desired, activatedAt: this.now().toISOString(), capabilities: desired.capabilities ?? PHASE_1_ACTIONS };
      this.state.failedRevision = null;
      await this.persist();
      await this.reportConfiguration?.({ status: 'active', activeRevision: desired.configurationRevision, desiredRevision: desired.configurationRevision });
      return this.state.active;
    } catch (error) {
      this.state.failedRevision = desired.configurationRevision;
      await this.persist();
      await this.reportConfiguration?.({ status: 'failed', activeRevision: this.state.active.configurationRevision, desiredRevision: desired.configurationRevision, errorCode: error.code ?? ERROR_CODES.configurationActivationFailed });
      throw error;
    }
  }

  async validate(configuration) {
    if (configuration.schemaVersion !== 'phase1.configuration.v1') throw new EndpointError(ERROR_CODES.configurationRejected, 'Configuration schema version is unsupported.');
    if (!Number.isInteger(configuration.configurationRevision) || configuration.configurationRevision < 1) throw new EndpointError(ERROR_CODES.configurationRejected, 'Configuration revision must be a positive integer.');
    const capabilities = configuration.capabilities ?? PHASE_1_ACTIONS;
    const unsupported = capabilities.filter((capability) => !PHASE_1_ACTIONS.includes(capability));
    if (unsupported.length) throw new EndpointError(ERROR_CODES.configurationRejected, 'Configuration references unsupported capabilities.', { unsupported });
    for (const assetId of configuration.assetIds ?? []) {
      if (!(await this.assetExists(assetId))) throw new EndpointError(ERROR_CODES.configurationRejected, 'Configuration references unavailable asset.', { assetId });
    }
  }

  async persist() { await mkdir(dirname(this.path), { recursive: true }); await writeFile(this.path, JSON.stringify(this.state, null, 2)); }
}
