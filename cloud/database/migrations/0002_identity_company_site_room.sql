-- P1-BE-0202: Identity, company, site and room foundation

BEGIN;

CREATE TABLE app_users (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE companies (
  company_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  deployment_key text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('active', 'suspended', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE company_users (
  company_user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(company_id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES app_users(user_id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('admin', 'technician', 'operator', 'viewer')),
  status text NOT NULL CHECK (status IN ('active', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE TABLE sites (
  site_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(company_id) ON DELETE RESTRICT,
  name text NOT NULL,
  address_summary text,
  timezone text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

CREATE TABLE rooms (
  room_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(site_id) ON DELETE RESTRICT,
  name text NOT NULL,
  room_code_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'maintenance', 'archived')),
  active_configuration_id uuid,
  default_device_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site_id, room_code_name)
);

CREATE INDEX idx_company_users_user_id ON company_users(user_id);
CREATE INDEX idx_sites_company_id ON sites(company_id);
CREATE INDEX idx_rooms_site_id ON rooms(site_id);

COMMIT;
