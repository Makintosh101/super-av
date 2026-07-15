-- Idempotent Phase 1 seed data for the first Blue Elephant deployment.

BEGIN;

INSERT INTO companies (name, deployment_key, status)
VALUES ('Blue Elephant', 'blue-elephant-phase-1', 'active')
ON CONFLICT (deployment_key) DO UPDATE
SET name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = now();

INSERT INTO sites (company_id, name, address_summary, timezone, status)
SELECT company_id, 'Phase 1 Site', 'Initial Phase 1 deployment site', 'Etc/UTC', 'active'
FROM companies
WHERE deployment_key = 'blue-elephant-phase-1'
ON CONFLICT (company_id, name) DO UPDATE
SET address_summary = EXCLUDED.address_summary,
    timezone = EXCLUDED.timezone,
    status = EXCLUDED.status,
    updated_at = now();

INSERT INTO rooms (site_id, name, room_code_name, status)
SELECT site_id, 'Phase 1 Room', 'phase-1-room', 'active'
FROM sites s
JOIN companies c ON c.company_id = s.company_id
WHERE c.deployment_key = 'blue-elephant-phase-1'
  AND s.name = 'Phase 1 Site'
ON CONFLICT (site_id, room_code_name) DO UPDATE
SET name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = now();

COMMIT;
