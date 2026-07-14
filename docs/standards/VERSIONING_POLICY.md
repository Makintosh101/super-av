# Versioning Policy

The platform uses explicit versions so cloud services, nodes, adapters, contracts and configurations can determine compatibility without guesswork.

## Platform

The Platform uses Semantic Versioning.

Example:

```text
1.4.2
```

## Node Agent

The Node Agent has an independent Semantic Version.

Example:

```text
1.2.1
```

## TouchDesigner Adapter

The TouchDesigner Adapter has an independent Semantic Version.

Example:

```text
0.8.4
```

## API

The API version appears in the URL.

Example:

```text
/api/v1/node
```

Breaking API changes create a new major API version such as `v2`.

## Contracts

Contracts are versioned independently from application releases.

Example:

```text
v1
```

## Configuration

Room configuration uses monotonically increasing revisions, not Semantic Versioning.

Example:

```text
Revision 142
```

Configuration is data, so each persisted configuration change receives a new revision.

## Database

Every database migration gets an ordered timestamp identifier.

Example:

```text
202607141630
```

Never edit an applied migration. Only append a new migration.

## Releases

Release examples:

- `0.1.0-alpha`
- `0.2.0-alpha`
- `0.3.0-beta`
- `1.0.0`

## Internal builds

Use Semantic Version build metadata for internal build numbers.

Example:

```text
1.0.0+146
```

Build metadata must not change compatibility semantics.

## Compatibility reporting

Every Node reports the versions needed for compatibility checks.

```json
{
  "nodeAgentVersion": "1.1.2",
  "adapterVersions": {
    "touchdesigner": "1.0.4"
  },
  "apiVersion": "v1",
  "configurationRevision": 42
}
```

The cloud must reject or hold incompatible deployments rather than guessing or falling back to an unapproved path.
