# Product Scope

## Working name

**BE Endpoint Node Platform**

The name may change, but the reusable component should remain independent of any single product such as room control, signage or media playback.

## Problem statement

Many Blue Elephant projects require the same three layers:

1. Cloud user interface
2. Cloud backend
3. A bridge application installed on a remote PC

Rebuilding device registration, authentication, pairing, messaging, monitoring, updates and recovery for each product wastes time and creates inconsistent security.

The Endpoint Node Platform should provide these functions once.

## Product objective

Create a reusable endpoint framework that allows a physical device to:

- Identify itself securely
- Appear in the cloud platform
- Be claimed by an authorised administrator
- Receive configuration
- Maintain a real-time connection
- Execute approved commands
- Report state and health
- Operate offline
- Update safely
- Host one or more product-specific adapters

## Reusable versus product-specific responsibilities

### Reusable platform

The endpoint platform owns:

- Device identity
- Device registration
- Pairing
- Authentication
- Secure cloud connection
- Command transport
- Configuration synchronisation
- Desired and reported state
- Health telemetry
- Logging
- Update management
- Local persistence
- Watchdog and recovery
- Audit information

### Product-specific adapter

An adapter owns:

- Connecting to the local application
- Converting product commands into local actions
- Reading local application state
- Validating product-specific configuration
- Reporting capabilities
- Reporting application health

Examples:

```text
TouchDesignerAdapter
SignagePlayerAdapter
RoomControlAdapter
BrowserKioskAdapter
PixeraAdapter
VMixAdapter
GenericProcessAdapter
```

## Non-goals for the first release

The first release should not attempt to provide:

- General remote desktop
- Arbitrary shell command execution from the cloud
- Full operating-system management
- A universal plugin marketplace
- Peer-to-peer device networking
- High-frequency video transport
- Direct browser-to-device access over the public internet
- A full IoT rules engine

These can be considered later, but they should not delay the core device lifecycle.

## Primary user roles

### Platform Admin

Can manage all companies, devices, software versions and security policies.

### Company Admin

Can claim devices, assign them to rooms or projects, manage company users and approve configurations.

### Technician

Can install and commission devices, run diagnostics, apply permitted configurations and activate pairing.

### Operator or User

Can use product-specific controls but cannot change device ownership, security or system software.

## Device lifecycle

```text
Manufactured or prepared
        ↓
Agent installed
        ↓
Identity generated
        ↓
Unclaimed registration
        ↓
Claimed by organisation
        ↓
Assigned to site / room / project
        ↓
Configured
        ↓
Active
        ↓
Maintenance
        ↓
Retired or transferred
```

## Success criteria

The reusable platform is successful when a new product can connect to the cloud by implementing only:

1. A capability manifest
2. A configuration schema
3. A command handler
4. A state reporter
5. A health reporter

Everything else should be supplied by the endpoint platform.
