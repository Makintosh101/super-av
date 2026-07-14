# API and Message Contracts

## Related standards

- `docs/standards/PRODUCT_TERMINOLOGY.md`
- `docs/standards/NAMING_STANDARDS.md`
- `docs/standards/ERROR_STANDARD.md`
- `docs/standards/VERSIONING_POLICY.md`

## Principle

The cloud API must describe business actions and device capabilities.

It must not expose internal paths such as:

```text
/project1/base2/switch1/index
```

Use:

```text
video.output.selectSource
audio.microphones.setMuted
preset.activate
```

## Capability manifest

The endpoint publishes its available capabilities.

```json
{
  "deviceId": "dev_01K...",
  "manifestVersion": "1.0",
  "adapters": [
    {
      "adapterType": "touchdesigner",
      "adapterVersion": "1.0.0",
      "capabilities": [
        {
          "id": "video.output.selectSource",
          "version": "1.0"
        },
        {
          "id": "audio.microphones.setMuted",
          "version": "1.0"
        },
        {
          "id": "preset.activate",
          "version": "1.0"
        }
      ]
    }
  ]
}
```

## Core gateway messages

### Device hello

```json
{
  "type": "device.hello",
  "messageId": "msg_01K...",
  "deviceId": "dev_01K...",
  "agentVersion": "1.0.0",
  "protocolVersion": "1.0",
  "lastConfigurationRevision": 42,
  "lastReportedStateRevision": 880
}
```

### Server welcome

```json
{
  "type": "server.welcome",
  "messageId": "msg_01K...",
  "connectionId": "conn_01K...",
  "serverTime": "2026-07-14T16:45:00Z",
  "heartbeatIntervalSeconds": 20,
  "desiredConfigurationRevision": 43
}
```

### Heartbeat

```json
{
  "type": "device.heartbeat",
  "messageId": "msg_01K...",
  "sentAt": "2026-07-14T16:45:20Z",
  "agentUptimeSeconds": 86122,
  "adapterHealth": "healthy"
}
```

### Command

```json
{
  "type": "device.command",
  "messageId": "msg_01K...",
  "command": {
    "commandId": "cmd_01K...",
    "action": "preset.activate",
    "parameters": {
      "presetId": "presentation"
    },
    "expiresAt": "2026-07-14T16:45:30Z",
    "configurationRevision": 43
  }
}
```

### Command acknowledgement

```json
{
  "type": "device.commandAcknowledged",
  "messageId": "msg_01K...",
  "commandId": "cmd_01K...",
  "status": "accepted"
}
```

### Command completion

```json
{
  "type": "device.commandCompleted",
  "messageId": "msg_01K...",
  "commandId": "cmd_01K...",
  "status": "succeeded",
  "reportedStateRevision": 881
}
```

### State change

```json
{
  "type": "device.stateChanged",
  "messageId": "msg_01K...",
  "deviceId": "dev_01K...",
  "revision": 881,
  "changes": {
    "video.mainOutput.source": "presentation",
    "audio.microphones.muted": false
  }
}
```

### Health event

```json
{
  "type": "device.healthChanged",
  "messageId": "msg_01K...",
  "deviceId": "dev_01K...",
  "status": "degraded",
  "issues": [
    {
      "code": "TOUCHDESIGNER-8001",
      "severity": "Warning",
      "firstObservedAt": "2026-07-14T16:44:30Z"
    }
  ]
}
```

## REST provisioning endpoints

Suggested endpoints:

```text
POST /api/v1/node/registrations
GET  /api/v1/node/registrations/{registrationId}
POST /api/v1/pairing/sessions
POST /api/v1/pairing/sessions/{code}/claim
POST /api/v1/node/certificates/rotate
GET  /api/v1/node/bootstrap
```

## Configuration endpoints

```text
GET  /api/v1/configuration/desired
POST /api/v1/configuration/report
GET  /api/v1/node/releases/{releaseId}/manifest
```

## Command API

```text
POST /api/v1/rooms/{roomId}/commands
GET  /api/v1/commands/{commandId}
```

The API should return the command record immediately. Real-time completion should arrive over WebSocket.

## Error structure

```json
{
  "error": {
    "code": "NODE-1001",
    "message": "The assigned node does not expose the required capability.",
    "severity": "Error",
    "category": "Node",
    "correlationId": "corr_01K...",
    "timestamp": "2026-07-14T16:45:30Z",
    "details": {
      "capability": "audio.microphones.setMuted"
    }
  }
}
```

## Versioning

Version independently:

- REST API
- WebSocket protocol
- Capability contracts
- Adapter packages
- Configuration schemas
- UI schemas

Avoid requiring all parts of the platform to update together.

## Idempotency

Use idempotency for:

- Device registration
- Pairing confirmation
- Configuration publication
- Commands
- Software deployments
- Webhook processing

A repeated request with the same idempotency key must not perform the action twice.

## Event ordering

Do not assume all events arrive in order.

Use:

- Revision numbers
- Timestamps
- Command IDs
- Sequence numbers per connection where useful

The endpoint and cloud should ignore stale state revisions.
