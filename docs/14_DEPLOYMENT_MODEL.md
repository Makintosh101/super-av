# Deployment Model

## Phase 1

The initial system is a single Blue Elephant deployment for internal use.

It has dedicated:

- Cloud services
- Database
- Object storage
- Credentials
- Users
- Nodes
- Logs
- Monitoring

No shared multi-tenant database model is required in Phase 1.

## Future customers

Each external customer receives an isolated deployment created from the same repository.

```text
One product repository
    +
Infrastructure modules
    +
Deployment manifest
    +
Customer configuration
    =
Isolated customer environment
```

Each customer deployment has separate:

- Database
- Storage
- Identity boundary
- Service credentials
- Encryption boundary
- Domain and branding
- Operational data

## Guardrails

- Do not create customer-specific source-code forks.
- Do not manually copy and rename projects.
- Use configuration and feature flags for branding and enabled capabilities.
- Provision deployments through infrastructure-as-code only.
- Record the exact application, migration and infrastructure version used by each deployment.
- Consider a shared fleet-management control plane only after multiple external deployments justify the added security scope.
