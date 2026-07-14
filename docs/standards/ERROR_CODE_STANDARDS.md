# Error Code Standards

`docs/standards/ERROR_STANDARD.md` is the authoritative error standard.

Use this file as a short index for error-code expectations:

- Error codes are stable, uppercase identifiers with numeric ranges, for example `PAIRING-3004`.
- Never use free text as the machine-readable failure identifier.
- Do not reuse a code for a different meaning.
- Document every new public error code.
- Include correlation IDs in cloud and node logs.
- A failed action must not return success with a warning hidden in metadata.

See `docs/standards/ERROR_STANDARD.md` for reserved ranges, required error object fields, severity values and examples.
