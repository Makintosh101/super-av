# Code Standards

- Prefer explicit, readable implementations over clever abstractions.
- Use strict typing where supported.
- Validate all external input.
- Return structured errors with stable error codes.
- Do not swallow exceptions.
- Do not add speculative fallback chains.
- Keep modules independently testable.
- Use dependency injection at service boundaries.
- Keep cloud business logic separate from adapter implementation.
- Add comments for decisions and constraints, not obvious syntax.
- New dependencies require justification and version pinning.

## Naming, errors and versions

- Use `docs/standards/PRODUCT_TERMINOLOGY.md` for product language in code, comments, contracts and user-facing strings.
- Use `docs/standards/NAMING_STANDARDS.md` for file, branch, API, JSON, database, class, constant, environment variable, feature flag and configuration names.
- Use `docs/standards/ERROR_STANDARD.md` for structured errors and public error codes.
- Use `docs/standards/VERSIONING_POLICY.md` for application, API, contract, configuration, migration, release and compatibility versions.
