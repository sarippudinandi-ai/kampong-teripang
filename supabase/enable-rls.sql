-- =====================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) SETUP
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS FOR ALL TABLES
-- =====================================================

ALTER TABLE IF EXISTS availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. AVAILABILITY TABLE POLICIES
-- =====================================================

-- Drop existing policies if any (untuk re-run script)
DROP POLICY IF EXISTS "Public can read availability" ON availability;
DROP POLICY IF EXISTS "Authenticated users can insert availability" ON availability;
DROP POLICY IF EXISTS "Authenticated users can update availability" ON availability;
DROP POLICY IF EXISTS "Authenticated users can delete availability" ON availability;

-- Public bisa READ availability (untuk kalender di homepage)
CREATE POLICY "Public can read availability"
ON availability
FOR SELECT
USING (true);

-- Hanya authenticated users bisa INSERT
CREATE POLICY "Authenticated users can insert availability"
ON availability
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Hanya authenticated users bisa UPDATE
CREATE POLICY "Authenticated users can update availability"
ON availability
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Hanya authenticated users bisa DELETE
CREATE POLICY "Authenticated users can delete availability"
ON availability
FOR DELETE
USING (auth.role() = 'authenticated');

-- =====================================================
-- 3. TRANSACTIONS TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON transactions;

-- Hanya authenticated users bisa READ transactions
CREATE POLICY "Authenticated users can read transactions"
ON transactions
FOR SELECT
USING (auth.role() = 'authenticated');

-- Hanya authenticated users bisa INSERT transactions
CREATE POLICY "Authenticated users can insert transactions"
ON transactions
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Hanya authenticated users bisa UPDATE transactions
CREATE POLICY "Authenticated users can update transactions"
ON transactions
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 4. VERIFY RLS IS ENABLED
-- =====================================================

-- Check if RLS is enabled (should return true for all tables)
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('availability', 'transactions');

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index untuk faster queries
CREATE INDEX IF NOT EXISTS idx_availability_tanggal 
ON availability(tanggal);

CREATE INDEX IF NOT EXISTS idx_transactions_status 
ON transactions(status_pembayaran);

CREATE INDEX IF NOT EXISTS idx_transactions_created 
ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_email 
ON transactions(email);

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- Verify policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('availability', 'transactions')
ORDER BY tablename, policyname;

-- Expected output:
-- availability | Public can read availability | PERMISSIVE | {public} | SELECT
-- availability | Authenticated users can insert availability | PERMISSIVE | {authenticated} | INSERT
-- availability | Authenticated users can update availability | PERMISSIVE | {authenticated} | UPDATE
-- availability | Authenticated users can delete availability | PERMISSIVE | {authenticated} | DELETE
-- transactions | Authenticated users can read transactions | PERMISSIVE | {authenticated} | SELECT
-- transactions | Authenticated users can insert transactions | PERMISSIVE | {authenticated} | INSERT
-- transactions | Authenticated users can update transactions | PERMISSIVE | {authenticated} | UPDATE

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. Public (unauthenticated users) can only READ availability
-- 2. Authenticated users have full access to availability and transactions
-- 3. Admin panel operations require authentication
-- 4. API routes will need to authenticate with Supabase service role key for write operations
-- 5. Indexes added for optimal query performance

-- =====================================================
-- NEXT STEPS:
-- =====================================================
-- 1. ✅ Run this script in Supabase SQL Editor
-- 2. ✅ Verify all policies are created (check output above)
-- 3. ✅ Test public access: Try reading availability from frontend (should work)
-- 4. ✅ Test write protection: Try inserting without auth (should fail)
-- 5. ✅ Update API routes to use authenticated Supabase client for admin operations

-- For authenticated operations in API routes, use:
-- import { createClient } from '@supabase/supabase-js'
-- const supabase = createClient(
--   process.env.NEXT_PUBLIC_SUPABASE_URL!,
--   process.env.SUPABASE_SERVICE_ROLE_KEY! // NOT the anon key!
-- )
