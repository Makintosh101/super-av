-- P1-BE-0203: Device lifecycle, registration, pairing and credentials

BEGIN;

CREATE TABLE devices (
  device_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(company_id) ON DELETE RESTRICT,
  display_name text NOT NULL,
  ownership_status text NOT NULL CHECK (ownership_status IN ('prepared', 'unclaimed', 'claimed')),
  lifecycle_status text NOT NULL CHECK (lifecycle_status IN ('prepared', 'unclaimed', 'claimed', 'assigned', 'online', 'maintenance', 'suspended', 'retired')),
  hardware_model text,
  hardware_serial text,
  system_uuid text,
  fingerprint text NOT NULL UNIQUE,
  agent_version text,
  protocol_version text,
  last_seen_at timestamptz,
  claimed_at timestamptz,
  claimed_by_user_id uuid REFERENCES app_users(user_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE device_credentials (
  device_credential_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  certificate_thumbprint text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revocation_reason text,
  status text NOT NULL CHECK (status IN ('active', 'revoked', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE device_registrations (
  registration_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  registration_status text NOT NULL CHECK (registration_status IN ('pending', 'claimed', 'expired', 'rejected')),
  first_seen_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  source_ip inet,
  reported_hostname text,
  reported_model text,
  short_fingerprint text NOT NULL,
  bootstrap_version text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pairing_sessions (
  pairing_session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  code_hash text NOT NULL,
  token_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  claimed_at timestamptz,
  claimed_by_user_id uuid REFERENCES app_users(user_id) ON DELETE RESTRICT,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  status text NOT NULL CHECK (status IN ('active', 'claimed', 'expired', 'rate_limited', 'revoked'))
);

CREATE TABLE device_assignments (
  device_assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  room_id uuid NOT NULL REFERENCES rooms(room_id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  unassigned_at timestamptz,
  assignment_role text NOT NULL CHECK (assignment_role IN ('primary', 'secondary', 'diagnostic')),
  status text NOT NULL CHECK (status IN ('active', 'inactive')),
  CHECK (unassigned_at IS NULL OR unassigned_at >= assigned_at)
);

CREATE UNIQUE INDEX ux_device_assignments_active_primary_device ON device_assignments(device_id) WHERE status = 'active' AND assignment_role = 'primary';
CREATE UNIQUE INDEX ux_device_assignments_active_primary_room ON device_assignments(room_id) WHERE status = 'active' AND assignment_role = 'primary';
CREATE INDEX idx_devices_company_id ON devices(company_id);
CREATE INDEX idx_device_registrations_status ON device_registrations(registration_status);
CREATE INDEX idx_pairing_sessions_status_expires ON pairing_sessions(status, expires_at);

ALTER TABLE rooms
  ADD CONSTRAINT fk_rooms_default_device FOREIGN KEY (default_device_id) REFERENCES devices(device_id) ON DELETE SET NULL;

COMMIT;
