-- P1-EPIC-04: Provisioning endpoint metadata alignment

BEGIN;

ALTER TABLE node_registrations
  ADD COLUMN device_public_key_fingerprint text,
  ADD COLUMN installation_id text,
  ADD COLUMN device_fingerprint text,
  ADD COLUMN commissioning_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN bootstrap_version text;

ALTER TABLE pairing_sessions
  ADD COLUMN claimed_by_user_id uuid REFERENCES app_users(user_id) ON DELETE RESTRICT,
  ADD COLUMN qr_token_id text;

ALTER TABLE device_credentials
  RENAME COLUMN certificate_fingerprint TO certificate_thumbprint;

ALTER TABLE device_credentials
  ADD COLUMN revocation_reason text;

CREATE INDEX idx_node_registrations_device_fingerprint ON node_registrations(device_fingerprint);

COMMIT;
