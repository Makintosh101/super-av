import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { EndpointError, ERROR_CODES } from './errors.mjs';

async function load(path, fallback) { try { return JSON.parse(await readFile(path, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return fallback; throw error; } }
async function save(path, value) { await mkdir(dirname(path), { recursive: true }); await writeFile(path, JSON.stringify(value, null, 2)); }

export class ReportedStatePublisher {
  constructor({ path, transport, now = () => new Date() }) { this.path = path; this.transport = transport; this.now = now; }
  async publish(partialState) {
    const state = await load(this.path, { revision: 0, queued: [], current: {} });
    const revision = state.revision + 1;
    const message = { type: 'device.stateChanged', revision, changedAt: this.now().toISOString(), state: { ...state.current, ...partialState } };
    state.revision = revision; state.current = message.state;
    try { await this.transport.send(message); } catch (error) { state.queued.push(message); state.lastErrorCode = error.code ?? ERROR_CODES.statePublishFailed; }
    await save(this.path, state);
    return message;
  }
  async reconcile(remoteRevision = 0) {
    const state = await load(this.path, { revision: 0, queued: [], current: {} });
    if (remoteRevision > state.revision) throw new EndpointError(ERROR_CODES.staleReportedState, 'Remote reported state is newer than local state.');
    const queued = state.queued.filter((message) => message.revision > remoteRevision);
    for (const message of queued) await this.transport.send(message);
    state.queued = [];
    await save(this.path, state);
  }
}

export class LocalEventQueue {
  constructor({ path, transport, maxEvents = 1000, diskSpaceAvailable = () => true, now = () => new Date() }) { this.path = path; this.transport = transport; this.maxEvents = maxEvents; this.diskSpaceAvailable = diskSpaceAvailable; this.now = now; }
  async enqueue(event) {
    const queue = await load(this.path, { events: [], diagnostics: {} });
    if (queue.events.length >= this.maxEvents || !this.diskSpaceAvailable()) queue.diagnostics = { capacity: queue.events.length, maxEvents: this.maxEvents, diskSpace: this.diskSpaceAvailable() ? 'available' : 'low' };
    queue.events.push({ ...event, occurredAt: event.occurredAt ?? this.now().toISOString() });
    queue.events.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
    await save(this.path, queue);
  }
  async flush() {
    const queue = await load(this.path, { events: [], diagnostics: {} });
    const remaining = [];
    for (const event of queue.events) { try { await this.transport.send({ type: 'device.auditEvent', ...event }); } catch (error) { remaining.push({ ...event, lastErrorCode: error.code ?? ERROR_CODES.eventUploadFailed }); } }
    queue.events = remaining;
    await save(this.path, queue);
    return { uploaded: remaining.length === 0, remaining: remaining.length, diagnostics: queue.diagnostics };
  }
}
