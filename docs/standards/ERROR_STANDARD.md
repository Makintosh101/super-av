# Error Standard

Errors must be stable, structured, visible and actionable.

Never use free text as the machine-readable error identifier. Human-readable messages may change; error codes must not change meaning.

## Error code ranges

| Range | Category | Prefix | Examples |
| --- | --- | --- | --- |
| 1000-1999 | Node | `NODE` | `NODE-1001`, `NODE-1002` |
| 2000-2999 | Identity | `IDENTITY` | `IDENTITY-2001` |
| 3000-3999 | Pairing | `PAIRING` | `PAIRING-3001` |
| 4000-4999 | Communication | `COMMUNICATION` | `COMMUNICATION-4001` |
| 5000-5999 | Commands | `COMMAND` | `COMMAND-5001` |
| 6000-6999 | Configuration | `CONFIGURATION` | `CONFIGURATION-6001` |
| 7000-7999 | Adapters | `ADAPTER` | `ADAPTER-7001` |
| 8000-8999 | TouchDesigner | `TOUCHDESIGNER` | `TOUCHDESIGNER-8001` |
| 9000-9999 | Assets | `ASSET` | `ASSET-9001` |
| 10000-10999 | Authentication | `AUTHENTICATION` | `AUTHENTICATION-10001` |
| 11000-11999 | Authorisation | `AUTHORISATION` | `AUTHORISATION-11001` |
| 12000-12999 | Security | `SECURITY` | `SECURITY-12001` |
| 13000-13999 | Updates | `UPDATE` | `UPDATE-13001` |
| 14000-14999 | Database | `DATABASE` | `DATABASE-14001` |
| 15000-15999 | Infrastructure | `INFRASTRUCTURE` | `INFRASTRUCTURE-15001` |

## Error object

Every public error must include:

```json
{
  "code": "PAIRING-3004",
  "message": "The pairing code has expired.",
  "severity": "Error",
  "category": "Pairing",
  "correlationId": "corr_01K...",
  "timestamp": "2026-07-14T16:30:00Z",
  "details": {}
}
```

## Severity values

Use these severity values:

- `Info`
- `Warning`
- `Error`
- `Critical`

## Rules

- Allocate new codes from the correct range.
- Do not reuse a code for a different meaning.
- Document every public error code before exposing it in contracts or logs.
- Include correlation IDs in cloud and node logs.
- Include UTC ISO 8601 timestamps.
- Do not swallow exceptions or convert failed actions into apparent success.
- Do not return success with a hidden warning for a failed action.
