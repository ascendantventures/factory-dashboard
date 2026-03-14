-- MIGRATION: Fix fd_user_roles for live session user (Issue #93)
--
-- Root cause: The authenticated session user ID (cec59014-5d74-4ae2-9f15-a8477c8ee3d7)
-- has no row in fd_user_roles, so getUserRole() returns 'viewer' and isAdmin=false,
-- causing the mobile nav to show Settings instead of Admin.
--
-- Two Supabase projects (xvniwehnspnxlnerbfwj vs ojazkhiqwgssduehubdu) created
-- separate auth.users records for the same email address. The live session resolves
-- to cec59014, which previously had no role row.
--
-- Fix: Upsert admin role for the actual live session user ID.
-- Uses ON CONFLICT to be idempotent — safe to run multiple times.

INSERT INTO fd_user_roles (user_id, role, is_active, created_at)
VALUES (
  'cec59014-5d74-4ae2-9f15-a8477c8ee3d7',
  'admin',
  true,
  now()
)
ON CONFLICT (user_id) DO UPDATE
  SET role      = 'admin',
      is_active = true;

-- Verify
-- SELECT user_id, role, is_active FROM fd_user_roles
-- WHERE user_id = 'cec59014-5d74-4ae2-9f15-a8477c8ee3d7';
