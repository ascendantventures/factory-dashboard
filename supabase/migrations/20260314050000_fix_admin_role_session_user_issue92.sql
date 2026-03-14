-- Fix #92: Upsert admin role for live session user (ajrrac@gmail.com)
--
-- Root cause: The authenticated session user ID (cec59014-5d74-4ae2-9f15-a8477c8ee3d7)
-- had no row in fd_user_roles (or had is_active=false), so getUserRole() returned
-- 'viewer' and isAdmin=false. The prior row in fd_user_roles was for a different
-- user_id (b4c20f13-...) from a different Supabase project session.
--
-- Fix: Upsert admin role for the actual live session user ID, guarded by an EXISTS
-- check so this is a no-op if the auth.users row doesn't exist (idempotent/safe).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = 'cec59014-5d74-4ae2-9f15-a8477c8ee3d7'
  ) THEN
    INSERT INTO fd_user_roles (user_id, role, is_active)
    VALUES ('cec59014-5d74-4ae2-9f15-a8477c8ee3d7', 'admin', true)
    ON CONFLICT (user_id) DO UPDATE
      SET role      = 'admin',
          is_active = true,
          updated_at = now();
  END IF;
END;
$$;
