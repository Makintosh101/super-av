# BE Endpoint Platform

A reusable platform for securely registering, pairing, configuring, controlling and monitoring remote AV and edge-compute nodes.

The first implementation uses TouchDesigner as the local media engine. The platform is deliberately engine-independent and may later support VLC, vMix, PIXERA, OBS, audio DSPs, cameras and other local applications through adapters.

## Phase 1 objective

Prove the complete communication path:

```text
Node starts
    ↓
Node creates or loads its identity
    ↓
Node is paired to the cloud
    ↓
Node establishes a secure connection
    ↓
Cloud and node exchange health and state
    ↓
Cloud sends one product-level command
    ↓
The adapter executes it
    ↓
The node confirms reported state
    ↓
The same command remains available through the local offline UI
```

## Start here

1. Read [`AGENTS.md`](AGENTS.md).
2. Read [`docs/00_PLATFORM_PRINCIPLES.md`](docs/00_PLATFORM_PRINCIPLES.md).
3. Read [`docs/architecture/README.md`](docs/architecture/README.md).
4. Review confirmed decisions in [`docs/decisions/README.md`](docs/decisions/README.md).
5. Follow [`docs/13_AI_AGENT_DELIVERY_FRAMEWORK.md`](docs/13_AI_AGENT_DELIVERY_FRAMEWORK.md).
6. Work only from a scoped task using [`docs/tasks/TASK_TEMPLATE.md`](docs/tasks/TASK_TEMPLATE.md).

## Source-of-truth order

When documents conflict, use this order:

1. Platform Principles
2. Confirmed Architecture Decision Records
3. Security and engineering standards
4. API and schema contracts
5. Approved task specification
6. Existing implementation

Production environments and manually edited databases are never the source of truth.
