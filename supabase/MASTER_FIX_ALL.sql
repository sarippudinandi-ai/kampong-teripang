-- ============================================================
-- MASTER FIX ALL - Run this ONCE in Supabase SQL Editor
-- Fixes: RPC params, rooms RLS, Realtime, schema cache reload
-- Safe to re-run (idempotent)
-- ============================================================

-- ------------------------------------------------------------
-- FIX 1: Recreate get_available_rooms_v2 (positional params)
--        Frontend sends { check_in, check_out, room_type }
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS get_available_rooms_v2(date, date, text);
DROP FUNCTION IF EXISTS public.get_available_rooms_v2(date, date, text);

CREATE OR REPLACE FUNCTION get_available_rooms_v2(
  check_in DATE,
  check_out DATE,
  filter_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  room_id UUID,
  room_number TEXT,
  room_name TEXT,
  room_type TEXT,
  capacity INTEGER,
  base_price INTEGER,
  amenities JSONB,
  photo_url TEXT,
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.room_number,
    r.room_name,
    r.room_type,
    r.capacity,
    r.base_price,
    r.amenities,
    r.photo_url,
    check_booking_conflict(r.id, check_in, check_out) as is_available
  FROM rooms r
  WHERE r.status IN ('available', 'occupied')
    AND (filter_type IS NULL OR r.room_type = filter_type)
  ORDER BY r.floor_level, r.position_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- FIX 2: rooms RLS - allow PUBLIC to read ALL rooms
--        (admin Cinema Grid needs to see occupied/maintenance)
--        Room info is not sensitive; bookings remain protected.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public can read available rooms" ON rooms;
DROP POLICY IF EXISTS "Authenticated can read all rooms" ON rooms;
DROP POLICY IF EXISTS "Public can read all rooms" ON rooms;

CREATE POLICY "Public can read all rooms" ON rooms
FOR SELECT USING (TRUE);

-- ------------------------------------------------------------
-- FIX 3: Enable Realtime for bookings + rooms (idempotent)
-- ------------------------------------------------------------
DO $$
BEGIN
  -- bookings
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  END IF;

  -- rooms
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
  END IF;
END $$;

-- ------------------------------------------------------------
-- FIX 4: Force PostgREST schema cache reload
-- ------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- ------------------------------------------------------------
-- VERIFICATION
-- ------------------------------------------------------------

-- 4a. Function signature
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS parameters
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_available_rooms_v2';

-- 4b. Test the function directly (should return rooms)
SELECT room_number, room_name, room_type, is_available
FROM get_available_rooms_v2(
  CURRENT_DATE::date,
  (CURRENT_DATE + INTERVAL '1 day')::date,
  NULL::text
);

-- 4c. rooms RLS policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'rooms';

-- 4d. Realtime tables
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND tablename IN ('bookings', 'rooms');

DO $$
BEGIN
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'MASTER FIX COMPLETE';
  RAISE NOTICE '  [1] get_available_rooms_v2 recreated (check_in, check_out, room_type)';
  RAISE NOTICE '  [2] rooms RLS -> public can read ALL rooms';
  RAISE NOTICE '  [3] Realtime enabled for bookings + rooms';
  RAISE NOTICE '  [4] Schema cache reload signal sent';
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Wait 10 seconds, then hard-refresh the app (Ctrl+Shift+R)';
END $$;
