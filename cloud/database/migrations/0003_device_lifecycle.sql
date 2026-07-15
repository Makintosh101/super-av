-- P1-BE-0203: Device lifecycle, registration, pairing and credentials

BEGIN;

CREATE TABLE devices (
  device_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(company_id) ON DELETE RESTRICT,
  assigned_room_id uuid REFERENCES rooms(room_id) ON DELETE RESTRICT,
  node_identifier text NOT NULL UNIQUE,
  display_name text NOT NULL,
  lifecycle_status text NOT NULL CHECK (lifecycle_status IN ('registered', 'paired', 'active', 'disabled', 'retired')),
  agent_version text,
  protocol_version text,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE device_credentials (
  credential_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  certificate_fingerprint text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('active', 'rotating', 'revoked', 'expired')),
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE node_registrations (
  registration_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(company_id) ON DELETE RESTRICT,
  requested_node_identifier text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  idempotency_key text NOT NULL UNIQUE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz
);

CREATE TABLE pairing_sessions (
  pairing_session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  room_id uuid NOT NULL REFERENCES rooms(room_id) ON DELETE RESTRICT,
  code_hash text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('pending', 'claimed', 'expired', 'cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  claimed_at timestamptz
);

CREATE TABLE device_adapters (
  device_adapter_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  adapter_type text NOT NULL,
  adapter_version text NOT NULL,
  manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL CHECK (status IN ('installed', 'healthy', 'degraded', 'disabled')),
  installed_at timestamptz NOT NULL DEFAULT now(),
  last_health_at timestamptz,
  UNIQUE (device_id, adapter_type)
);

CREATE TABLE room_device_assignments (
  assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(room_id) ON DELETE RESTRICT,
  device_id uuid NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('active', 'ended')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  UNIQUE (room_id, device_id, assigned_at)
);

CREATE INDEX idx_devices_company_id ON devices(company_id);
CREATE INDEX idx_devices_assigned_room_id ON devices(assigned_room_id);
CREATE INDEX idx_pairing_sessions_device_id ON pairing_sessions(device_id);
CREATE INDEX idx_device_adapters_device_id ON device_adapters(device_id);
CREATE INDEX idx_room_device_assignments_room_id ON room_device_assignments(room_id);

COMMIT;
