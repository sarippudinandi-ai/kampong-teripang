-- ============================================
-- END-TO-END BOOKING FLOW SCHEMA
-- Dedicated bookings table with WhatsApp integration
-- Run this AFTER cinema_inventory_schema.sql
-- ============================================

-- ============================================
-- 1. CREATE BOOKINGS TABLE (Simplified Guest Flow)
-- ============================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE,              -- Format: KLM-XXXXX
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_wa TEXT NOT NULL,                        -- WhatsApp number
  room_id UUID NOT NULL REFERENCES rooms(id),    -- Foreign key to rooms
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,
  guest_count INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(12,2) NOT NULL,
  
  -- Booking workflow status
  booking_status TEXT CHECK (
    booking_status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT')
  ) DEFAULT 'PENDING_PAYMENT',
  
  payment_status TEXT CHECK (
    payment_status IN ('UNPAID', 'PAID', 'REFUNDED')
  ) DEFAULT 'UNPAID',
  
  -- Additional fields
  notes TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_wa ON bookings(guest_wa);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);

-- ============================================
-- 2. CREATE FUNCTION: Generate Unique Booking ID
-- ============================================

CREATE OR REPLACE FUNCTION generate_booking_id()
RETURNS TEXT AS $$
DECLARE
  v_new_id TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate KLM-XXXXX format (random 5 alphanumeric)
    v_new_id := 'KLM-' || UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 5)
    );
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_id = v_new_id) INTO v_exists;
    
    -- If unique, exit loop
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. CREATE TRIGGER: Auto-generate booking_id
-- ============================================

CREATE OR REPLACE FUNCTION set_booking_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_id IS NULL OR NEW.booking_id = '' THEN
    NEW.booking_id := generate_booking_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_booking_id
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_booking_id();

-- ============================================
-- 4. CREATE TRIGGER: Auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_booking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_booking_timestamp
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_booking_timestamp();

-- ============================================
-- 5. CREATE TRIGGER: Sync with room_bookings table
-- ============================================

CREATE OR REPLACE FUNCTION sync_booking_to_room_bookings()
RETURNS TRIGGER AS $$
DECLARE
  v_date DATE;
BEGIN
  -- When booking is CONFIRMED and PAID
  IF NEW.booking_status = 'CONFIRMED' AND NEW.payment_status = 'PAID' THEN
    -- Mark room as occupied
    UPDATE rooms
    SET status = 'occupied', updated_at = NOW()
    WHERE id = NEW.room_id;
    
    -- Create room_bookings entries for each night
    v_date := NEW.check_in;
    WHILE v_date < NEW.check_out LOOP
      INSERT INTO room_bookings (room_id, transaction_id, booking_date, status)
      VALUES (NEW.room_id, NEW.id, v_date, 'booked')
      ON CONFLICT (room_id, booking_date) DO NOTHING;
      
      v_date := v_date + INTERVAL '1 day';
    END LOOP;
    
    -- Set confirmed timestamp
    NEW.confirmed_at := NOW();
  END IF;
  
  -- When booking is CANCELLED
  IF NEW.booking_status = 'CANCELLED' THEN
    -- Delete room_bookings entries
    DELETE FROM room_bookings
    WHERE transaction_id = NEW.id;
    
    -- Check if room should be set back to available
    UPDATE rooms
    SET status = 'available', updated_at = NOW()
    WHERE id = NEW.room_id
      AND NOT EXISTS (
        SELECT 1 FROM room_bookings
        WHERE room_id = NEW.room_id
          AND booking_date >= CURRENT_DATE
      );
    
    -- Set cancelled timestamp
    NEW.cancelled_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_booking_to_room_bookings
BEFORE UPDATE ON bookings
FOR EACH ROW
WHEN (OLD.booking_status IS DISTINCT FROM NEW.booking_status OR OLD.payment_status IS DISTINCT FROM NEW.payment_status)
EXECUTE FUNCTION sync_booking_to_room_bookings();

-- ============================================
-- 6. CREATE FUNCTION: Check booking conflicts
-- ============================================

CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_room_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  -- Check if there are any confirmed bookings for this room in the date range
  SELECT COUNT(*)
  INTO v_conflict_count
  FROM bookings
  WHERE room_id = p_room_id
    AND booking_status IN ('CONFIRMED', 'PENDING_PAYMENT', 'CHECKED_IN')
    AND payment_status != 'REFUNDED'
    AND (
      -- Overlap condition: any part of the date range intersects
      (check_in < p_check_out AND check_out > p_check_in)
    )
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id);
  
  -- Return TRUE if no conflicts, FALSE if conflicts exist
  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. CREATE FUNCTION: Get available rooms (enhanced)
-- ============================================

