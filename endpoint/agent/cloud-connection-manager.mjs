export class CloudConnectionManager {
  constructor({ transport, identity, agentVersion = '0.1.0', protocolVersion = '1.0' }) { this.transport = transport; this.identity = identity; this.agentVersion = agentVersion; this.protocolVersion = protocolVersion; this.state = 'disconnected'; }
  async connect({ lastConfigurationRevision = 0, lastReportedStateRevision = 0 } = {}) {
    await this.transport.connect();
    this.state = 'connected';
    await this.transport.send({ type: 'device.hello', messageId: `msg_${crypto.randomUUID()}`, deviceId: this.identity.deviceId, agentVersion: this.agentVersion, protocolVersion: this.protocolVersion, lastConfigurationRevision, lastReportedStateRevision });
  }
  async handle(message) {
    if (message.type === 'server.welcome') { this.connectionId = message.connectionId; this.heartbeatIntervalSeconds = message.heartbeatIntervalSeconds; return; }
    throw new Error(`Unsupported cloud message type: ${message.type}`);
  }
  async heartbeat(agentUptimeSeconds, adapterHealth = 'healthy') {
    await this.transport.send({ type: 'device.heartbeat', messageId: `msg_${crypto.randomUUID()}`, sentAt: new Date().toISOString(), agentUptimeSeconds, adapterHealth });
  }
}
