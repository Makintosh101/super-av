# Error Code Standards

Error codes are stable, uppercase identifiers grouped by domain.

Examples:

```text
NODE_NETWORK_OFFLINE
NODE_CERTIFICATE_REVOKED
PAIRING_CODE_EXPIRED
COMMAND_EXPIRED
COMMAND_CAPABILITY_UNAVAILABLE
CONFIGURATION_INVALID
ADAPTER_HEARTBEAT_MISSED
TOUCHDESIGNER_PROCESS_STOPPED
ASSET_HASH_MISMATCH
DATABASE_SCHEMA_INCOMPATIBLE
```

Rules:

- Never use free text as the only machine-readable failure.
- Do not reuse a code for a different meaning.
- Document every new public error code.
- Include correlation IDs in cloud and node logs.
- A failed action must not return success with a warning hidden in metadata.
