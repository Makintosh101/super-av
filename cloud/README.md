# Cloud

## Ownership

Cloud-owned Phase 1 implementation files belong here when a scoped task approves them.

## Phase 1 status

P1-EPIC-04 adds the repository-local provisioning service implementation for the approved Phase 1 registration, pairing, certificate metadata and room-assignment workflows. It does not add a deployed server, new inbound port or infrastructure resource.

## Provisioning implementation

`cloud/provisioning/provisioning-service.mjs` implements the approved endpoint behaviour behind framework-neutral functions so a future transport layer can call the same product logic without changing the security model:

- unclaimed device registration stores limited bootstrap metadata and deduplicates repeated pending registration by device identity and fingerprint;
- registration polling returns only limited pre-claim status unless an authorised Phase 1 company actor requests post-claim assignment details;
- pairing sessions are short-lived, device-bound and one-time use, with hashed pairing-code storage;
- pairing claim requires a Blue Elephant `admin` or `technician`, enforces expiry and writes audit evidence;
- certificate issuance records metadata only and rejects endpoint private keys;
- room assignment validates company ownership before assigning a claimed device to the Phase 1 room.

## Build commands

No cloud deployment build command exists yet. Future tasks must add build commands with the implementation they authorize.

## Test commands

Run provisioning unit tests from the repository root with:

```sh
npm run test:unit
```

Run all repository validation with:

```sh
npm run check
```

## Related specifications

- [Phase 1 Build Plan](../docs/10_PHASE_1_BUILD_PLAN.md)
- [Cloud Backend Specification](../docs/specifications/05_CLOUD_BACKEND_SPECIFICATION.md)
- [API and Message Contracts](../docs/specifications/06_API_AND_MESSAGE_CONTRACTS.md)
