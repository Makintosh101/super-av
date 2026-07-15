-- P1-EPIC-03: Idempotent seed data for the initial Blue Elephant deployment

BEGIN;

INSERT INTO companies (name, deployment_key, status)
VALUES ('Blue Elephant', 'blue-elephant-phase1', 'active')
ON CONFLICT (deployment_key) DO UPDATE
SET name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = now();

INSERT INTO sites (company_id, name, address_summary, timezone, status)
SELECT company_id, 'Primary Site', 'Initial Phase 1 deployment site', 'Etc/UTC', 'active'
FROM companies
WHERE deployment_key = 'blue-elephant-phase1'
ON CONFLICT (company_id, name) DO UPDATE
SET address_summary = EXCLUDED.address_summary,
    timezone = EXCLUDED.timezone,
    status = EXCLUDED.status,
    updated_at = now();

INSERT INTO rooms (site_id, name, room_code_name, status)
SELECT site_id, 'Demo Room', 'demo-room', 'active'
FROM sites
JOIN companies USING (company_id)
WHERE companies.deployment_key = 'blue-elephant-phase1'
  AND sites.name = 'Primary Site'
ON CONFLICT (site_id, room_code_name) DO UPDATE
SET name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = now();

COMMIT;
