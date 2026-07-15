import { EndpointError, ERROR_CODES } from './errors.mjs';

export const PHASE_1_ACTIONS = Object.freeze([
  'system.getStatus',
  'system.restartApplication',
  'preset.activate',
  'video.output.selectSource',
  'holding.show',
  'holding.hide',
  'audio.microphones.setMuted',
  'audio.master.setVolume'
]);

const ACTIONS = new Set(PHASE_1_ACTIONS);
const ROLE_PRIORITY = { User: 1, Technician: 2, Admin: 3 };

export class CommandDispatcher {
  constructor({ adapter, deduplicationStore, configurationProvider, transport, logger = console, now = () => new Date() }) {
    this.adapter = adapter;
    this.deduplicationStore = deduplicationStore;
    this.configurationProvider = configurationProvider;
    this.transport = transport;
    this.logger = logger;
    this.now = now;
  }

  async dispatch(command) {
    this.validate(command);
    const duplicate = await this.deduplicationStore.find(command);
    if (duplicate) {
      this.logger.info('Command deduplicated.', { event: 'command.deduplicated', commandId: command.commandId, correlationId: command.correlationId });
      return duplicate.result;
    }

    await this.transport.send(this.acknowledgement(command));
    try {
      const result = await this.adapter.execute(command);
      const completion = this.completion(command, 'completed', result);
      await this.deduplicationStore.record(command, completion);
      await this.transport.send(completion);
      return completion;
    } catch (error) {
      const completion = this.completion(command, 'failed', null, error);
      await this.deduplicationStore.record(command, completion);
      await this.transport.send(completion);
      return completion;
    }
  }

  validate(command) {
    if (!command?.commandId || !command?.correlationId || !command?.idempotencyKey) {
      throw new EndpointError(ERROR_CODES.commandRejected, 'Command is missing required identifiers.');
    }
    if (!ACTIONS.has(command.action) || command.requiredCapability !== command.action) {
      throw new EndpointError(ERROR_CODES.unsupportedCommand, `Unsupported command action: ${command.action}.`, { action: command.action });
    }
    if (!ROLE_PRIORITY[command.actorRole]) {
      throw new EndpointError(ERROR_CODES.commandRejected, `Unsupported command actor role: ${command.actorRole}.`, { actorRole: command.actorRole });
    }
    if (new Date(command.expiresAt).getTime() <= this.now().getTime()) {
      throw new EndpointError(ERROR_CODES.expiredCommand, 'Expired command was rejected before adapter execution.', { commandId: command.commandId });
    }
    const active = this.configurationProvider.active();
    if (command.configurationRevision !== active.configurationRevision) {
      throw new EndpointError(ERROR_CODES.configurationRevisionMismatch, 'Command configuration revision does not match active configuration.', { expected: active.configurationRevision, actual: command.configurationRevision });
    }
    if (!active.capabilities?.includes(command.requiredCapability)) {
      throw new EndpointError(ERROR_CODES.missingCapability, 'Active configuration does not include required capability.', { requiredCapability: command.requiredCapability });
    }
  }

  acknowledgement(command) {
    return { type: 'device.commandAcknowledged', commandId: command.commandId, correlationId: command.correlationId, acknowledgedAt: this.now().toISOString() };
  }

  completion(command, status, result, error) {
    return { type: 'device.commandCompleted', commandId: command.commandId, correlationId: command.correlationId, status, completedAt: this.now().toISOString(), result: result ?? undefined, error: error ? { code: error.code ?? ERROR_CODES.commandExecutionFailed, message: error.message } : undefined };
  }
}

export function compareCommandPriority(a, b) {
  return (ROLE_PRIORITY[a.actorRole] ?? 0) - (ROLE_PRIORITY[b.actorRole] ?? 0);
}
