import test from 'node:test';
import assert from 'node:assert/strict';
import { AdapterHost } from '../endpoint/agent/adapters/adapter-host.mjs';
import { createAdapterManifest } from '../endpoint/agent/adapters/adapter-contract.mjs';
import { SystemHealthAdapter } from '../endpoint/agent/adapters/system-health-adapter.mjs';
import { SimulatedNodeAdapter } from '../endpoint/agent/adapters/simulated-node-adapter.mjs';
import { LocalhostTouchDesignerBridge, TouchDesignerAdapter } from '../endpoint/agent/adapters/touchdesigner-adapter.mjs';

function memorySocket() {
  const sent = [];
  return { sent, send: async (payload) => { sent.push(JSON.parse(payload)); return { ok: true }; } };
}

test('adapter contract and host load Phase 1 adapters with degraded startup diagnostics', async () => {
  const failing = {
    manifest: () => createAdapterManifest({ adapterId: 'bad-touchdesigner', type: 'touchdesigner', displayName: 'Bad TouchDesigner', version: '0.1.0', capabilities: ['holding.show'] }),
    start: async () => { throw new Error('launch failed'); }, stop: async () => {}, validateConfiguration: async () => ({}), execute: async () => ({}), reportedState: async () => ({}), health: () => ({ status: 'degraded' })
  };
  const host = new AdapterHost({ adapters: [new SystemHealthAdapter(), failing], logger: { error: () => {} } });
  const health = await host.start();
  assert.equal(health.status, 'degraded');
  assert.deepEqual(host.manifests().map((manifest) => manifest.type), ['systemHealth', 'touchdesigner']);
});

test('system health adapter reports expected health fields and low disk alert', async () => {
  const adapter = new SystemHealthAdapter({ diskAlertFreeBytes: Number.MAX_SAFE_INTEGER });
  await adapter.start();
  const state = await adapter.reportedState();
  assert.equal(typeof state.agentVersion, 'string');
  assert.equal(typeof state.adapterVersion, 'string');
  assert.ok(state.cpu.cores >= 1);
  assert.equal(state.disk.alert, 'lowDiskSpace');
  assert.equal(adapter.health().adapterId, 'system-health');
});

test('simulated adapter executes Phase 1 commands with deterministic state changes', async () => {
  const adapter = new SimulatedNodeAdapter();
  await adapter.start();
  await adapter.execute({ action: 'holding.show', parameters: {} });
  await adapter.execute({ action: 'video.output.selectSource', parameters: { source: 'hdmi2' } });
  await adapter.execute({ action: 'audio.microphones.setMuted', parameters: { muted: true } });
  await adapter.execute({ action: 'audio.master.setVolume', parameters: { volume: 35 } });
  await adapter.execute({ action: 'preset.activate', parameters: { presetId: 'preset_1' } });
  const state = await adapter.reportedState();
  assert.deepEqual(state, { holding: { visible: true }, video: { source: 'hdmi2' }, audio: { microphonesMuted: true, masterVolume: 35 }, preset: { activePresetId: 'preset_1' }, system: { online: true } });
});

test('TouchDesigner bridge enforces localhost, message size and protocol version', async () => {
  assert.throws(() => new LocalhostTouchDesignerBridge({ url: 'ws://192.0.2.10:9980', socketFactory: async () => memorySocket() }), /localhost/);
  const socket = memorySocket();
  const bridge = new LocalhostTouchDesignerBridge({ maxMessageBytes: 120, socketFactory: async () => socket });
  await bridge.connect();
  await bridge.send({ type: 'command.execute', action: 'holding.show' });
  assert.equal(socket.sent[0].protocolVersion, 'phase1.touchdesigner.v1');
  await assert.rejects(() => bridge.send({ type: 'x'.repeat(200) }), /maximum size/);
  assert.throws(() => bridge.validateMessage({ protocolVersion: 'wrong' }), /protocol version/);
});

test('TouchDesigner adapter launches configured project, maps commands and enters degraded mode after restart limit', async () => {
  let launches = 0;
  const socket = memorySocket();
  let current = new Date('2026-07-15T00:00:00Z');
  const adapter = new TouchDesignerAdapter({
    executablePath: '/TouchDesigner.exe', projectPath: '/project.toe', expectedProjectVersion: 'project-v1',
    bridge: new LocalhostTouchDesignerBridge({ socketFactory: async () => socket }), now: () => current,
    launcher: () => ({ kill: () => {} }), restartPolicy: { heartbeatTimeoutMs: 1000, maxRestarts: 1, windowMs: 60000 }
  });
  adapter.launcher = () => { launches += 1; return { kill: () => {} }; };
  await adapter.start();
  await adapter.execute({ action: 'holding.show', parameters: {} });
  assert.equal((await adapter.reportedState()).holdingVisible, true);
  adapter.bridge.recordHeartbeat(new Date('2026-07-15T00:00:00Z'));
  current = new Date('2026-07-15T00:00:02Z');
  assert.equal((await adapter.checkHeartbeat()).status, 'restarted');
  current = new Date('2026-07-15T00:00:04Z');
  assert.equal((await adapter.checkHeartbeat()).status, 'degraded');
  assert.equal(launches, 2);
});
