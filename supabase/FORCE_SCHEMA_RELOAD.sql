-- ============================================
-- FORCE SCHEMA CACHE RELOAD
-- Run this script in Supabase SQL Editor
-- ============================================

-- Step 1: Drop the existing function completely
DROP FUNCTION IF EXISTS get_available_rooms_v2(date, date, text);
DROP FUNCTION IF EXISTS public.get_available_rooms_v2(date, date, text);

-- Step 2: Recreate the function
-- Input param 'filter_type' avoids conflict with output column 'room_type' (42P13)
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
  WHERE r.status IN ('available', 'occupied')  -- Include occupied for real-time check
    AND (filter_type IS NULL OR r.room_type = filter_type)
  ORDER BY r.floor_level, r.position_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Step 4: Verify the function signature
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as parameters
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_available_rooms_v2';

-- Expected output should show:
-- function_name: get_available_rooms_v2
-- parameters: check_in date, check_out date, room_type text DEFAULT NULL::text

DO $$
BEGIN
  RAISE NOTICE '✅ Function recreated with parameters: check_in, check_out, room_type';
  RAISE NOTICE '� Using positional parameters ($1, $2, $3) to avoid naming conflicts';
  RAISE NOTICE '�🔄 Schema cache reload signal sent to PostgREST';
  RAISE NOTICE '⏳ Wait 10 seconds before testing';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test RPC call from frontend should now work!';
  RAISE NOTICE '   Frontend sends: { check_in, check_out, room_type }';
  RAISE NOTICE '   PostgREST maps to: get_available_rooms_v2(check_in, check_out, room_type)';
  RAISE NOTICE '   Function uses: $1 (check_in), $2 (check_out), $3 (room_type)';
END $$;
