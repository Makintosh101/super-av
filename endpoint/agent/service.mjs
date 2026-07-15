import { StructuredLogger } from './logger.mjs';
export class EndpointService {
  constructor({ logger = new StructuredLogger(), startHooks = [], stopHooks = [] } = {}) { this.logger = logger; this.startHooks = startHooks; this.stopHooks = stopHooks; }
  async start() { this.logger.info('Endpoint service starting.', { event: 'service.start' }); for (const hook of this.startHooks) await hook(); this.logger.info('Endpoint service started.', { event: 'service.started' }); }
  async stop() { this.logger.info('Endpoint service stopping.', { event: 'service.stop' }); for (const hook of this.stopHooks) await hook(); this.logger.info('Endpoint service stopped.', { event: 'service.stopped' }); }
}
