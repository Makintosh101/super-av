import { spawn } from 'node:child_process';
import { PHASE_1_ACTIONS } from '../command-dispatcher.mjs';
import { EndpointError, ERROR_CODES } from '../errors.mjs';
import { createAdapterManifest, createHealth } from './adapter-contract.mjs';

const DEFAULT_PROTOCOL_VERSION = 'phase1.touchdesigner.v1';

export class LocalhostTouchDesignerBridge {
  constructor({ url = 'ws://127.0.0.1:9980', protocolVersion = DEFAULT_PROTOCOL_VERSION, maxMessageBytes = 65536, socketFactory } = {}) {
    const parsed = new URL(url);
    if (!['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname)) throw new EndpointError(ERROR_CODES.touchdesignerBridgeFailed, 'TouchDesigner bridge must use localhost only.', { host: parsed.hostname });
    this.url = url; this.protocolVersion = protocolVersion; this.maxMessageBytes = maxMessageBytes; this.socketFactory = socketFactory; this.connected = false; this.lastHeartbeatAt = null;
  }
  async connect() { if (!this.socketFactory) throw new EndpointError(ERROR_CODES.touchdesignerBridgeFailed, 'No localhost WebSocket factory configured for TouchDesigner bridge.'); this.socket = await this.socketFactory(this.url); this.connected = true; }
  validateMessage(message) { const payload = JSON.stringify(message); if (Buffer.byteLength(payload) > this.maxMessageBytes) throw new EndpointError(ERROR_CODES.touchdesignerProtocolRejected, 'TouchDesigner bridge message exceeds maximum size.'); if (message.protocolVersion !== this.protocolVersion) throw new EndpointError(ERROR_CODES.touchdesignerProtocolRejected, 'TouchDesigner bridge protocol version mismatch.'); return payload; }
  async send(message) { if (!this.connected) await this.connect(); const payload = this.validateMessage({ protocolVersion: this.protocolVersion, ...message }); return this.socket.send(payload); }
  recordHeartbeat(at = new Date()) { this.lastHeartbeatAt = at; }
}

export class TouchDesignerAdapter {
  constructor({ adapterVersion = '0.1.0', executablePath, projectPath, expectedProjectVersion, bridge = new LocalhostTouchDesignerBridge(), restartPolicy = { heartbeatTimeoutMs: 30000, maxRestarts: 3, windowMs: 300000 }, now = () => new Date(), launcher = spawn } = {}) {
    this.adapterVersion = adapterVersion; this.executablePath = executablePath; this.projectPath = projectPath; this.expectedProjectVersion = expectedProjectVersion; this.bridge = bridge; this.restartPolicy = restartPolicy; this.now = now; this.launcher = launcher; this.restartTimes = []; this.state = {}; this.errors = []; this.running = false;
  }
  manifest() { return createAdapterManifest({ adapterId: 'touchdesigner', type: 'touchdesigner', displayName: 'TouchDesigner', version: this.adapterVersion, capabilities: PHASE_1_ACTIONS }); }
  async start() { if (!this.executablePath || !this.projectPath || !this.expectedProjectVersion) throw new EndpointError(ERROR_CODES.adapterStartFailed, 'TouchDesigner executable, project path and expected project version are required.'); this.process = this.launcher(this.executablePath, [this.projectPath], { stdio: 'ignore' }); await this.bridge.connect(); this.running = true; return this.confirmProjectVersion(this.expectedProjectVersion); }
  async stop() { this.process?.kill?.(); this.running = false; }
  async confirmProjectVersion(version) { const result = await this.bridge.send({ type: 'project.confirmVersion', expectedProjectVersion: version }); return result ?? { expectedProjectVersion: version }; }
  async validateConfiguration(configuration) { if (!configuration?.touchdesigner?.projectPath && !this.projectPath) throw new EndpointError(ERROR_CODES.configurationRejected, 'Active configuration must provide TouchDesigner project metadata.'); return { adapterId: 'touchdesigner', status: 'valid' }; }
  async execute(command) { if (command.action === 'preset.activate' && Array.isArray(command.parameters?.steps)) return this.executePreset(command); const result = await this.bridge.send({ type: 'command.execute', action: command.action, parameters: command.parameters ?? {} }); this.updateState(command); return { appliedAction: command.action, bridgeResult: result, reportedState: await this.reportedState() }; }
  async executePreset(command) { const completed = []; for (const step of command.parameters.steps) { if (step.critical === false) continue; await this.execute({ ...command, action: step.action, parameters: step.parameters ?? {} }); completed.push(step.action); } this.state.activePreset = command.parameters.presetId; return { appliedAction: command.action, completedSteps: completed, partialSuccess: completed.length !== command.parameters.steps.length, reportedState: await this.reportedState() }; }
  updateState(command) { if (command.action === 'holding.show') this.state.holdingVisible = true; if (command.action === 'holding.hide') this.state.holdingVisible = false; if (command.action === 'video.output.selectSource') this.state.videoSource = command.parameters?.source; if (command.action === 'audio.microphones.setMuted') this.state.microphonesMuted = Boolean(command.parameters?.muted); if (command.action === 'audio.master.setVolume') this.state.masterVolume = command.parameters?.volume; }
  async reportedState() { return { ...this.state, projectVersion: this.expectedProjectVersion }; }
  health() { const stale = this.bridge.lastHeartbeatAt && this.now().getTime() - this.bridge.lastHeartbeatAt.getTime() > this.restartPolicy.heartbeatTimeoutMs; return createHealth({ adapterId: 'touchdesigner', status: this.running && !stale ? 'healthy' : 'degraded', checks: { connected: this.bridge.connected, heartbeatStale: Boolean(stale), restartCount: this.restartTimes.length }, errors: this.errors }); }
  async checkHeartbeat() { if (!this.bridge.lastHeartbeatAt || this.now().getTime() - this.bridge.lastHeartbeatAt.getTime() <= this.restartPolicy.heartbeatTimeoutMs) return { status: 'healthy' }; return this.restartAfterHeartbeatLoss(); }
  async restartAfterHeartbeatLoss() { const cutoff = this.now().getTime() - this.restartPolicy.windowMs; this.restartTimes = this.restartTimes.filter((time) => time.getTime() >= cutoff); if (this.restartTimes.length >= this.restartPolicy.maxRestarts) { const error = new EndpointError(ERROR_CODES.touchdesignerRestartLimitReached, 'TouchDesigner restart limit reached; adapter is degraded.'); this.errors.push(error); this.running = false; return { status: 'degraded', error }; } this.restartTimes.push(this.now()); await this.stop(); await this.start(); return { status: 'restarted' }; }
}
