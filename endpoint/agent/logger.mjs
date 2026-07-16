const SECRET_KEY_PATTERNS = [/password/i, /private/i, /secret/i, /token/i, /signedUrl/i, /protectedUrl/i, /pairingCode/i];

export function sanitizeLogFields(value) {
  if (Array.isArray(value)) return value.map(sanitizeLogFields);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, isSensitiveKey(key) ? '[REDACTED]' : sanitizeLogFields(item)]));
  }
  return value;
}

export class StructuredLogger {
  constructor({ sink = console.log, component = 'endpoint.agent', now = () => new Date() } = {}) {
    if (typeof sink === 'function') this.sink = sink;
    else this.sink = sink.write.bind(sink);
    this.component = component;
    this.now = now;
  }

  event(level, message, fields = {}) {
    const sanitized = sanitizeLogFields(fields);
    this.sink(JSON.stringify({
      timestamp: this.now().toISOString(),
      level,
      component: this.component,
      message,
      correlationId: sanitized.correlationId ?? null,
      actorId: sanitized.actorId ?? sanitized.userId ?? null,
      deviceId: sanitized.deviceId ?? null,
      commandId: sanitized.commandId ?? null,
      errorCode: sanitized.errorCode ?? sanitized.code ?? null,
      ...sanitized
    }));
  }

  info(message, fields) { this.event('info', message, fields); }
  error(message, fields) { this.event('error', message, fields); }
}

function isSensitiveKey(key) { return SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key)); }
