# Security and Trust Model

## Trust boundaries

```text
Public Browser
    ↓
Public Cloud API
    ↓
Internal Cloud Services
    ↓
Device Gateway
    ↓
Endpoint Agent
    ↓
Local Adapter
    ↓
TouchDesigner or Other Engine
```

Each boundary requires authentication and validation.

## Device authentication

Preferred approach:

1. Device creates a local key pair.
2. Provisioning service validates pairing.
3. Cloud issues a device certificate.
4. Device uses the certificate to obtain short-lived connection tokens or establish mutual TLS.
5. Certificates rotate automatically.
6. Revoked devices cannot reconnect.

## User authentication

Use standard user authentication separate from device credentials.

Support:

- Strong passwords
- MFA for administrators and technicians
- SSO later
- Short-lived access tokens
- Refresh-token protection
- Session revocation

## Authorisation

Apply authorisation in the cloud before sending a command.

Check:

- Tenant
- User role
- Device ownership
- Room access
- Session access
- Control visibility
- Control editability
- Allowed value range
- Required capability
- Safety policy

The endpoint should also perform local safety validation.

## Pairing security

Controls:

- Short expiry
- One-time use
- Rate limiting
- Attempt counters
- User login required for claim
- Device confirmation details
- Audit trail
- No permanent secrets in QR codes
- Code invalidation after use

## Local security

The endpoint should:

- Bind local APIs to localhost
- Use authenticated IPC
- Store keys using Windows-protected storage
- Restrict service account permissions
- Validate all downloaded packages
- Sign update manifests
- Verify package hashes
- Prevent arbitrary command execution
- Limit writable directories
- Protect logs from unprivileged modification

## Command allow-list

The platform must not provide a generic endpoint such as:

```text
executeShellCommand
runPowerShell
writeAnyFile
launchAnyProcess
```

Only named, versioned, product-level actions should be accepted.

Administrative maintenance actions should be separately permissioned and tightly constrained.

## Update security

Each update should include:

- Release ID
- Version
- Supported agent versions
- Supported operating systems
- Package hash
- Digital signature
- Package size
- Required disk space
- Rollback version
- Release channel

The endpoint verifies the signature before installation.

## Network security

- TLS for all cloud communication
- Certificate pinning may be considered but requires careful rotation design
- No direct public TouchDesigner connection
- No inbound firewall dependency
- WebSocket authentication during connection establishment
- Regular heartbeat and token refresh
- Connection rate limits
- Message-size limits

## Secrets

Do not store long-lived cloud service secrets on the endpoint.

Endpoint secrets should be limited to:

- Device private key
- Device certificate
- Short-lived access tokens
- Product secrets that cannot be avoided

Use per-device secrets rather than a single shared fleet key.

## Tenant isolation

Every durable record should be scoped to a company or platform tenant where applicable.

Queries and command routing must verify tenant ownership server-side.

Do not rely on browser-provided company IDs without validating them against the authenticated user.

## Logging and privacy

Log:

- Authentication attempts
- Pairing attempts
- Commands
- Security changes
- Certificate changes
- Update actions
- Permission failures

Avoid logging:

- Passwords
- Private keys
- Access tokens
- Full personal data
- Sensitive media URLs containing credentials

## Threat scenarios

### Stolen room code

Mitigations:

- Short expiry
- User authentication
- Limited User role
- Room-bound token
- Rate limiting
- Session timeout

### Cloned endpoint disk

Mitigations:

- TPM-backed keys where possible
- Hardware fingerprint comparison
- Duplicate connection detection
- Certificate revocation
- Re-enrolment approval

### Compromised user browser

Mitigations:

- Least privilege
- Short sessions
- Command validation
- No direct device access
- Audit trail
- MFA for elevated roles

### Compromised TouchDesigner project

Mitigations:

- Agent allow-list
- Localhost-only interface
- Signed project packages
- Restricted service boundaries
- Adapter message validation
- No cloud credentials inside TouchDesigner

### Malicious update package

Mitigations:

- Signed manifests
- Package signatures
- Hash verification
- Staged releases
- Rollback
- Release approval workflow

## Security rule

The room agent should remain safe even when the connected application adapter behaves incorrectly.

The adapter must not be trusted with the device private key or unrestricted cloud access.

## Encryption in transit

All communication between nodes and backend services must use TLS. Plain HTTP and plaintext WebSocket connections are prohibited.

Minimum requirements:

- TLS 1.2 minimum; TLS 1.3 preferred
- Server certificate and hostname validation
- Per-device authentication
- Secure WebSocket only
- Certificate expiry monitoring
- No plaintext fallback

TLS automatically negotiates ephemeral session keys. If a node changes network or public IP, the old connection ends and a new TLS handshake creates fresh encryption keys. The device re-authenticates using its existing certificate; an IP change does not require a new permanent certificate.

## Certificate lifecycle

Device certificates must support initial issuance, automatic renewal, key rotation, revocation and replacement after recovery.

Recommended renewal:

```text
Certificate approaches renewal threshold
    ↓
Node authenticates with current certificate
    ↓
Node generates a new key pair
    ↓
Cloud issues a replacement certificate
    ↓
Node tests and activates it
    ↓
Short overlap period
    ↓
Old certificate is revoked
```

Private keys remain on the node and should use TPM-backed or Windows-protected storage where practical.

## Integrity and replay protection

Commands must include a unique command ID, device ID, issued time, expiry time, configuration revision and idempotency key. Nodes retain recent command IDs and reject duplicates, stale messages and expired commands.

Downloaded packages must be checked against signed manifests and cryptographic hashes.
