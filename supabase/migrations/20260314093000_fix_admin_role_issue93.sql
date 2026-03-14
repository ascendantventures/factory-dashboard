-- MIGRATION: Issue #93 — Ensure admin role for live session user
-- Safe upsert using auth.users email lookup — works on any project regardless of user UUID.
--
-- Background: Two Supabase projects (xvniwehnspnxlnerbfwj vs ojazkhiqwgssduehubdu) create
-- separate auth.users rows for the same email. This migration is project-agnostic:
-- it finds the user by email and upserts the admin role for whichever UUID is present.

INSERT INTO fd_user_roles (user_id, role, is_active)
SELECT
  id,
  'admin',
  true
FROM auth.users
WHERE email = 'ajrrac@gmail.com'
ON CONFLICT (user_id) DO UPDATE
  SET role      = 'admin',
      is_active = true,
      updated_at = now();

-- Verify
SELECT user_id, role, is_active FROM fd_user_roles;
