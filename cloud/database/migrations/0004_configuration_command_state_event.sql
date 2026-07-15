-- P1-BE-0204: Configuration, command, state and event foundation

BEGIN;

CREATE TABLE room_configurations (
  configuration_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(room_id) ON DELETE RESTRICT,
  revision integer NOT NULL CHECK (revision > 0),
  schema_version text NOT NULL,
  desired_state jsonb NOT NULL,
  published_by_user_id uuid REFERENCES app_users(user_id) ON DELETE RESTRICT,
  published_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('draft', 'published', 'superseded', 'archived')),
  UNIQUE (room_id, revision)
);

CREATE TABLE device_configuration_deployments (
  deployment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid NOT NULL REFERENCES room_configurations(configuration_id) ON DELETE RESTRICT,
  device_id uuid NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  desired_at timestamptz NOT NULL DEFAULT now(),
  downloaded_at timestamptz,
  activated_at timestamptz,
  reported_revision integer,
  status text NOT NULL CHECK (status IN ('pending', 'downloaded', 'active', 'failed', 'superseded')),
  failure_code text,
  failure_message text,
  UNIQUE (configuration_id, device_id)
);

CREATE TABLE presets (
  preset_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(room_id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  revision integer NOT NULL CHECK (revision > 0),
  preset jsonb NOT NULL,
  user_visible boolean NOT NULL DEFAULT true,
  technician_visible boolean NOT NULL DEFAULT true,
  status text NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, name, revision)
);

CREATE TABLE desired_states (
  desired_state_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  revision integer NOT NULL CHECK (revision > 0),
  desired_state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, revision)
);

CREATE TABLE device_commands (
  command_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(room_id) ON DELETE RESTRICT,
  device_id uuid REFERENCES devices(device_id) ON DELETE RESTRICT,
  action text NOT NULL,
  parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL CHECK (status IN ('queued', 'accepted', 'rejected', 'succeeded', 'failed', 'expired')),
  idempotency_key text NOT NULL UNIQUE,
  configuration_revision integer,
  issued_by_user_id uuid REFERENCES app_users(user_id) ON DELETE RESTRICT,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz
);

CREATE TABLE reported_states (
  reported_state_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  room_id uuid NOT NULL REFERENCES rooms(room_id) ON DELETE RESTRICT,
  revision integer NOT NULL CHECK (revision > 0),
  state jsonb NOT NULL,
  reported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, revision)
);

CREATE TABLE device_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES devices(device_id) ON DELETE RESTRICT,
  room_id uuid REFERENCES rooms(room_id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('Info', 'Warning', 'Error', 'Critical')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
  audit_event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES app_users(user_id) ON DELETE RESTRICT,
  company_id uuid REFERENCES companies(company_id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rooms
  ADD CONSTRAINT fk_rooms_active_configuration
  FOREIGN KEY (active_configuration_id) REFERENCES room_configurations(configuration_id) ON DELETE RESTRICT;

ALTER TABLE rooms
  ADD CONSTRAINT fk_rooms_default_device
  FOREIGN KEY (default_device_id) REFERENCES devices(device_id) ON DELETE RESTRICT;

CREATE INDEX idx_room_configurations_room_id ON room_configurations(room_id);
CREATE INDEX idx_device_configuration_deployments_device_id ON device_configuration_deployments(device_id);
CREATE INDEX idx_presets_room_id ON presets(room_id);
CREATE INDEX idx_desired_states_device_id ON desired_states(device_id);
CREATE INDEX idx_device_commands_room_id ON device_commands(room_id);
CREATE INDEX idx_reported_states_device_id ON reported_states(device_id);
CREATE INDEX idx_device_events_device_id ON device_events(device_id);
CREATE INDEX idx_audit_events_company_id ON audit_events(company_id);

COMMIT;
