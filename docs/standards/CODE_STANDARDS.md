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
