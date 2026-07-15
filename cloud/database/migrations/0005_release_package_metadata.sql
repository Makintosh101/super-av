-- P1-BE-0205: Release, package and compatibility metadata

BEGIN;

CREATE TABLE releases (
  release_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_type text NOT NULL CHECK (component_type IN ('agent', 'adapter', 'touchdesigner_project', 'media_bundle', 'support_tool')),
  component_name text NOT NULL,
  version text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('development', 'pilot', 'production', 'rollback')),
  manifest_json jsonb NOT NULL,
  package_uri text NOT NULL,
  package_hash text NOT NULL,
  signature text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'published', 'deprecated', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE (component_type, component_name, version, channel)
);

CREATE TABLE device_release_assignments (
  device_release_assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(device_id) ON DELETE RESTRICT,
  release_id uuid NOT NULL REFERENCES releases(release_id) ON DELETE RESTRICT,
  desired_at timestamptz NOT NULL DEFAULT now(),
  downloaded_at timestamptz,
  activated_at timestamptz,
  status text NOT NULL CHECK (status IN ('desired', 'downloaded', 'activated', 'failed', 'rolled_back', 'superseded')),
  failure_code text,
  failure_message text,
  UNIQUE (device_id, release_id)
);

CREATE TABLE release_compatibility_rules (
  release_compatibility_rule_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_type text NOT NULL,
  component_name text NOT NULL,
  version_constraint text NOT NULL,
  compatible_component_type text NOT NULL,
  compatible_component_name text NOT NULL,
  compatible_version_constraint text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_releases_component_status ON releases(component_type, component_name, status);
CREATE INDEX idx_release_assignments_device_status ON device_release_assignments(device_id, status);

COMMIT;
