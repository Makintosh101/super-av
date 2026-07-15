-- P1-BE-0204: Configuration, commands, state, events and audit

BEGIN;

CREATE TABLE room_configurations (
  configuration_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(room_id) ON DELETE RESTRICT,
  revision integer NOT NULL CHECK (revision > 0),
  schema_version text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'validated', 'published', 'superseded', 'rolled_back', 'archived')),
  configuration_json jsonb NOT NULL,
  created_by_user_id uuid REFERENCES app_users(user_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_by_user_id uuid REFERENCES app_users(user_id) ON DELETE RESTRICT,
  published_at timestamptz,
  UNIQUE (room_id, revision)
);

ALTER TABLE rooms
  ADD CONSTRAINT fk_rooms_active_configuration FOREIGN KEY (active_configuration_id) REFERENCES room_configurations(configuration_id) ON DELETE SET NULL;

CREATE TABLE presets (
  preset_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(room_id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  revision integer NOT NULL CHECK (revision > 0),
  preset_json jsonb NOT NULL,
  user_visible boolean NOT NULL DEFAULT false,
  technician_visible boolean NOT NULL DEFAULT true,
  status text NOT NULL CHECK (status IN ('draft', 'validated', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, name, revision)
);

CREATE TABLE device_configuration_deployments (
  deployment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid NOT NULL REFERENCES room_configurations(configuration_id) ON DELETE RESTRICT,
  device_id uuid NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  desired_at timestamptz NOT NULL DEFAULT now(),
  downloaded_at timestamptz,
  activated_at timestamptz,
  reported_revision integer CHECK (reported_revision IS NULL OR reported_revision > 0),
  status text NOT NULL CHECK (status IN ('desired', 'downloaded', 'activated', 'failed', 'superseded')),
  failure_code text,
  failure_message text,
  UNIQUE (configuration_id, device_id)
);

CREATE TABLE device_commands (
  command_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  room_id uuid NOT NULL REFERENCES rooms(room_id) ON DELETE RESTRICT,
  session_id text,
  actor_user_id uuid REFERENCES app_users(user_id) ON DELETE RESTRICT,
  action text NOT NULL,
  parameters_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  required_capability text NOT NULL,
  idempotency_key text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  acknowledged_at timestamptz,
  completed_at timestamptz,
  status text NOT NULL CHECK (status IN ('pending', 'acknowledged', 'completed', 'failed', 'expired', 'rejected')),
  result_json jsonb,
  correlation_id text,
  UNIQUE (device_id, idempotency_key),
  CHECK (expires_at > issued_at)
);

CREATE TABLE device_desired_states (
  device_id uuid PRIMARY KEY REFERENCES devices(device_id) ON DELETE RESTRICT,
  revision integer NOT NULL CHECK (revision > 0),
  desired_state_json jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE device_reported_states (
  device_id uuid PRIMARY KEY REFERENCES devices(device_id) ON DELETE RESTRICT,
  revision integer NOT NULL CHECK (revision > 0),
  reported_state_json jsonb NOT NULL,
  reported_at timestamptz NOT NULL
);

CREATE TABLE device_events (
  device_event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  correlation_id text,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE audit_events (
  audit_event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(company_id) ON DELETE RESTRICT,
  actor_type text NOT NULL CHECK (actor_type IN ('user', 'device', 'system')),
  actor_id text,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  occurred_at timestamptz NOT NULL,
  source_ip inet,
  correlation_id text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_room_configurations_room_revision ON room_configurations(room_id, revision DESC);
CREATE INDEX idx_deployments_device_status ON device_configuration_deployments(device_id, status);
CREATE INDEX idx_device_commands_device_status ON device_commands(device_id, status, issued_at DESC);
CREATE INDEX idx_device_events_device_occurred ON device_events(device_id, occurred_at DESC);
CREATE INDEX idx_audit_events_company_occurred ON audit_events(company_id, occurred_at DESC);

COMMIT;
