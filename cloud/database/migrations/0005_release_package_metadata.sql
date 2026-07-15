-- P1-BE-0205: Release and package metadata foundation

BEGIN;

CREATE TABLE releases (
  release_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_key text NOT NULL UNIQUE,
  name text NOT NULL,
  version text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('development', 'staging', 'production')),
  rollback_release_id uuid REFERENCES releases(release_id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('draft', 'approved', 'published', 'retired')),
  supported_versions jsonb NOT NULL DEFAULT '{}'::jsonb,
  compatibility_matrix jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE TABLE release_packages (
  package_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES releases(release_id) ON DELETE RESTRICT,
  package_type text NOT NULL CHECK (package_type IN ('agent', 'adapter', 'touchdesigner_project', 'configuration_schema')),
  package_version text NOT NULL,
  operating_system text,
  artifact_uri text NOT NULL,
  package_hash text NOT NULL,
  signature text,
  checksum text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (release_id, package_type, package_version)
);

CREATE TABLE room_release_assignments (
  room_release_assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(room_id) ON DELETE RESTRICT,
  release_id uuid NOT NULL REFERENCES releases(release_id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('planned', 'active', 'superseded', 'failed')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  UNIQUE (room_id, release_id)
);

CREATE INDEX idx_release_packages_release_id ON release_packages(release_id);
CREATE INDEX idx_room_release_assignments_room_id ON room_release_assignments(room_id);

COMMIT;
