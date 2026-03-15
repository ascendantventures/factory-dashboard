-- ============================================================
-- Phase 2: Avatar Upload + Session Management
-- Issue #45 — Factory Dashboard User Management Deferred Features
-- ============================================================

-- ============================================================
-- 1. Create fd_user_profiles (if not exists from Phase 1)
--    All ops are idempotent
-- ============================================================
CREATE TABLE IF NOT EXISTS fd_user_profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url  TEXT,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fd_user_profiles_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS fd_user_profiles_user_id_idx ON fd_user_profiles(user_id);

-- Auto-update updated_at (reuse existing trigger function)
DROP TRIGGER IF EXISTS fd_user_profiles_updated_at ON fd_user_profiles;
CREATE TRIGGER fd_user_profiles_updated_at
  BEFORE UPDATE ON fd_user_profiles
  FOR EACH ROW EXECUTE FUNCTION fd_set_updated_at();

-- ============================================================
-- 2. Add avatar_url column to fd_user_profiles
--    Safe if table was just created above — idempotent
-- ============================================================
ALTER TABLE fd_user_profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================
-- 3. RLS — fd_user_profiles
-- ============================================================
ALTER TABLE fd_user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fd_user_profiles' AND policyname = 'fd_user_profiles_select_own'
  ) THEN
    CREATE POLICY "fd_user_profiles_select_own"
      ON fd_user_profiles FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fd_user_profiles' AND policyname = 'fd_user_profiles_admin_select'
  ) THEN
    CREATE POLICY "fd_user_profiles_admin_select"
      ON fd_user_profiles FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM fd_user_roles
          WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fd_user_profiles' AND policyname = 'fd_user_profiles_upsert_own'
  ) THEN
    CREATE POLICY "fd_user_profiles_upsert_own"
      ON fd_user_profiles FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fd_user_profiles' AND policyname = 'fd_user_profiles_update_own'
  ) THEN
    CREATE POLICY "fd_user_profiles_update_own"
      ON fd_user_profiles FOR UPDATE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END;
$$;

-- ============================================================
-- 4. Create fd-avatars storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fd-avatars',
  'fd-avatars',
  false,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. Storage RLS — fd-avatars
--    Path convention: {user_id}/avatar.{ext}
-- ============================================================
DROP POLICY IF EXISTS "fd_avatars_insert_own" ON storage.objects;
CREATE POLICY "fd_avatars_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fd-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "fd_avatars_select_own" ON storage.objects;
CREATE POLICY "fd_avatars_select_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'fd-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "fd_avatars_update_own" ON storage.objects;
CREATE POLICY "fd_avatars_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'fd-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "fd_avatars_delete_own" ON storage.objects;
CREATE POLICY "fd_avatars_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'fd-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "fd_avatars_select_admin" ON storage.objects;
CREATE POLICY "fd_avatars_select_admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'fd-avatars'
    AND EXISTS (
      SELECT 1 FROM fd_user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
