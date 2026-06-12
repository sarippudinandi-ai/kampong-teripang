-- ============================================
-- CINEMA-STYLE INVENTORY MANAGEMENT SCHEMA
-- Upgrade from simple booking to dynamic room management
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE ROOMS TABLE (Physical Inventory)
-- ============================================

CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT NOT NULL UNIQUE,          -- e.g., "A1", "B2", "C3"
  room_name TEXT NOT NULL,                    -- e.g., "Sea View Premium"
  room_type TEXT NOT NULL,                    -- e.g., "standard", "deluxe", "family"
  listing_id TEXT REFERENCES listings(id),   -- Link to package
  capacity INTEGER NOT NULL DEFAULT 2,        -- Max guests
  floor_level INTEGER DEFAULT 1,              -- For UI layout (row in grid)
  position_order INTEGER DEFAULT 1,           -- For UI layout (column in grid)
  base_price INTEGER NOT NULL,                -- Default price per night
  status TEXT CHECK (status IN ('available', 'occupied', 'maintenance', 'blocked')) DEFAULT 'available',
  amenities JSONB DEFAULT '[]',               -- ["AC", "Sea View", "Private Deck"]
  photo_url TEXT,
  notes TEXT,                                  -- Admin notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_rooms_listing ON rooms(listing_id);

-- ============================================
-- 2. ENHANCE TRANSACTIONS TABLE
-- ============================================

-- Add room_id column to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id);

