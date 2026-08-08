-- ============================================
-- ENABLE REALTIME FOR BOOKINGS AND ROOMS
-- Run this if Replication menu doesn't show tables
-- ============================================

-- Enable Realtime for bookings table
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- Enable Realtime for rooms table (for status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- Verify Realtime is enabled
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('bookings', 'rooms')
ORDER BY tablename;

-- Expected output:
-- schemaname | tablename | pubname
-- -----------+-----------+------------------
-- public     | bookings  | supabase_realtime
-- public     | rooms     | supabase_realtime

DO $$
BEGIN
  RAISE NOTICE '✅ Realtime enabled for bookings and rooms tables';
  RAISE NOTICE '📡 Admin dashboard will now receive real-time updates';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 To test:';
  RAISE NOTICE '   1. Keep admin dashboard open';
  RAISE NOTICE '   2. Create a booking as guest in another tab';
  RAISE NOTICE '   3. Admin should see the booking appear automatically (no F5)';
END $$;
