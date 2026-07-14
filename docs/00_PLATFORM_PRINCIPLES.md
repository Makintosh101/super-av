# Platform Principles

## PP-001 — Cloud is the control plane; nodes are the execution plane

Cloud services coordinate users, desired configuration, releases and audit history. Nodes execute real-time AV behaviour locally.

## PP-002 — Nodes continue without cloud

Loss of cloud or internet access must not stop current operation or local control.

## PP-003 — Code is the source of truth

Application code, migrations, infrastructure, contracts and deployment configuration are version controlled. Production is not authoritative.

## PP-004 — Use logical capabilities, not hardware paths

The cloud requests outcomes such as `presentation input`, `master mute` or `activate preset`. Adapters translate these into TouchDesigner, VLC or hardware-specific operations.

## PP-005 — Do not build incorrect fallback chains

A failure must be diagnosed and the approved solution corrected. Alternative paths are permitted only when intentionally designed, documented and tested.

## PP-006 — Simple now, extensible later

Phase 1 proves identity, pairing, secure communication, configuration, commands, state and offline control. Convenience and advanced orchestration come later.

## PP-007 — One codebase, isolated deployments

Blue Elephant uses the first deployment. Future customers receive separate environments created from the same codebase and infrastructure modules.

## PP-008 — Documentation and code change together

Architecture, contracts, migrations, tests and operational documentation are part of the implementation.

## PP-009 — AI agents implement decisions; they do not silently make them

Material ambiguity becomes a Decision Request for the Product Owner or Lead Developer.

## PP-010 — Failures must be visible and actionable

Use explicit error codes, degraded states and diagnostic evidence. Never make a failed operation appear successful.
