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

## P1-EPIC-12 Phase 1 infrastructure skeleton

`deployment/infrastructure/phase1-blue-elephant.mjs` defines the code-owned skeleton for the single Blue Elephant Phase 1 deployment. The skeleton includes modules for the Platform API, real-time device gateway, primary database, Redis-compatible session store, object storage and web app. Manual infrastructure work is limited to documented credentials and bootstrap inputs.

`deployment/contracts/environment-contract.mjs` defines required environment variables, secrets and deployment manifest fields. Future client deployments reuse the same module structure with different manifest values and isolated credentials; they must not copy and manually edit the project.
