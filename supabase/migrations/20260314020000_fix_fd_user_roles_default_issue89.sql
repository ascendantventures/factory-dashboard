-- Issue #89: Code hardening for fd_user_roles.is_active
-- (1) Set column default to true — prevents silent NULL inserts going forward
ALTER TABLE fd_user_roles
  ALTER COLUMN is_active SET DEFAULT true;

-- (2) Belt-and-suspenders data fix (idempotent) — ensure all admin rows are active
UPDATE fd_user_roles
SET is_active = true
WHERE role = 'admin'
  AND (is_active IS NULL OR is_active = false);
