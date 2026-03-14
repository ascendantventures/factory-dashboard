-- Fix #92: Upsert admin role for live session user (ajrrac@gmail.com)
--
-- Root cause: The authenticated session user ID (cec59014-5d74-4ae2-9f15-a8477c8ee3d7)
-- has no row in fd_user_roles, so getUserRole() returns 'viewer' and isAdmin=false.
-- The admin row in fd_user_roles was for a different user_id (b4c20f13-...).
--
-- Fix: Upsert admin role for the actual live session user ID so that the
-- server-side role lookup returns 'admin' and MobileBottomNav renders correctly.

INSERT INTO fd_user_roles (user_id, role, is_active)
VALUES ('cec59014-5d74-4ae2-9f15-a8477c8ee3d7', 'admin', true)
ON CONFLICT (user_id) DO UPDATE
  SET role      = 'admin',
      is_active = true,
      updated_at = now();
