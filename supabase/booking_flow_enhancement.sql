-- ============================================
-- BOOKING FLOW ENHANCEMENT SCHEMA
-- Enhance existing transactions table for complete booking flow
-- Run this AFTER cinema_inventory_schema.sql
-- ============================================

-- ============================================
-- 1. ADD BOOKING_ID FIELD TO TRANSACTIONS
-- ============================================

-- Add human-readable booking ID (format: KLM-XXXXX)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS booking_id TEXT UNIQUE;

-- Create index for fast booking ID lookup
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON transactions(booking_id);

-- ============================================
-- 2. CREATE FUNCTION TO GENERATE BOOKING ID
-- ============================================

CREATE OR REPLACE FUNCTION generate_booking_id()
RETURNS TEXT AS $$
DECLARE
  v_booking_id TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate format: KLM-{5 random alphanumeric}
    v_booking_id := 'KLM-' || UPPER(
      substring(md5(random()::text || clock_timestamp()::text) from 1 for 5)
    );
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM transactions WHERE booking_id = v_booking_id)
    INTO v_exists;
    
    -- Exit loop if unique
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. CREATE TRIGGER TO AUTO-GENERATE BOOKING_ID
-- ============================================

CREATE OR REPLACE FUNCTION set_booking_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set booking_id if NULL and this is a villa booking
  IF NEW.booking_id IS NULL AND NEW.tipe_order = 'villa' THEN
    NEW.booking_id := generate_booking_id();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trg_set_booking_id ON transactions;

CREATE TRIGGER trg_set_booking_id
BEFORE INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION set_booking_id();

-- ============================================
-- 4. UPDATE EXISTING TRANSACTIONS (Backfill booking_id)
-- ============================================

-- Backfill booking_id for existing villa bookings without booking_id
UPDATE transactions
SET booking_id = generate_booking_id()
WHERE booking_id IS NULL 
  AND tipe_order = 'villa';

-- ============================================
-- 5. CREATE VIEW FOR BOOKING CALENDAR
-- ============================================

-- View: Available dates for each room (for calendar)
CREATE OR REPLACE VIEW vw_room_availability_calendar AS
SELECT 
  r.id as room_id,
  r.room_number,
  r.room_type,
  r.capacity,
  r.base_price,
  generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '90 days',
    '1 day'::interval
  )::date as date,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM room_bookings rb
      WHERE rb.room_id = r.id
        AND rb.booking_date = generate_series::date
        AND rb.status IN ('booked', 'checked_in')
    ) THEN false
    ELSE true
  END as is_available,
  (
    SELECT t.booking_id 
    FROM room_bookings rb
    JOIN transactions t ON rb.transaction_id = t.id
    WHERE rb.room_id = r.id
      AND rb.booking_date = generate_series::date
      AND rb.status IN ('booked', 'checked_in')
    LIMIT 1
  ) as booking_id
FROM rooms r
WHERE r.status IN ('available', 'occupied')
ORDER BY r.floor_level, r.position_order, date;

-- ============================================
-- 6. CREATE FUNCTION FOR AVAILABILITY CHECK (Enhanced)
-- ============================================

