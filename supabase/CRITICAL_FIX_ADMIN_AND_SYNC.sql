-- ============================================================
-- CRITICAL FIX: ADMIN LOGIN + DATA SYNCHRONIZATION
-- ============================================================
-- File: CRITICAL_FIX_ADMIN_AND_SYNC.sql
-- Purpose: Fix admin_users table missing + sync room data
-- Run this in Supabase SQL Editor
-- ============================================================

-- STEP 1: Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- STEP 2: CREATE ADMIN_USERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO anon;
GRANT ALL ON public.admin_users TO service_role;

-- Create RLS policy: Allow select for login verification
DROP POLICY IF EXISTS "Allow select admin users" ON public.admin_users;
CREATE POLICY "Allow select admin users" 
ON public.admin_users
FOR SELECT 
USING (true);

-- Create RLS policy: Allow insert (for future admin creation)
DROP POLICY IF EXISTS "Allow insert admin users" ON public.admin_users;
CREATE POLICY "Allow insert admin users" 
ON public.admin_users
FOR INSERT 
WITH CHECK (true);

-- Create RLS policy: Allow update
DROP POLICY IF EXISTS "Allow update admin users" ON public.admin_users;
CREATE POLICY "Allow update admin users" 
ON public.admin_users
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- ============================================================
-- STEP 3: INSERT DEFAULT ADMIN USER
-- ============================================================

-- Insert admin with password 'melamun2024'
-- Use ON CONFLICT to avoid duplicate if already exists
INSERT INTO public.admin_users (username, password, created_at)
VALUES (
  'admin', 
  crypt('melamun2024', gen_salt('bf')), 
  NOW()
)
ON CONFLICT (username) 
DO UPDATE SET 
  password = crypt('melamun2024', gen_salt('bf')),
  updated_at = NOW();

-- ============================================================
-- STEP 4: VERIFY ROOMS TABLE DATA (SINGLE SOURCE OF TRUTH)
-- ============================================================

-- Check if rooms table exists and has correct structure
DO $$
DECLARE
  rooms_count INTEGER;
  rooms_exists BOOLEAN;
BEGIN
  -- Check if rooms table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rooms'
  ) INTO rooms_exists;

  IF NOT rooms_exists THEN
    RAISE WARNING '⚠️  Table "rooms" not found. Run cinema_inventory_schema.sql first.';
  ELSE
    -- Count rooms
    SELECT COUNT(*) INTO rooms_count FROM public.rooms;
    
    IF rooms_count = 0 THEN
      RAISE WARNING '⚠️  Table "rooms" exists but has 0 rows. Insert room data.';
    ELSE
      RAISE NOTICE '✅ Table "rooms" exists with % rows', rooms_count;
    END IF;
  END IF;
END $$;

-- Display current rooms data (for verification)
SELECT 
  id,
  room_number,
  room_name,
  room_type,
  status,
  capacity,
  base_price
FROM public.rooms
ORDER BY floor_level, position_order;

-- ============================================================
-- STEP 5: FIX RLS FOR CRITICAL TABLES
-- ============================================================

-- Ensure bookings can be updated by admin
DROP POLICY IF EXISTS "Allow update bookings" ON public.bookings;
CREATE POLICY "Allow update bookings" 
ON public.bookings
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Ensure audit log can be inserted
DROP POLICY IF EXISTS "Allow insert audit log" ON public.booking_audit_log;
CREATE POLICY "Allow insert audit log" 
ON public.booking_audit_log
FOR INSERT 
WITH CHECK (true);

-- Ensure rooms can be updated (for triggers)
DROP POLICY IF EXISTS "Allow update rooms" ON public.rooms;
CREATE POLICY "Allow update rooms" 
ON public.rooms
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- ============================================================
-- STEP 6: VERIFICATION SUMMARY
-- ============================================================

DO $$
DECLARE
  admin_count INTEGER;
  bookings_exists BOOLEAN;
  audit_exists BOOLEAN;
  rooms_exists BOOLEAN;
BEGIN
  -- Count admin users
  SELECT COUNT(*) INTO admin_count FROM public.admin_users;
  
  -- Check tables
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bookings'
  ) INTO bookings_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'booking_audit_log'
  ) INTO audit_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rooms'
  ) INTO rooms_exists;

  -- Report
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '  CRITICAL FIX VERIFICATION REPORT';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  IF admin_count > 0 THEN
    RAISE NOTICE '✅ admin_users table: EXISTS (% users)', admin_count;
    RAISE NOTICE '   → Default admin: username="admin", password="melamun2024"';
  ELSE
    RAISE WARNING '⚠️  admin_users table exists but has 0 users!';
  END IF;

  IF bookings_exists THEN
    RAISE NOTICE '✅ bookings table: EXISTS';
  ELSE
    RAISE WARNING '⚠️  bookings table: NOT FOUND';
  END IF;

  IF audit_exists THEN
    RAISE NOTICE '✅ booking_audit_log table: EXISTS';
  ELSE
    RAISE WARNING '⚠️  booking_audit_log table: NOT FOUND';
  END IF;

  IF rooms_exists THEN
    RAISE NOTICE '✅ rooms table: EXISTS';
  ELSE
    RAISE WARNING '⚠️  rooms table: NOT FOUND';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS Policies updated:';
  RAISE NOTICE '   - admin_users: SELECT/INSERT/UPDATE allowed';
  RAISE NOTICE '   - bookings: UPDATE allowed';
  RAISE NOTICE '   - booking_audit_log: INSERT allowed';
  RAISE NOTICE '   - rooms: UPDATE allowed';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 NEXT STEPS:';
  RAISE NOTICE '   1. Login admin: http://localhost:3000/admin';
  RAISE NOTICE '   2. Password: melamun2024';
  RAISE NOTICE '   3. Test "Konfirmasi" button on bookings';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

-- ============================================================
-- STEP 7: RELOAD POSTGREST CACHE
-- ============================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- STEP 8: CREATE PASSWORD VERIFICATION FUNCTION
-- ============================================================

-- Function to verify admin password (called by API route)
CREATE OR REPLACE FUNCTION verify_admin_password(
  input_username TEXT,
  input_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_password TEXT;
BEGIN
  -- Get stored hashed password
  SELECT password INTO stored_password
  FROM public.admin_users
  WHERE username = input_username;

  -- If user not found, return false
  IF stored_password IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verify password using pgcrypto's crypt function
  -- crypt(input, stored) will hash input with same salt and compare
  RETURN (crypt(input_password, stored_password) = stored_password);
END;
$$;

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION verify_admin_password(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_password(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_admin_password(TEXT, TEXT) TO service_role;
