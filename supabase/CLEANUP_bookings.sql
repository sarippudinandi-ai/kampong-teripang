-- =====================================================
-- CLEANUP SCRIPT FOR BOOKINGS FLOW SCHEMA
-- =====================================================
-- Use this to completely remove all bookings schema objects
-- =====================================================

-- Drop triggers
DROP TRIGGER IF EXISTS trg_set_booking_id ON bookings;
DROP TRIGGER IF EXISTS trg_update_booking_timestamp ON bookings;
DROP TRIGGER IF EXISTS trg_sync_booking_to_room_bookings ON bookings;

-- Drop views
DROP VIEW IF EXISTS vw_bookings_dashboard;

-- Drop tables (CASCADE removes dependencies)
DROP TABLE IF EXISTS booking_audit_log CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS generate_booking_id();
DROP FUNCTION IF EXISTS check_booking_conflict(uuid, date, date, uuid);
DROP FUNCTION IF EXISTS get_available_rooms_v2(date, date, text);
DROP FUNCTION IF EXISTS set_booking_id();
DROP FUNCTION IF EXISTS update_booking_timestamp();
DROP FUNCTION IF EXISTS sync_booking_to_room_bookings();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ CLEANUP COMPLETE';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Removed: 2 tables, 6 functions, 3 triggers, 1 view';
  RAISE NOTICE 'You can now run bookings_flow_schema.sql';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
