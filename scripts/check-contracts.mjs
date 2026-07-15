import { readFileSync } from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const hardwarePath = /\/project\d+|project\d+|base\d+|switch\d+/i;
const ulid = '[0-9A-HJKMNP-TV-Z]{26}';
const patterns = { messageId: new RegExp(`^msg_${ulid}$`), deviceId: new RegExp(`^dev_${ulid}$`), connectionId: new RegExp(`^conn_${ulid}$`), commandId: new RegExp(`^cmd_${ulid}$`), utc: /Z$/ };
const actions = new Set(['system.getStatus','system.restartApplication','preset.activate','video.output.selectSource','holding.show','holding.hide','audio.microphones.setMuted','audio.master.setVolume']);
const wsTypes = ['device.hello','server.welcome','device.heartbeat','device.command','device.commandAcknowledged','device.commandCompleted','device.stateChanged','device.healthChanged'];
const fail = [];
function readJson(file){ try { return JSON.parse(readFileSync(path.join(root,file),'utf8')); } catch(e){ fail.push(`${file}: ${e.message}`); return null; } }
function assert(c,m){ if(!c) fail.push(m); }
function validateWs(msg){
  assert(wsTypes.includes(msg.type), `${msg.type}: unknown type`);
  assert(patterns.messageId.test(msg.messageId ?? ''), `${msg.type}: invalid messageId`);
  assert(!hardwarePath.test(JSON.stringify(msg)), `${msg.type}: exposes hardware path`);
  if(msg.deviceId) assert(patterns.deviceId.test(msg.deviceId), `${msg.type}: invalid deviceId`);
  if(msg.connectionId) assert(patterns.connectionId.test(msg.connectionId), `${msg.type}: invalid connectionId`);
  if(msg.sentAt) assert(patterns.utc.test(msg.sentAt), `${msg.type}: sentAt must be UTC`);
  if(msg.serverTime) assert(patterns.utc.test(msg.serverTime), `${msg.type}: serverTime must be UTC`);
  if(msg.command){
    assert(patterns.commandId.test(msg.command.commandId ?? ''), `${msg.type}: invalid commandId`);
    assert(patterns.deviceId.test(msg.command.deviceId ?? ''), `${msg.type}: invalid command deviceId`);
    assert(actions.has(msg.command.action), `${msg.type}: invalid action`);
    assert(patterns.utc.test(msg.command.issuedAt ?? ''), `${msg.type}: issuedAt must be UTC`);
    assert(patterns.utc.test(msg.command.expiresAt ?? ''), `${msg.type}: expiresAt must be UTC`);
    assert(typeof msg.command.idempotencyKey === 'string' && msg.command.idempotencyKey.length >= 8, `${msg.type}: idempotencyKey required`);
  }
  if(msg.changes) Object.keys(msg.changes).forEach(k => assert(!hardwarePath.test(k), `${msg.type}: hardware state path ${k}`));
}
for (const t of wsTypes) {
  assert(readJson(`contracts/schemas/ws/${t}.schema.json`), `missing schema ${t}`);
  const before = fail.length;
  const good = readJson(`contracts/fixtures/ws/valid/${t}.json`);
  if (good) validateWs(good);
  assert(fail.length === before, `valid fixture failed for ${t}`);
  const bad = readJson(`contracts/fixtures/ws/invalid/${t}.json`);
  if (bad) {
    const save = [...fail];
    fail.length = 0;
    validateWs(bad);
    const rejected = fail.length > 0;
    fail.length = 0;
    fail.push(...save);
    assert(rejected, `invalid fixture unexpectedly accepted for ${t}`);
  }
}
for (const file of ['contracts/fixtures/capability/phase1-single-node.json','contracts/fixtures/configuration/phase1-room-configuration.json','contracts/fixtures/errors/phase1-error-catalogue.json']) {
  const doc = readJson(file);
  assert(doc && !hardwarePath.test(JSON.stringify(doc)), `${file}: exposes hardware path`);
}
const manifest = readJson('contracts/fixtures/capability/phase1-single-node.json');
if (manifest) {
  for (const adapter of manifest.adapters ?? []) {
    assert(['touchdesigner','system_health'].includes(adapter.adapterType), `unsupported adapter ${adapter.adapterType}`);
    for (const cap of adapter.capabilities ?? []) assert(actions.has(cap.id), `unsupported capability ${cap.id}`);
  }
}
const catalogue = readJson('contracts/fixtures/errors/phase1-error-catalogue.json');
if (catalogue) {
  const cats = new Set((catalogue.errors ?? []).map(e=>e.category));
  for (const c of ['Provisioning','Pairing','Authentication','Command','Capability','Configuration','Adapter','Package']) assert(cats.has(c), `missing error category ${c}`);
}
for (const f of ['contracts/openapi/node-api.yaml','contracts/openapi/command-api.yaml']) {
  const txt = readFileSync(path.join(root,f),'utf8');
  assert(txt.includes('openapi: 3.1.0'), `${f}: missing OpenAPI version`);
  assert(txt.includes('X-Correlation-Id'), `${f}: missing correlation ID`);
  assert(!hardwarePath.test(txt), `${f}: exposes hardware path`);
}
if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
console.log('Contract schemas, fixtures and OpenAPI stubs passed Phase 1 validation.');
