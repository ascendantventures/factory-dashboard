-- MIGRATION: Fix fd_user_roles for live session user cec59014
-- Issue #93: Admin nav still not rendering because session user has no role row

-- Upsert admin role for the live session user cec59014
-- Uses upsert (ON CONFLICT) not plain insert — fd_user_roles has an auth trigger
INSERT INTO fd_user_roles (user_id, role, is_active, created_at)
VALUES (
  'cec59014-5d74-4ae2-9f15-a8477c8ee3d7',
  'admin',
  true,
  now()
)
ON CONFLICT (user_id) DO UPDATE
  SET role = 'admin',
      is_active = true;

-- Verify
SELECT user_id, role, is_active FROM fd_user_roles
WHERE user_id = 'cec59014-5d74-4ae2-9f15-a8477c8ee3d7';
