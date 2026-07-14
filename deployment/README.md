# Deployment

## Ownership

Deployment manifests, pipelines, release metadata and rollback documentation belong here when a scoped task approves them.

## Phase 1 status

This directory is intentionally a placeholder for Epic 1. It does not define infrastructure resources, IAM, networking, deployment pipelines, release channels or runtime behaviour.

## Build commands

No deployment build command exists yet. Future deployment tasks must add validation commands with the infrastructure or release assets they authorize.

## Test commands

No deployment-specific test command exists yet. Repository documentation checks run from the root with:

```sh
npm run check:docs
```

## Related specifications

- [Deployment Model](../docs/14_DEPLOYMENT_MODEL.md)
- [Code as Source of Truth](../docs/standards/12_CODE_AS_SOURCE_OF_TRUTH.md)
- [Database Standards](../docs/standards/DATABASE_STANDARDS.md)
