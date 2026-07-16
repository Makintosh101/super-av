import { sanitizeLogFields } from '../endpoint/agent/logger.mjs';

export class CloudStructuredLogger {
  constructor({ sink = console.log, component = 'cloud.service', now = () => new Date() } = {}) {
    this.sink = typeof sink === 'function' ? sink : sink.write.bind(sink);
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
      errorCode: sanitized.errorCode ?? sanitized.code ?? null,
      ...sanitized
    }));
  }

  info(message, fields) { this.event('info', message, fields); }
  error(message, fields) { this.event('error', message, fields); }
}
