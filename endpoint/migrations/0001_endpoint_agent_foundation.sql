-- P1-EPIC-05 endpoint local schema foundation.
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS device_identity (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  device_id TEXT NOT NULL UNIQUE,
  installation_id TEXT NOT NULL UNIQUE,
  public_key_pem TEXT NOT NULL,
  private_key_ref TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  recovery_identifier TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS last_known_configuration (
  device_id TEXT NOT NULL,
  configuration_revision INTEGER NOT NULL,
  configuration_json TEXT NOT NULL,
  activated_at TEXT,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (device_id, configuration_revision)
);
CREATE TABLE IF NOT EXISTS pending_telemetry (
  telemetry_id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  queued_at TEXT NOT NULL,
  last_error_code TEXT
);
CREATE TABLE IF NOT EXISTS audit_events (
  event_id TEXT PRIMARY KEY,
  device_id TEXT,
  event_type TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  uploaded_at TEXT
);
CREATE TABLE IF NOT EXISTS installed_release_metadata (
  release_id TEXT PRIMARY KEY,
  agent_version TEXT NOT NULL,
  package_hash TEXT NOT NULL,
  signature_ref TEXT NOT NULL,
  installed_at TEXT NOT NULL,
  active INTEGER NOT NULL CHECK (active IN (0, 1))
);
CREATE TABLE IF NOT EXISTS update_history (
  update_id TEXT PRIMARY KEY,
  from_release_id TEXT,
  to_release_id TEXT NOT NULL,
  status TEXT NOT NULL,
  error_code TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT
);
CREATE TABLE IF NOT EXISTS command_deduplication (
  command_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL,
  completed_at TEXT,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS adapter_state (
  adapter_id TEXT PRIMARY KEY,
  adapter_type TEXT NOT NULL,
  adapter_version TEXT NOT NULL,
  health_status TEXT NOT NULL,
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
