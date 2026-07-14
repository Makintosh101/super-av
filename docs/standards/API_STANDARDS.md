# API Standards

- REST contracts are defined in OpenAPI.
- Real-time contracts are defined in AsyncAPI or JSON Schema.
- Public APIs use product-level capabilities, never TouchDesigner paths.
- All write requests require authentication, authorisation and idempotency where relevant.
- Errors use a stable `code`, human-readable `message` and `correlationId`.
- Breaking changes require a new contract version and an approved ADR.
- Timestamps use UTC ISO 8601.

## Related standards

- Use `docs/standards/PRODUCT_TERMINOLOGY.md` for API resource and capability language.
- Use `docs/standards/NAMING_STANDARDS.md` for URL path and JSON field naming.
- Use `docs/standards/ERROR_STANDARD.md` for API error shape and error-code ranges.
- Use `docs/standards/VERSIONING_POLICY.md` for API and contract versioning.
