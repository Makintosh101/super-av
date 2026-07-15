import { PHASE_1_ACTIONS } from '../command-dispatcher.mjs';
import { createAdapterManifest, createHealth } from './adapter-contract.mjs';

export class SimulatedNodeAdapter {
  constructor({ adapterVersion = '0.1.0' } = {}) { this.adapterVersion = adapterVersion; this.running = false; this.state = { holding: { visible: false }, video: { source: 'presentation' }, audio: { microphonesMuted: false, masterVolume: 50 }, preset: { activePresetId: null }, system: { online: true } }; }
  manifest() { return createAdapterManifest({ adapterId: 'simulated-touchdesigner', type: 'touchdesigner', displayName: 'Simulated TouchDesigner', version: this.adapterVersion, capabilities: PHASE_1_ACTIONS }); }
  async start() { this.running = true; }
  async stop() { this.running = false; }
  async validateConfiguration(configuration) { return { adapterId: 'simulated-touchdesigner', status: 'valid', configurationRevision: configuration?.configurationRevision }; }
  async execute(command) {
    if (command.action === 'holding.show') this.state.holding.visible = true;
    if (command.action === 'holding.hide') this.state.holding.visible = false;
    if (command.action === 'video.output.selectSource') this.state.video.source = command.parameters?.source ?? command.parameters?.sourceId ?? 'presentation';
    if (command.action === 'audio.microphones.setMuted') this.state.audio.microphonesMuted = Boolean(command.parameters?.muted);
    if (command.action === 'audio.master.setVolume') this.state.audio.masterVolume = command.parameters?.volume ?? command.parameters?.level ?? this.state.audio.masterVolume;
    if (command.action === 'preset.activate') this.state.preset.activePresetId = command.parameters?.presetId ?? command.parameters?.id;
    if (command.action === 'system.restartApplication') this.state.system.lastRestartAt = new Date().toISOString();
    return { appliedAction: command.action, reportedState: await this.reportedState() };
  }
  async reportedState() { return structuredClone(this.state); }
  health() { return createHealth({ adapterId: 'simulated-touchdesigner', status: this.running ? 'healthy' : 'stopped', checks: { deterministic: true } }); }
}
