# TASK-001: Repository and development scaffolding

## Goal

Create the initial buildable repository structure and automated validation without implementing product features.

## In scope

- Solution/workspace structure
- Node Agent project shell
- Platform API project shell
- Device Gateway project shell
- Shared contract-validation package
- Test projects
- Formatting, linting and build commands
- CI workflow
- Migration tooling selection and empty baseline
- Local development instructions

## Out of scope

- Device pairing
- Certificates
- WebSocket protocol implementation
- TouchDesigner communication
- Room UI

## Relevant decisions

- ADR-003
- ADR-027
- ADR-028
- ADR-030
- ADR-031

## Acceptance criteria

- [ ] A clean checkout builds with one documented command.
- [ ] Automated tests run even if initially minimal.
- [ ] Contract schemas are validated.
- [ ] Migration tooling can create an empty development database.
- [ ] CI runs without requiring manually configured developer files.
- [ ] No production infrastructure is created.
