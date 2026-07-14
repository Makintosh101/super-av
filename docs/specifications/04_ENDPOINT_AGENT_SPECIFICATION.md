# Endpoint Agent Specification

## Working name

**BE Endpoint Node Agent**

## Platform

Initial target:

- Windows 11 Enterprise
- x64
- .NET
- Windows service
- Optional local commissioning UI
- SQLite local database

The core design should avoid unnecessary Windows-only assumptions so that Linux support remains possible later.

## Responsibilities

The agent is responsible for:

1. Device identity
2. Provisioning and pairing
3. Cloud connection
4. Configuration synchronisation
5. Command handling
6. Adapter hosting
7. State reporting
8. Health telemetry
9. Local persistence
10. Process supervision
11. Software updates
12. Offline operation
13. Audit event buffering

## Internal modules

```text
Endpoint Agent
├── Identity Manager
├── Provisioning Client
├── Cloud Connection Manager
├── Command Dispatcher
├── Configuration Manager
├── Desired State Reconciler
├── Adapter Host
├── Process Supervisor
├── Telemetry Collector
├── Update Manager
├── Local API
├── Local Database
└── Audit Buffer
```

## Startup sequence

```text
Windows starts
    ↓
Agent service starts
    ↓
Load protected identity
    ↓
Open local database
    ↓
Validate installed adapters
    ↓
Load last known configuration
    ↓
Start required local applications
    ↓
Connect to cloud
    ↓
Authenticate device
    ↓
Synchronise time and configuration
    ↓
Publish capabilities and reported state
    ↓
Enter normal reconciliation loop
```

## Adapter contract

Each adapter should implement a stable contract similar to:

```csharp
public interface IEndpointAdapter
{
    string AdapterType { get; }
    string AdapterVersion { get; }

    Task<AdapterManifest> GetManifestAsync();
    Task StartAsync(AdapterContext context, CancellationToken cancellationToken);
    Task StopAsync(CancellationToken cancellationToken);

    Task<ValidationResult> ValidateConfigurationAsync(
        JsonDocument configuration,
        CancellationToken cancellationToken);

    Task<CommandResult> ExecuteCommandAsync(
        EndpointCommand command,
        CancellationToken cancellationToken);

    Task<JsonDocument> GetReportedStateAsync(
        CancellationToken cancellationToken);

    Task<HealthReport> GetHealthAsync(
        CancellationToken cancellationToken);
}
```

## TouchDesigner adapter

The first product adapter should:

- Start TouchDesigner with the assigned project
- Confirm the expected project version
- Connect over localhost WebSocket
- Send product-level commands
- Receive TouchDesigner state
- Detect project heartbeat loss
- Restart TouchDesigner within policy
- Collect engine FPS and errors
- Report available modules and capabilities

The cloud must not know TouchDesigner operator paths.

## Command processing requirements

Every command should have:

- Command ID
- Device ID
- Issued timestamp
- Expiry timestamp
- Actor
- Action
- Parameters
- Required capability
- Expected configuration revision
- Idempotency key

Example:

```json
{
  "commandId": "cmd_01K0...",
  "deviceId": "dev_01K0...",
  "action": "preset.activate",
  "parameters": {
    "presetId": "presentation"
  },
  "issuedAt": "2026-07-14T16:30:00Z",
  "expiresAt": "2026-07-14T16:30:10Z",
  "configurationRevision": 42,
  "idempotencyKey": "session-123-presentation-8"
}
```

The agent must reject commands that are:

- Expired
- For another device
- Unsupported
- Missing required permissions or capability claims
- Based on an incompatible configuration revision
- Duplicates already completed
- Invalid under local safety policy

## Command result

```json
{
  "commandId": "cmd_01K0...",
  "status": "succeeded",
  "startedAt": "2026-07-14T16:30:00.120Z",
  "completedAt": "2026-07-14T16:30:00.540Z",
  "reportedStateRevision": 881
}
```

Possible statuses:

```text
accepted
running
succeeded
failed
rejected
expired
cancelled
partially_applied
```

## Desired-state reconciliation

For durable settings, the agent should reconcile desired state rather than rely only on commands.

Examples:

- Assigned room
- Active configuration version
- Required agent release
- Required adapter release
- Startup preset
- Volume limits
- Allowed modules

Process:

```text
Receive desired state
    ↓
Compare with local reported state
    ↓
Validate required changes
    ↓
Apply safe changes
    ↓
Report success or error
    ↓
Retry according to policy
```

## Local API

Expose a local-only API for:

- Health checks
- Commissioning UI
- Diagnostic export
- Controlled restart
- Pairing display
- Current assignment

Recommended access:

```text
Named pipes for privileged local operations
HTTP on 127.0.0.1 for read-only diagnostics
```

Do not expose the local API to all network interfaces by default.

## Local storage

Suggested tables:

```text
device_identity
device_assignment
configuration_cache
adapter_installations
desired_state
reported_state
command_history
pending_events
update_history
process_status
local_settings
```

## Telemetry

Collect:

- Agent uptime
- Agent version
- Connection status
- Last cloud contact
- CPU
- Memory
- GPU
- Disk usage
- Network interfaces
- Adapter health
- Application process health
- Current configuration version
- Recent error counts

High-frequency metrics should be aggregated locally before upload.

## Logging

Maintain:

- Structured application log
- Security log
- Command log
- Update log
- Adapter log
- Windows Event Log integration

Logs should include correlation IDs but must avoid storing secrets.

## Service account

Run the Windows service with the minimum required permissions.

Where TouchDesigner requires an interactive user session:

- Keep the core agent as a Windows service.
- Run a separate supervised user-session process for display output.
- Use authenticated local IPC between the service and user-session process.
