-- ============================================================
-- CRITICAL FIX: CREATE AUDIT LOG TABLE + FIX ALL RLS
-- ============================================================
-- File: FIX_AUDIT_LOG_AND_RLS.sql
-- Purpose: Membuat tabel booking_audit_log yang hilang + memperbaiki RLS
-- Run this in Supabase SQL Editor
-- ============================================================

-- STEP 1: Create booking_audit_log table (if not exists)
-- This table is required by admin API for logging booking changes
CREATE TABLE IF NOT EXISTS public.booking_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  changed_by TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.booking_audit_log ENABLE ROW LEVEL SECURITY;

-- Grant access to audit log table
GRANT ALL ON public.booking_audit_log TO authenticated;
GRANT ALL ON public.booking_audit_log TO anon;
GRANT ALL ON public.booking_audit_log TO service_role;

-- Create RLS policy: Allow insert for everyone (logged by admin API)
DROP POLICY IF EXISTS "Allow insert audit log" ON public.booking_audit_log;
CREATE POLICY "Allow insert audit log" 
ON public.booking_audit_log
FOR INSERT 
WITH CHECK (true);

-- Create RLS policy: Allow select for everyone
DROP POLICY IF EXISTS "Allow select audit log" ON public.booking_audit_log;
CREATE POLICY "Allow select audit log" 
ON public.booking_audit_log
FOR SELECT 
USING (true);

-- ============================================================
-- STEP 2: FIX RLS ON BOOKINGS TABLE
-- ============================================================

-- Allow UPDATE on bookings (needed for admin confirmation)
DROP POLICY IF EXISTS "Allow update bookings" ON public.bookings;
CREATE POLICY "Allow update bookings" 
ON public.bookings
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Allow DELETE on bookings (needed for admin cancellation)
DROP POLICY IF EXISTS "Allow delete bookings" ON public.bookings;
CREATE POLICY "Allow delete bookings" 
ON public.bookings
FOR DELETE 
USING (true);

-- ============================================================
-- STEP 3: FIX RLS ON ROOMS TABLE
-- ============================================================

-- Allow UPDATE on rooms (needed by triggers when booking status changes)
DROP POLICY IF EXISTS "Allow update rooms" ON public.rooms;
CREATE POLICY "Allow update rooms" 
ON public.rooms
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- ============================================================
-- STEP 4: VERIFY TABLES EXIST
-- ============================================================

DO $$
DECLARE
  bookings_exists BOOLEAN;
  rooms_exists BOOLEAN;
  audit_exists BOOLEAN;
  trigger_exists BOOLEAN;
BEGIN
  -- Check tables
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bookings'
  ) INTO bookings_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rooms'
  ) INTO rooms_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'booking_audit_log'
  ) INTO audit_exists;

  -- Check trigger
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trg_sync_booking_to_rooms'
  ) INTO trigger_exists;

  -- Report
  IF NOT bookings_exists THEN
    RAISE WARNING '⚠️  Table "bookings" not found. Run bookings_flow_schema.sql first.';
  END IF;

  IF NOT rooms_exists THEN
    RAISE WARNING '⚠️  Table "rooms" not found. Run cinema_inventory_schema.sql first.';
  END IF;

  IF NOT trigger_exists THEN
    RAISE WARNING '⚠️  Trigger "trg_sync_booking_to_rooms" not found.';
  END IF;

  IF audit_exists THEN
    RAISE NOTICE '✅ booking_audit_log table: EXISTS';
  ELSE
    RAISE NOTICE '✅ booking_audit_log table: CREATED';
  END IF;

  IF bookings_exists AND rooms_exists THEN
    RAISE NOTICE '✅ Core tables (bookings, rooms): EXISTS';
  END IF;

  RAISE NOTICE '✅ RLS policies updated:';
  RAISE NOTICE '   - bookings: UPDATE/DELETE allowed';
  RAISE NOTICE '   - booking_audit_log: INSERT/SELECT allowed';
  RAISE NOTICE '   - rooms: UPDATE allowed';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Admin confirmation should now work.';
  RAISE NOTICE '   Test: Click "Konfirmasi" button in Admin Bookings';
END $$;

-- ============================================================
-- STEP 5: RELOAD POSTGREST CACHE
-- ============================================================
NOTIFY pgrst, 'reload schema';
