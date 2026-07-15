import { cpus, freemem, totalmem, loadavg } from 'node:os';
import { statfs } from 'node:fs/promises';
import { createAdapterManifest, createHealth } from './adapter-contract.mjs';

export class SystemHealthAdapter {
  constructor({ agentVersion = '0.1.0', adapterVersion = '0.1.0', diskPath = '.', diskAlertFreeBytes = 1024 * 1024 * 1024, recentErrors = [] } = {}) {
    this.agentVersion = agentVersion; this.adapterVersion = adapterVersion; this.diskPath = diskPath; this.diskAlertFreeBytes = diskAlertFreeBytes; this.recentErrors = recentErrors; this.running = false; this.last = null;
  }
  manifest() { return createAdapterManifest({ adapterId: 'system-health', type: 'systemHealth', displayName: 'System Health', version: this.adapterVersion, capabilities: ['system.getStatus'] }); }
  async start() { this.running = true; this.last = await this.snapshot(); }
  async stop() { this.running = false; }
  async validateConfiguration() { return { adapterId: 'system-health', status: 'valid' }; }
  async execute(command) { if (command.action !== 'system.getStatus') throw new Error(`System Health adapter cannot execute ${command.action}.`); return this.snapshot(); }
  async reportedState() { return this.snapshot(); }
  health() { return createHealth({ adapterId: 'system-health', status: this.running ? 'healthy' : 'stopped', checks: this.last ?? {}, errors: this.recentErrors }); }
  async snapshot() {
    const disk = await statfs(this.diskPath).then((stats) => ({ freeBytes: stats.bavail * stats.bsize, totalBytes: stats.blocks * stats.bsize })).catch((error) => ({ unavailable: true, error: error.message }));
    return { agentVersion: this.agentVersion, adapterVersion: this.adapterVersion, cpu: { cores: cpus().length, loadAverage: loadavg() }, memory: { freeBytes: freemem(), totalBytes: totalmem() }, disk: { ...disk, alert: disk.freeBytes !== undefined && disk.freeBytes < this.diskAlertFreeBytes ? 'lowDiskSpace' : undefined }, gpu: { available: false, reason: 'notReportedByNodeRuntime' }, recentErrors: this.recentErrors };
  }
}
