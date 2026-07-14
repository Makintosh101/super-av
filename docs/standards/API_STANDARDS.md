# API Standards

- REST contracts are defined in OpenAPI.
- Real-time contracts are defined in AsyncAPI or JSON Schema.
- Public APIs use product-level capabilities, never TouchDesigner paths.
- All write requests require authentication, authorisation and idempotency where relevant.
- Errors use a stable `code`, human-readable `message` and `correlationId`.
- Breaking changes require a new contract version and an approved ADR.
- Timestamps use UTC ISO 8601.
