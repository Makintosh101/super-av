import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export class JsonCommandDeduplicationStore {
  constructor({ path, replayWindowMilliseconds = 24 * 60 * 60 * 1000, now = () => new Date() }) {
    this.path = path;
    this.replayWindowMilliseconds = replayWindowMilliseconds;
    this.now = now;
  }

  async find(command) {
    const records = await this.load();
    const now = this.now().getTime();
    const match = records.find((record) => record.commandId === command.commandId || record.idempotencyKey === command.idempotencyKey);
    if (!match || new Date(match.expiresAt).getTime() <= now) return null;
    return match;
  }

  async record(command, result) {
    const records = (await this.load()).filter((record) => new Date(record.expiresAt).getTime() > this.now().getTime());
    const expiresAt = new Date(this.now().getTime() + this.replayWindowMilliseconds).toISOString();
    records.push({ commandId: command.commandId, idempotencyKey: command.idempotencyKey, correlationId: command.correlationId, status: result.status, completedAt: result.completedAt, expiresAt, result });
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, JSON.stringify(records, null, 2));
  }

  async load() {
    try { return JSON.parse(await readFile(this.path, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  }
}
