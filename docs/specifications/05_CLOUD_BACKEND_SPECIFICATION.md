# Cloud Backend Specification

Related standards: `docs/standards/PRODUCT_TERMINOLOGY.md`, `docs/standards/NAMING_STANDARDS.md`, `docs/standards/ERROR_STANDARD.md`, `docs/standards/VERSIONING_POLICY.md`.

## Purpose

The cloud platform manages operators, technicians, administrators, deployments, nodes, configuration, commands, releases and audit records.

It is the control plane. It should not carry video or audio frames.

## Recommended initial services

### 1. Identity and access

Provides:

- User accounts
- Company membership
- Roles
- Session tokens
- Technician and admin permissions
- Optional single sign-on
- Service-to-service authentication

### 2. Device service

Provides:

- Device registry
- Device ownership
- Device assignment
- Capability inventory
- Online/offline state
- Suspension and retirement
- Certificate status

### 3. Provisioning and pairing service

Provides:

- Pending device registrations
- Pairing codes
- QR pairing tokens
- Claim confirmation
- Device certificate issuance
- Device recovery

### 4. Configuration service

Provides:

- Configuration schemas
- Room configurations
- Adapter configuration
- Version history
- Validation
- Deployment status
- Rollback target

### 5. Command service

Provides:

- Command authorisation
- Command creation
- Delivery to gateway
- Acknowledgements
- Result tracking
- Idempotency
- Command audit

### 6. Real-time gateway

Provides:

- Device WebSocket connections
- Browser WebSocket connections
- Presence
- Command transport
- State broadcast
- Session routing
- Backpressure
- Heartbeats

### 7. Release service

Provides:

- Agent releases
- Adapter releases
- TouchDesigner project releases
- Deployment rings
- Signed manifests
- Rollback releases
- Compatibility rules

### 8. Telemetry and alert service

Provides:

- Health ingestion
- Metric aggregation
- Offline detection
- Alert policies
- Incident history
- Diagnostic views

### 9. Webhook service

Provides:

- Event subscriptions
- Signed webhook delivery
- Retry policy
- Dead-letter handling
- Delivery history

## API boundaries

The browser should use public application APIs.

The endpoint should use device APIs.

Keep these separate:

```text
/api/v1/operator/*
/api/v1/admin/*
/api/v1/node/*
/api/v1/internal/*
```

A node credential must never be accepted as an operator or administrator credential, and vice versa.

## Device gateway connection

Suggested connection:

```text
wss://devices.example.com/v1/connect
```

Initial authentication can use:

- Mutual TLS, or
- Short-lived signed device token obtained with a device certificate

After authentication, the gateway associates the connection with one device ID.

## Presence

A device should be considered online only while:

- The WebSocket is connected
- Heartbeats are current
- Authentication is valid
- The agent is not suspended

Presence is temporary state. Durable device state remains in the main database.

## Command authorisation

A command should be checked against:

- User role
- Company membership
- Room access
- Device ownership
- Active session
- Published UI controls
- Capability manifest
- Safety constraints
- Current configuration revision

The gateway should receive only already-authorised commands.

## Configuration deployment

Recommended flow:

```text
Admin edits draft
    ↓
Platform validates schema
    ↓
Configuration version is published
    ↓
Desired device configuration changes
    ↓
Endpoint downloads bundle
    ↓
Endpoint validates locally
    ↓
Endpoint activates version
    ↓
Endpoint reports active revision
```

## Audit requirements

Audit all:

- Device claims
- Ownership transfers
- Configuration edits
- Configuration publications
- Preset activations
- Security changes
- Software deployments
- Device restarts
- Certificate changes
- Failed authorisation attempts

Audit event example:

```json
{
  "eventType": "device.claimed",
  "actorType": "user",
  "actorId": "user_01K...",
  "companyId": "company_01K...",
  "deviceId": "dev_01K...",
  "occurredAt": "2026-07-14T16:40:00Z",
  "metadata": {
    "pairingMethod": "code"
  }
}
```

## Web applications

Recommended applications:

```text
Control App
Technician App
Admin App
Internal Platform App
```

These may share a component library and authentication system.

The role and room configuration determine which controls are shown.

## Suggested deployment shape

For an initial Google Cloud deployment:

```text
Cloud Run: Platform API
Cloud Run: Device Gateway
Cloud Run Jobs: Workers
Cloud SQL: Primary database
Memorystore: Redis
Cloud Storage: Packages and assets
Cloud CDN: Web app and downloads
Secret Manager: Service secrets
Cloud Logging: Central logs
```

The architecture should remain portable and should not expose cloud-provider-specific behaviour to endpoint adapters.
