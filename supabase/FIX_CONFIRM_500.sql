-- ============================================================
-- FIX 500 ON CONFIRM  (run once in Supabase SQL Editor)
-- Root cause: trigger sync_booking_to_room_bookings() inserted
-- bookings.id into room_bookings.transaction_id which has an FK
-- to transactions(id) -> foreign key violation -> UPDATE failed -> 500.
--
-- The new booking flow computes availability from the `bookings`
-- table directly (check_booking_conflict), so room_bookings is not
-- needed here. We rewrite the trigger to only flip rooms.status
-- and set timestamps. No more FK violation.
-- ============================================================

CREATE OR REPLACE FUNCTION sync_booking_to_room_bookings()
RETURNS TRIGGER AS $$
BEGIN
  -- Confirmed & paid -> mark room occupied
  IF NEW.booking_status = 'CONFIRMED' AND NEW.payment_status = 'PAID' THEN
    UPDATE rooms
    SET status = 'occupied', updated_at = NOW()
    WHERE id = NEW.room_id;

    IF NEW.confirmed_at IS NULL THEN
      NEW.confirmed_at := NOW();
    END IF;
  END IF;

  -- Cancelled -> free the room (only if no other active confirmed booking overlaps today onward)
  IF NEW.booking_status = 'CANCELLED' THEN
    UPDATE rooms
    SET status = 'available', updated_at = NOW()
    WHERE id = NEW.room_id
      AND NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.room_id = NEW.room_id
          AND b.id <> NEW.id
          AND b.booking_status IN ('CONFIRMED', 'CHECKED_IN')
          AND b.check_out >= CURRENT_DATE
      );

    IF NEW.cancelled_at IS NULL THEN
      NEW.cancelled_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reload PostgREST cache
NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger fixed: confirm no longer touches room_bookings (no FK violation)';
  RAISE NOTICE '   Confirm booking should now succeed (no more 500).';
END $$;