-- Add booking status workflow
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS booking_status TEXT CHECK (
  booking_status IN ('inquiry', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')
) DEFAULT 'inquiry';

-- Add check-in/check-out dates
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS check_in DATE;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS check_out DATE;

-- Add guest count
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 1;

-- Add admin notes
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add confirmed timestamp
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Add confirmed by (admin user)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS confirmed_by TEXT;

-- Update existing CHECK constraint for status_pembayaran
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_status_pembayaran_check;

ALTER TABLE transactions 
ADD CONSTRAINT transactions_status_pembayaran_check CHECK (
  status_pembayaran IN ('pending', 'paid', 'failed', 'refunded')
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_transactions_booking_status ON transactions(booking_status);
CREATE INDEX IF NOT EXISTS idx_transactions_room ON transactions(room_id);
CREATE INDEX IF NOT EXISTS idx_transactions_dates ON transactions(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

-- ============================================
-- 3. CREATE ROOM_BOOKINGS TABLE (Date-Range Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS room_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,                -- Each date in the range
  status TEXT CHECK (status IN ('blocked', 'booked', 'checked_in', 'checked_out')) DEFAULT 'booked',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, booking_date)              -- Prevent double booking
);

-- Indexes for fast availability checks
CREATE INDEX IF NOT EXISTS idx_room_bookings_room ON room_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_date ON room_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_room_bookings_transaction ON room_bookings(transaction_id);

-- ============================================
-- 4. CREATE AUDIT LOG TABLE (Track Changes)
-- ============================================

CREATE TABLE IF NOT EXISTS booking_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id),
  action TEXT NOT NULL,                      -- "created", "status_changed", "confirmed", "cancelled"
  old_status TEXT,
  new_status TEXT,
  changed_by TEXT,                           -- Admin user email
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_transaction ON booking_audit_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON booking_audit_log(created_at DESC);

-- ============================================
-- 5. SEED INITIAL ROOMS DATA
-- ============================================

-- Sea Healing Room (Standard) - 4 rooms
INSERT INTO rooms (room_number, room_name, room_type, listing_id, capacity, floor_level, position_order, base_price, amenities, photo_url) VALUES
('A1', 'Sea Healing A1', 'standard', 'villa-standard', 2, 1, 1, 850000, '["AC", "Sea View 360°", "Snorkeling Gear", "WiFi"]', 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600'),
('A2', 'Sea Healing A2', 'standard', 'villa-standard', 2, 1, 2, 850000, '["AC", "Sea View 360°", "Snorkeling Gear", "WiFi"]', 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600'),
('A3', 'Sea Healing A3', 'standard', 'villa-standard', 2, 1, 3, 850000, '["AC", "Sea View 360°", "Snorkeling Gear", "WiFi"]', 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600'),
('A4', 'Sea Healing A4', 'standard', 'villa-standard', 2, 1, 4, 850000, '["AC", "Sea View 360°", "Snorkeling Gear", "WiFi"]', 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600')
ON CONFLICT (room_number) DO NOTHING;

-- Kelong Deluxe Suite - 3 rooms
INSERT INTO rooms (room_number, room_name, room_type, listing_id, capacity, floor_level, position_order, base_price, amenities, photo_url) VALUES
('B1', 'Deluxe Suite B1', 'deluxe', 'villa-deluxe', 2, 2, 1, 1350000, '["Private Deck", "Bathtub Outdoor", "Kayak", "Smart TV", "WiFi"]', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600'),
('B2', 'Deluxe Suite B2', 'deluxe', 'villa-deluxe', 2, 2, 2, 1350000, '["Private Deck", "Bathtub Outdoor", "Kayak", "Smart TV", "WiFi"]', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600'),
('B3', 'Deluxe Suite B3', 'deluxe', 'villa-deluxe', 2, 2, 3, 1350000, '["Private Deck", "Bathtub Outdoor", "Kayak", "Smart TV", "WiFi"]', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600')
ON CONFLICT (room_number) DO NOTHING;

-- Family Kelong House - 2 rooms
INSERT INTO rooms (room_number, room_name, room_type, listing_id, capacity, floor_level, position_order, base_price, amenities, photo_url) VALUES
('C1', 'Family House C1', 'family', 'villa-family', 6, 3, 1, 2200000, '["2 Bedrooms", "Living Area", "Mini Kitchen", "Fishing Activities"]', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600'),
('C2', 'Family House C2', 'family', 'villa-family', 6, 3, 2, 2200000, '["2 Bedrooms", "Living Area", "Mini Kitchen", "Fishing Activities"]', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600')
ON CONFLICT (room_number) DO NOTHING;

-- ============================================
-- 6. CREATE FUNCTIONS FOR BOOKING LOGIC
-- ============================================

-- Function: Check room availability for date range
CREATE OR REPLACE FUNCTION check_room_availability(
  p_room_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  -- Check if any date in range is already booked
  SELECT COUNT(*)
  INTO v_conflict_count
  FROM room_bookings
  WHERE room_id = p_room_id
    AND booking_date >= p_check_in
    AND booking_date < p_check_out;
  
  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function: Create booking entries for date range
CREATE OR REPLACE FUNCTION create_booking_range(
  p_room_id UUID,
  p_transaction_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS VOID AS $$
DECLARE
  v_date DATE;
BEGIN
  -- Loop through each date in the range
  v_date := p_check_in;
  WHILE v_date < p_check_out LOOP
    INSERT INTO room_bookings (room_id, transaction_id, booking_date, status)
    VALUES (p_room_id, p_transaction_id, v_date, 'booked')
    ON CONFLICT (room_id, booking_date) DO NOTHING;
    
    v_date := v_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Release booking (when cancelled)
CREATE OR REPLACE FUNCTION release_booking(
  p_transaction_id UUID
)
RETURNS VOID AS $$
BEGIN
  DELETE FROM room_bookings
  WHERE transaction_id = p_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get available rooms for date range
CREATE OR REPLACE FUNCTION get_available_rooms(
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
  amenities JSONB
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
    r.amenities
  FROM rooms r
  WHERE r.status = 'available'
    AND (p_room_type IS NULL OR r.room_type = p_room_type)
    AND NOT EXISTS (
      SELECT 1
      FROM room_bookings rb
      WHERE rb.room_id = r.id
        AND rb.booking_date >= p_check_in
        AND rb.booking_date < p_check_out
    )
  ORDER BY r.floor_level, r.position_order;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. CREATE TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Trigger: Update room status when booking confirmed
CREATE OR REPLACE FUNCTION update_room_status_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- When booking status changes to 'confirmed' and payment is 'paid'
  IF NEW.booking_status = 'confirmed' AND NEW.status_pembayaran = 'paid' THEN
    -- Update room status to occupied
    UPDATE rooms
    SET status = 'occupied', updated_at = NOW()
    WHERE id = NEW.room_id;
    
    -- Create booking range entries
    PERFORM create_booking_range(NEW.room_id, NEW.id, NEW.check_in, NEW.check_out);
    
    -- Log the confirmation
    INSERT INTO booking_audit_log (transaction_id, action, old_status, new_status, changed_by, notes)
    VALUES (NEW.id, 'confirmed', OLD.booking_status, NEW.booking_status, NEW.confirmed_by, 'Booking confirmed and room locked');
  END IF;
  
  -- When booking is cancelled
  IF NEW.booking_status = 'cancelled' THEN
    -- Release the room bookings
    PERFORM release_booking(NEW.id);
    
    -- Check if room should be set back to available
    -- (Only if no other active bookings overlap)
    UPDATE rooms
    SET status = 'available', updated_at = NOW()
    WHERE id = NEW.room_id
      AND NOT EXISTS (
        SELECT 1 FROM room_bookings
        WHERE room_id = NEW.room_id
          AND booking_date >= CURRENT_DATE
      );
    
    -- Log the cancellation
    INSERT INTO booking_audit_log (transaction_id, action, old_status, new_status, changed_by, notes)
    VALUES (NEW.id, 'cancelled', OLD.booking_status, NEW.booking_status, 'system', 'Booking cancelled and room released');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_room_status
AFTER UPDATE ON transactions
FOR EACH ROW
WHEN (OLD.booking_status IS DISTINCT FROM NEW.booking_status OR OLD.status_pembayaran IS DISTINCT FROM NEW.status_pembayaran)
EXECUTE FUNCTION update_room_status_on_booking();

-- Trigger: Auto-update room updated_at timestamp
CREATE OR REPLACE FUNCTION update_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_room_timestamp
BEFORE UPDATE ON rooms
FOR EACH ROW
EXECUTE FUNCTION update_room_timestamp();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_audit_log ENABLE ROW LEVEL SECURITY;

-- Public can read available rooms
CREATE POLICY "Public can read available rooms" ON rooms
FOR SELECT USING (status = 'available');

-- Public can read room bookings (for availability check)
CREATE POLICY "Public can read room bookings" ON room_bookings
FOR SELECT USING (TRUE);

-- Authenticated users can read all rooms (admin)
CREATE POLICY "Authenticated can read all rooms" ON rooms
FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can update rooms (admin)
CREATE POLICY "Authenticated can update rooms" ON rooms
FOR UPDATE USING (auth.role() = 'authenticated');

-- Authenticated users can manage bookings (admin)
CREATE POLICY "Authenticated can manage bookings" ON room_bookings
FOR ALL USING (auth.role() = 'authenticated');

-- Authenticated users can read audit log (admin)
CREATE POLICY "Authenticated can read audit log" ON booking_audit_log
FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 9. CREATE VIEWS FOR DASHBOARD
-- ============================================

-- View: Room occupancy overview
CREATE OR REPLACE VIEW vw_room_occupancy AS
SELECT 
  r.id,
  r.room_number,
  r.room_name,
  r.room_type,
  r.status,
  r.capacity,
  r.base_price,
  COUNT(DISTINCT rb.booking_date) FILTER (WHERE rb.booking_date >= CURRENT_DATE) as future_bookings,
  MAX(t.nama_pemesan) FILTER (WHERE t.booking_status = 'confirmed' AND t.check_in <= CURRENT_DATE AND t.check_out > CURRENT_DATE) as current_guest,
  (
    SELECT t2.id::text 
    FROM transactions t2 
    WHERE t2.id = t.id 
      AND t2.booking_status = 'confirmed' 
      AND t2.check_in <= CURRENT_DATE 
      AND t2.check_out > CURRENT_DATE
    LIMIT 1
  ) as current_transaction_id
FROM rooms r
LEFT JOIN room_bookings rb ON r.id = rb.room_id
LEFT JOIN transactions t ON rb.transaction_id = t.id
GROUP BY r.id, r.room_number, r.room_name, r.room_type, r.status, r.capacity, r.base_price, t.id
ORDER BY r.floor_level, r.position_order;

-- View: Upcoming bookings
CREATE OR REPLACE VIEW vw_upcoming_bookings AS
SELECT 
  t.id,
  t.nama_pemesan,
  t.email,
  t.no_wa,
  t.booking_status,
  t.status_pembayaran,
  t.check_in,
  t.check_out,
  t.guest_count,
  t.total_bayar,
  t.created_at,
  r.room_number,
  r.room_name,
  r.room_type,
  (t.check_out - t.check_in) as nights
FROM transactions t
LEFT JOIN rooms r ON t.room_id = r.id
WHERE t.tipe_order = 'villa'
  AND t.check_out >= CURRENT_DATE
ORDER BY t.check_in ASC;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check rooms created
SELECT COUNT(*) as total_rooms, room_type, COUNT(*) as count_per_type
FROM rooms
GROUP BY room_type;

-- Check available rooms for next 7 days
SELECT * FROM get_available_rooms(
  CURRENT_DATE::date,
  (CURRENT_DATE + INTERVAL '7 days')::date,
  NULL::text
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Cinema-Style Inventory Management Schema Created Successfully!';
  RAISE NOTICE '📊 Total Rooms: 9 (4 Standard, 3 Deluxe, 2 Family)';
  RAISE NOTICE '🔧 Functions: check_room_availability, create_booking_range, get_available_rooms';
  RAISE NOTICE '🔐 RLS Policies: Enabled for rooms, room_bookings, booking_audit_log';
  RAISE NOTICE '📈 Views: vw_room_occupancy, vw_upcoming_bookings';
  RAISE NOTICE '⚡ Triggers: Auto-update room status on booking confirmation';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to implement Cinema-Style Dashboard!';
END $$;
