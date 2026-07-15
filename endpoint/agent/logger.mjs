const SECRET_KEYS = new Set(['privateKey', 'private_key', 'token', 'accessToken', 'pairingCode']);
function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, SECRET_KEYS.has(k) ? '[REDACTED]' : sanitize(v)]));
  }
  return value;
}
export class StructuredLogger {
  constructor(sink = console.log) { this.sink = sink; }
  event(level, message, fields = {}) {
    this.sink(JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...sanitize(fields) }));
  }
  info(message, fields) { this.event('info', message, fields); }
  error(message, fields) { this.event('error', message, fields); }
}
