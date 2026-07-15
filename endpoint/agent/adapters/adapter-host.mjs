import { EndpointError, ERROR_CODES } from '../errors.mjs';
import { assertAdapterContract, ADAPTER_STATUS } from './adapter-contract.mjs';

export class AdapterHost {
  constructor({ adapters, logger = console }) {
    this.adapters = adapters.map(assertAdapterContract);
    this.logger = logger;
    this.statusById = new Map(this.adapters.map((adapter) => [adapter.manifest().adapterId, ADAPTER_STATUS.stopped]));
    this.errors = [];
  }

  manifests() { return this.adapters.map((adapter) => adapter.manifest()); }

  async start({ signal } = {}) {
    for (const adapter of this.adapters) {
      const id = adapter.manifest().adapterId;
      if (signal?.aborted) throw new EndpointError(ERROR_CODES.adapterStartFailed, 'Adapter startup was cancelled.', { adapterId: id });
      this.statusById.set(id, ADAPTER_STATUS.starting);
      try {
        await adapter.start({ signal });
        this.statusById.set(id, ADAPTER_STATUS.running);
      } catch (error) {
        const diagnostic = { adapterId: id, code: error.code ?? ERROR_CODES.adapterStartFailed, message: error.message };
        this.errors.push(diagnostic);
        this.statusById.set(id, ADAPTER_STATUS.degraded);
        this.logger.error?.('Adapter startup failed.', { event: 'adapter.start.failed', ...diagnostic });
      }
    }
    return this.health();
  }

  async stop({ signal } = {}) {
    for (const adapter of [...this.adapters].reverse()) {
      const id = adapter.manifest().adapterId;
      if (signal?.aborted) throw new EndpointError(ERROR_CODES.adapterStopFailed, 'Adapter shutdown was cancelled.', { adapterId: id });
      try { await adapter.stop({ signal }); this.statusById.set(id, ADAPTER_STATUS.stopped); }
      catch (error) { this.errors.push({ adapterId: id, code: error.code ?? ERROR_CODES.adapterStopFailed, message: error.message }); this.statusById.set(id, ADAPTER_STATUS.stoppedWithError); }
    }
  }

  async execute(command) {
    const adapter = this.adapters.find((candidate) => candidate.manifest().capabilities.includes(command.action));
    if (!adapter) throw new EndpointError(ERROR_CODES.unsupportedCommand, `No adapter supports command action: ${command.action}.`, { action: command.action });
    return adapter.execute(command);
  }

  async validateConfiguration(configuration) { return Promise.all(this.adapters.map((adapter) => adapter.validateConfiguration(configuration))); }
  async reportedState() { return Object.fromEntries(await Promise.all(this.adapters.map(async (adapter) => [adapter.manifest().adapterId, await adapter.reportedState()]))); }
  health() { return { status: [...this.statusById.values()].includes(ADAPTER_STATUS.degraded) ? 'degraded' : 'healthy', adapters: this.adapters.map((adapter) => adapter.health()), errors: [...this.errors] }; }
}
