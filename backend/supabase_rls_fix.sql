-- ═══════════════════════════════════════════════════════════════════════════
-- CineHybrid Supabase RLS Security Fix
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Paste & Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ── STEP 1: Enable Row Level Security on all tables ───────────────────────
-- This blocks ALL public access by default until you add policies below

ALTER TABLE movies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users   ENABLE ROW LEVEL SECURITY;

-- ── STEP 2: Allow READ-ONLY public access to the movies table ─────────────
-- The movie catalog is public data — anyone can read it (no write)

CREATE POLICY "movies_public_read"
  ON movies FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── STEP 3: Block all public writes to movies (only service_role can write) 
-- Data is inserted only via the migrate.py script (which uses postgres role)

CREATE POLICY "movies_service_insert"
  ON movies FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "movies_service_update"
  ON movies FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "movies_service_delete"
  ON movies FOR DELETE
  TO service_role
  USING (true);

-- ── STEP 4: Community ratings — only authenticated users can insert ────────

CREATE POLICY "ratings_public_read"
  ON ratings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "ratings_auth_insert"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No update/delete on ratings for regular users (service_role only)
CREATE POLICY "ratings_service_manage"
  ON ratings FOR ALL
  TO service_role
  USING (true);

-- ── STEP 5: Users table — STRICT privacy ──────────────────────────────────
-- Users can only read their OWN row; nobody else can see other users

-- Block ALL anon access to users table
-- (auth is handled by backend, not Supabase auth)

CREATE POLICY "users_service_only"
  ON users FOR ALL
  TO service_role
  USING (true);

-- ── STEP 6: Verify RLS is enabled ────────────────────────────────────────
-- After running, check this returns rls_enabled = true for all tables

SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('movies', 'ratings', 'users')
ORDER BY tablename;

-- Expected output:
-- schemaname | tablename | rls_enabled
-- -----------+-----------+------------
-- public     | movies    | true
-- public     | ratings   | true
-- public     | users     | true
