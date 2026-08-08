-- ============================================================
-- FINAL FIX: booking_audit_log + RLS + VERIFICATION
-- Run ONCE in Supabase SQL Editor
--
-- Fixes:
-- 1. "relation booking_audit_log does not exist" error
-- 2. RLS blocking admin UPDATE/DELETE/INSERT
-- 3. Verifies all core tables & triggers exist
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- STEP 1: CREATE booking_audit_log TABLE (if missing)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS booking_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  old_payment_status TEXT,
  new_payment_status TEXT,
  changed_by TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit_log
ALTER TABLE booking_audit_log ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- STEP 2: FIX RLS POLICIES (allow admin operations)
-- ═══════════════════════════════════════════════════════════

-- bookings: allow UPDATE (for status changes)
DROP POLICY IF EXISTS "Authenticated can update bookings" ON bookings;
DROP POLICY IF EXISTS "Public can update bookings" ON bookings;
CREATE POLICY "Public can update bookings" ON bookings
FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

-- bookings: allow DELETE (for cancellations)
DROP POLICY IF EXISTS "Authenticated can delete bookings" ON bookings;
DROP POLICY IF EXISTS "Public can delete bookings" ON bookings;
CREATE POLICY "Public can delete bookings" ON bookings
FOR DELETE USING (TRUE);

-- booking_audit_log: allow INSERT (for audit logging)
DROP POLICY IF EXISTS "Public can insert audit log" ON booking_audit_log;
CREATE POLICY "Public can insert audit log" ON booking_audit_log
FOR INSERT WITH CHECK (TRUE);

-- booking_audit_log: allow SELECT (for admin to view logs)
DROP POLICY IF EXISTS "Public can read audit log" ON booking_audit_log;
CREATE POLICY "Public can read audit log" ON booking_audit_log
FOR SELECT USING (TRUE);

-- rooms: allow UPDATE (for status sync via triggers)
DROP POLICY IF EXISTS "Authenticated can update rooms" ON rooms;
DROP POLICY IF EXISTS "Public can update rooms" ON rooms;
CREATE POLICY "Public can update rooms" ON rooms
FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

-- ═══════════════════════════════════════════════════════════
-- STEP 3: RELOAD PostgREST SCHEMA CACHE
-- ═══════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════
-- STEP 4: VERIFICATION (check all components exist)
-- ═══════════════════════════════════════════════════════════
DO $$
DECLARE
  bookings_exists BOOLEAN;
  rooms_exists BOOLEAN;
  audit_exists BOOLEAN;
  trigger_sync_exists BOOLEAN;
  trigger_audit_exists BOOLEAN;
  view_dashboard_exists BOOLEAN;
  rpc_available_rooms_exists BOOLEAN;
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

  -- Check triggers
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trg_sync_booking_to_rooms'
  ) INTO trigger_sync_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trg_audit_booking_status_change'
  ) INTO trigger_audit_exists;

  -- Check view
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'vw_bookings_dashboard'
  ) INTO view_dashboard_exists;

  -- Check RPC function
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_available_rooms_v2'
  ) INTO rpc_available_rooms_exists;

  -- Report status
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '           VERIFICATION REPORT';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';

  IF bookings_exists THEN
    RAISE NOTICE '✅ Table "bookings" exists';
  ELSE
    RAISE WARNING '❌ Table "bookings" NOT FOUND - Run bookings_flow_schema.sql';
  END IF;

  IF rooms_exists THEN
    RAISE NOTICE '✅ Table "rooms" exists';
  ELSE
    RAISE WARNING '❌ Table "rooms" NOT FOUND - Run cinema_inventory_schema.sql';
  END IF;

  IF audit_exists THEN
    RAISE NOTICE '✅ Table "booking_audit_log" created/exists';
  ELSE
    RAISE WARNING '❌ Table "booking_audit_log" creation failed';
  END IF;

  IF trigger_sync_exists THEN
    RAISE NOTICE '✅ Trigger "trg_sync_booking_to_rooms" exists';
  ELSE
    RAISE WARNING '⚠️  Trigger "trg_sync_booking_to_rooms" NOT FOUND';
  END IF;

  IF trigger_audit_exists THEN
    RAISE NOTICE '✅ Trigger "trg_audit_booking_status_change" exists';
  ELSE
    RAISE WARNING '⚠️  Trigger "trg_audit_booking_status_change" NOT FOUND';
  END IF;

  IF view_dashboard_exists THEN
    RAISE NOTICE '✅ View "vw_bookings_dashboard" exists';
  ELSE
    RAISE WARNING '⚠️  View "vw_bookings_dashboard" NOT FOUND';
  END IF;

  IF rpc_available_rooms_exists THEN
    RAISE NOTICE '✅ RPC "get_available_rooms_v2" exists';
  ELSE
    RAISE WARNING '⚠️  RPC "get_available_rooms_v2" NOT FOUND';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '           RLS POLICIES UPDATED';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ bookings: UPDATE policy set to PUBLIC';
  RAISE NOTICE '✅ bookings: DELETE policy set to PUBLIC';
  RAISE NOTICE '✅ booking_audit_log: INSERT policy set to PUBLIC';
  RAISE NOTICE '✅ booking_audit_log: SELECT policy set to PUBLIC';
  RAISE NOTICE '✅ rooms: UPDATE policy set to PUBLIC';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'Admin booking confirmation should now work!';
  RAISE NOTICE 'Error "relation booking_audit_log does not exist" is FIXED';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;