-- Function: Get available room types with count for date range
CREATE OR REPLACE FUNCTION get_available_room_count(
  p_check_in DATE,
  p_check_out DATE,
  p_room_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  room_type TEXT,
  total_rooms BIGINT,
  available_rooms BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.room_type,
    COUNT(r.id) as total_rooms,
    COUNT(r.id) FILTER (
      WHERE NOT EXISTS (
        SELECT 1
        FROM room_bookings rb
        WHERE rb.room_id = r.id
          AND rb.booking_date >= p_check_in
          AND rb.booking_date < p_check_out
      )
    ) as available_rooms
  FROM rooms r
  WHERE r.status = 'available'
    AND (p_room_type IS NULL OR r.room_type = p_room_type)
  GROUP BY r.room_type
  ORDER BY r.room_type;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. CREATE REALTIME PUBLICATION FOR ADMIN
-- ============================================

-- Enable realtime for transactions table (for admin dashboard)
-- Note: This requires Supabase Realtime to be enabled

-- Drop publication if exists
DROP PUBLICATION IF EXISTS supabase_realtime_bookings;

-- Create publication for realtime updates
CREATE PUBLICATION supabase_realtime_bookings FOR TABLE transactions;

-- ============================================
-- 8. CREATE VIEW FOR PENDING BOOKINGS (Admin Dashboard)
-- ============================================

CREATE OR REPLACE VIEW vw_pending_bookings AS
SELECT 
  t.id,
  t.booking_id,
  t.nama_pemesan as guest_name,
  t.no_wa as guest_wa,
  t.email,
  t.booking_status,
  t.status_pembayaran as payment_status,
  t.check_in,
  t.check_out,
  t.guest_count,
  t.total_bayar as total_price,
  t.created_at,
  r.room_number,
  r.room_name,
  r.room_type,
  EXTRACT(EPOCH FROM (NOW() - t.created_at))/60 as minutes_since_booking
FROM transactions t
LEFT JOIN rooms r ON t.room_id = r.id
WHERE t.tipe_order = 'villa'
  AND t.booking_status IN ('inquiry', 'pending')
ORDER BY t.created_at DESC;

-- ============================================
-- 9. ADD BOOKING STATUS CONSTRAINTS (Safety)
-- ============================================

-- Ensure booking_status and payment_status are always in sync
CREATE OR REPLACE FUNCTION validate_booking_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment is PAID, booking must be at least CONFIRMED
  IF NEW.status_pembayaran = 'paid' AND NEW.booking_status IN ('inquiry', 'pending') THEN
    RAISE EXCEPTION 'Cannot mark payment as PAID for inquiry/pending bookings. Confirm booking first.';
  END IF;
  
  -- If booking is CONFIRMED, payment must be PAID
  IF NEW.booking_status IN ('confirmed', 'checked_in', 'checked_out') AND NEW.status_pembayaran != 'paid' THEN
    -- Auto-fix: Set payment to paid
    NEW.status_pembayaran := 'paid';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_booking_payment ON transactions;

CREATE TRIGGER trg_validate_booking_payment
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
WHEN (NEW.tipe_order = 'villa')
EXECUTE FUNCTION validate_booking_payment_status();

-- ============================================
-- 10. CREATE HELPER FUNCTION FOR BOOKING SUMMARY
-- ============================================

CREATE OR REPLACE FUNCTION get_booking_summary(p_booking_id TEXT)
RETURNS TABLE (
  booking_id TEXT,
  guest_name TEXT,
  guest_wa TEXT,
  guest_email TEXT,
  room_number TEXT,
  room_name TEXT,
  check_in DATE,
  check_out DATE,
  nights INTEGER,
  guest_count INTEGER,
  total_price INTEGER,
  booking_status TEXT,
  payment_status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.booking_id,
    t.nama_pemesan,
    t.no_wa,
    t.email,
    r.room_number,
    r.room_name,
    t.check_in,
    t.check_out,
    (t.check_out - t.check_in)::integer as nights,
    t.guest_count,
    t.total_bayar,
    t.booking_status,
    t.status_pembayaran,
    t.created_at
  FROM transactions t
  LEFT JOIN rooms r ON t.room_id = r.id
  WHERE t.booking_id = p_booking_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Test booking ID generation
SELECT generate_booking_id() as sample_booking_id;

-- Test availability count
SELECT * FROM get_available_room_count(
  CURRENT_DATE::date,
  (CURRENT_DATE + INTERVAL '2 days')::date,
  NULL::text
);

-- Test booking summary (if you have bookings)
-- SELECT * FROM get_booking_summary('KLM-XXXXX');

-- View pending bookings
SELECT * FROM vw_pending_bookings;

-- View room availability calendar (next 7 days)
SELECT * FROM vw_room_availability_calendar
WHERE date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND room_number = 'A1';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Booking Flow Enhancement Complete!';
  RAISE NOTICE '📋 Features Added:';
  RAISE NOTICE '   - Auto-generated booking_id (KLM-XXXXX format)';
  RAISE NOTICE '   - Real-time availability calendar view';
  RAISE NOTICE '   - Pending bookings dashboard view';
  RAISE NOTICE '   - Booking/payment status validation';
  RAISE NOTICE '   - Helper functions for availability & booking summary';
  RAISE NOTICE '';
  RAISE NOTICE '🔔 Next Steps:';
  RAISE NOTICE '   1. Enable Supabase Realtime in Dashboard';
  RAISE NOTICE '   2. Implement frontend calendar component';
  RAISE NOTICE '   3. Build checkout flow with WhatsApp redirect';
  RAISE NOTICE '   4. Add realtime subscription to admin dashboard';
END $$;