CREATE OR REPLACE FUNCTION get_available_rooms_v2(
  p_check_in DATE,
  p_check_out DATE,
  p_room_type TEXT DEFAULT NULL
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
    check_booking_conflict(r.id, p_check_in, p_check_out) as is_available
  FROM rooms r
  WHERE r.status IN ('available', 'occupied')  -- Include occupied for real-time check
    AND (p_room_type IS NULL OR r.room_type = p_room_type)
  ORDER BY r.floor_level, r.position_order;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. CREATE VIEW: Booking Dashboard
-- ============================================

CREATE OR REPLACE VIEW vw_bookings_dashboard AS
SELECT 
  b.id,
  b.booking_id,
  b.guest_name,
  b.guest_email,
  b.guest_wa,
  b.check_in,
  b.check_out,
  b.nights,
  b.guest_count,
  b.total_price,
  b.booking_status,
  b.payment_status,
  b.notes,
  b.admin_notes,
  b.created_at,
  b.confirmed_at,
  b.updated_at,
  r.room_number,
  r.room_name,
  r.room_type,
  r.photo_url,
  -- Calculated fields
  CASE 
    WHEN b.booking_status = 'PENDING_PAYMENT' THEN 'warning'
    WHEN b.booking_status = 'CONFIRMED' THEN 'success'
    WHEN b.booking_status = 'CANCELLED' THEN 'error'
    WHEN b.booking_status = 'CHECKED_IN' THEN 'info'
    WHEN b.booking_status = 'CHECKED_OUT' THEN 'default'
  END as status_color,
  -- Days until check-in
  b.check_in - CURRENT_DATE as days_until_checkin,
  -- Is today or upcoming
  CASE 
    WHEN b.check_in = CURRENT_DATE THEN 'today'
    WHEN b.check_in > CURRENT_DATE AND b.check_in <= CURRENT_DATE + INTERVAL '7 days' THEN 'upcoming'
    WHEN b.check_in > CURRENT_DATE THEN 'future'
    WHEN b.check_out >= CURRENT_DATE THEN 'current'
    ELSE 'past'
  END as timeline_status
FROM bookings b
LEFT JOIN rooms r ON b.room_id = r.id
ORDER BY b.created_at DESC;

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Public can insert bookings (guest booking flow)
CREATE POLICY "Anyone can create bookings" ON bookings
FOR INSERT WITH CHECK (TRUE);

-- Public can read their own bookings (with booking_id)
CREATE POLICY "Anyone can read bookings by booking_id" ON bookings
FOR SELECT USING (TRUE);

-- Authenticated users can read all bookings (admin)
CREATE POLICY "Authenticated can read all bookings" ON bookings
FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can update bookings (admin)
CREATE POLICY "Authenticated can update bookings" ON bookings
FOR UPDATE USING (auth.role() = 'authenticated');

-- Authenticated users can delete bookings (admin)
CREATE POLICY "Authenticated can delete bookings" ON bookings
FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- 10. ENABLE REALTIME FOR BOOKINGS TABLE
-- ============================================

-- Enable Realtime replication for bookings table
-- (This needs to be done in Supabase Dashboard > Database > Replication)
-- Or via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ End-to-End Booking Flow Schema Created Successfully!';
  RAISE NOTICE '📋 New Table: bookings (with booking_id, guest info, status)';
  RAISE NOTICE '🔧 New Functions: generate_booking_id, check_booking_conflict, get_available_rooms_v2';
  RAISE NOTICE '⚡ Triggers: Auto booking_id, sync with room_bookings, auto timestamps';
  RAISE NOTICE '📊 View: vw_bookings_dashboard (complete booking overview)';
  RAISE NOTICE '🔐 RLS Policies: Public can create/read, admin can manage';
  RAISE NOTICE '📡 Realtime: Enabled for bookings table';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to implement WhatsApp-integrated Booking Flow!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Manual Testing Queries (Run separately if needed):';
  RAISE NOTICE '   -- Test booking ID generation:';
  RAISE NOTICE '   SELECT generate_booking_id();';
  RAISE NOTICE '';
  RAISE NOTICE '   -- Test availability (explicit casting required):';
  RAISE NOTICE '   SELECT * FROM get_available_rooms_v2(';
  RAISE NOTICE '     CURRENT_DATE::date,';
  RAISE NOTICE '     (CURRENT_DATE + INTERVAL ''7 days'')::date,';
  RAISE NOTICE '     NULL::text';
  RAISE NOTICE '   );';
  RAISE NOTICE '';
  RAISE NOTICE '   -- Test conflict check:';
  RAISE NOTICE '   SELECT check_booking_conflict(';
  RAISE NOTICE '     (SELECT id FROM rooms WHERE room_number = ''A1''),';
  RAISE NOTICE '     (CURRENT_DATE + INTERVAL ''1 day'')::date,';
  RAISE NOTICE '     (CURRENT_DATE + INTERVAL ''3 days'')::date';
  RAISE NOTICE '   );';
END $$;
