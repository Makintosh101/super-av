# Phase 1 Build Plan

## Phase 1 objective

Prove a complete reusable device lifecycle using one Windows endpoint and one TouchDesigner adapter.

The finished demonstration should show:

```text
Install Agent
    ↓
Generate device identity
    ↓
Display pairing code
    ↓
Claim device in cloud
    ↓
Assign device to room
    ↓
Push configuration
    ↓
Send a command
    ↓
TouchDesigner executes action
    ↓
State returns to browser
    ↓
Device reconnects after network loss and reboot
```

## Suggested workstreams

### Workstream 1: Endpoint agent foundation

Build:

- Windows service
- Device ID generation
- Protected key storage
- SQLite database
- Structured logging
- Cloud provisioning client
- Secure WebSocket client
- Heartbeat
- Basic system health
- Local diagnostic endpoint

### Workstream 2: Device provisioning

Build:

- Pending device registration
- Pairing-code generation
- Admin claim screen
- Company ownership
- Device certificate issuance
- Device assignment to room

### Workstream 3: Command and state protocol

Build:

- Device hello
- Heartbeat
- Command delivery
- Command acknowledgement
- Command completion
- State revision
- Desired configuration revision
- Command expiry
- Idempotency

### Workstream 4: TouchDesigner adapter

Build:

- Launch TouchDesigner
- Load standard `.toe`
- Local WebSocket connection
- Adapter heartbeat
- `holding.show`
- `video.output.selectSource`
- `audio.microphones.setMuted`
- `preset.activate`
- Report current state
- Restart on heartbeat failure

### Workstream 5: Cloud interface

Build:

- Device list
- Unclaimed-device queue
- Pairing screen
- Device detail page
- Room assignment
- Basic room control page
- Online/offline indicator
- Command status
- Basic event log

### Workstream 6: Recovery

Build:

- Agent auto-start
- TouchDesigner auto-start
- Network reconnection
- Local configuration cache
- Command expiry
- Event queue
- Reboot recovery
- Basic known-good configuration rollback

## Suggested delivery stages

### Stage A: local prototype

- Agent starts
- TouchDesigner adapter connects
- Local command changes TouchDesigner
- State returns locally

### Stage B: cloud-connected endpoint

- Endpoint registers
- Secure WebSocket connects
- Cloud sends command
- Endpoint reports result

### Stage C: pairing and ownership

- Pairing code
- Admin claim
- Device assignment
- Room configuration

### Stage D: resilience

- Disconnect internet
- Continue local output
- Reconnect
- Reboot
- Restore active configuration
- Restart failed TouchDesigner process

### Stage E: reusable packaging

- Installer
- Environment configuration
- Adapter manifest
- Developer documentation
- Example adapter
- Test harness
- Release process

## Initial command set

Keep the first command set small:

```text
system.getStatus
system.restartApplication
preset.activate
video.output.selectSource
holding.show
holding.hide
audio.microphones.setMuted
audio.master.setVolume
```

## Initial state set

```json
{
  "system": {
    "health": "healthy",
    "agentVersion": "1.0.0",
    "applicationRunning": true
  },
  "video": {
    "mainOutputSource": "holding"
  },
  "holding": {
    "visible": true,
    "assetId": "default-logo"
  },
  "audio": {
    "microphonesMuted": true,
    "masterVolume": 60
  }
}
```

## Suggested repository structure

```text
endpoint-platform/
├── docs/
├── cloud/
│   ├── platform-api/
│   ├── device-gateway/
│   ├── workers/
│   └── web-app/
├── endpoint/
│   ├── agent-service/
│   ├── commissioning-ui/
│   ├── adapter-sdk/
│   ├── adapters/
│   │   └── touchdesigner/
│   └── installer/
├── contracts/
│   ├── websocket/
│   ├── rest/
│   ├── capabilities/
│   └── configuration/
├── touchdesigner/
│   ├── project/
│   ├── modules/
│   └── test-project/
├── tests/
│   ├── integration/
│   ├── resilience/
│   └── protocol/
└── deployment/
```

## Recommended first milestone

The first milestone is complete when:

1. A clean Windows PC installs the agent.
2. The endpoint displays a code.
3. An admin claims it in the web UI.
4. The cloud assigns a room configuration.
5. A user presses “Presentation”.
6. TouchDesigner changes source.
7. The browser displays the confirmed result.
8. The endpoint survives a reboot without manual repair.
