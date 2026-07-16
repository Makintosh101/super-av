# Phase 1 Release and Rollback Procedure

## Scope

This procedure covers P1-EPIC-12 release creation, deployment rings, activation, failure handling and rollback target selection for the endpoint agent, adapter packages and TouchDesigner project packages.

## Release creation

1. Build the endpoint installer, adapter package and TouchDesigner package from the repository.
2. Generate package hashes and signed package manifests.
3. Upload packages and manifests to the deployment object storage module.
4. Publish a deployment manifest that references the exact package versions.

## Deployment rings

Phase 1 uses a single Blue Elephant environment. The release owner may still stage activation in documented rings:

- `internal-validation`
- `blue-elephant-room`

## Activation and failure handling

The endpoint validates package hash and signature before install or activation. Unsigned, altered or incompatible packages fail explicitly and must remain visible in logs, event history and diagnostic bundles.

## Rollback operating mode

Rollback is an intentional operating mode, not a hidden fallback. The trigger is a failed validation, failed activation or operator-approved recovery from a bad release. The release owner selects the previous known-good package recorded in endpoint package metadata. The endpoint retains current and previous package files so rollback can restore the previous package and report the recovery action.

## Recovery notes

- Endpoint package failure: keep the existing service running and activate the previous known-good package only after validation.
- Adapter package failure: keep the previous adapter package active and report the failed package ID and version.
- TouchDesigner project failure: keep the previous project active, record the failed project package version and require a corrected signed package.

## Rollback notes

Rollback does not mark the failed release as successful. Operators must preserve the failed manifest, hash/signature evidence and endpoint diagnostic bundle for review.
