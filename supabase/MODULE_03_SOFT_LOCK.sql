-- ============================================================
-- MODULE 03: REAL-TIME SOFT-LOCK (CLICK TO HOLD)
-- ============================================================
-- File: MODULE_03_SOFT_LOCK.sql
-- Purpose: Saat pelanggan/admin klik kamar kosong, kamar langsung
--          "ditahan" (kuning) selama 10 menit di semua perangkat,
--          mencegah double-booking sebelum form selesai.
-- Run AFTER MODULE_01_TTL_AUTOCANCEL.sql
-- Idempotent: aman dijalankan berulang kali.
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1: Tabel room_locks (penahan sementara)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.room_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  locked_by TEXT NOT NULL,              -- session id pelanggan, atau 'admin'
  is_admin BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_locks_room ON public.room_locks(room_id);
CREATE INDEX IF NOT EXISTS idx_room_locks_expires ON public.room_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_room_locks_dates ON public.room_locks(check_in, check_out);

-- RLS: publik boleh baca/tulis lock (lock bersifat sementara & non-sensitif)
ALTER TABLE public.room_locks ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.room_locks TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Anyone manage room_locks" ON public.room_locks;
CREATE POLICY "Anyone manage room_locks" ON public.room_locks
FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'room_locks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_locks;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Realtime publication skip: %', SQLERRM;
END $$;

-- ------------------------------------------------------------
-- STEP 2: Cek apakah ada lock aktif (belum kadaluarsa) yang
--         bentrok, milik orang lain.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION has_active_lock(
  p_room_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_exclude_locked_by TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM room_locks
  WHERE room_id = p_room_id
    AND expires_at > NOW()
    AND (check_in < p_check_out AND check_out > p_check_in)
    AND (p_exclude_locked_by IS NULL OR locked_by <> p_exclude_locked_by);

  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- STEP 3: Perbarui check_booking_conflict agar memperhitungkan
--         lock aktif (selain booking). TRUE = tersedia.
-- ------------------------------------------------------------
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
  SELECT COUNT(*)
  INTO v_conflict_count
  FROM bookings
  WHERE room_id = p_room_id
    AND booking_status IN ('CONFIRMED', 'PENDING_PAYMENT', 'CHECKED_IN')
    AND payment_status != 'REFUNDED'
    AND NOT (
      booking_status = 'PENDING_PAYMENT'
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
    )
    AND (check_in < p_check_out AND check_out > p_check_in)
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id);

  -- Bentrok jika ada booking ATAU ada lock aktif milik orang lain
  IF v_conflict_count > 0 THEN
    RETURN FALSE;
  END IF;

  IF has_active_lock(p_room_id, p_check_in, p_check_out, NULL) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- STEP 4: Buat / perpanjang lock (upsert berdasar locked_by+room+tanggal)
--         Mengembalikan id lock jika berhasil, NULL jika ditolak
--         (sudah dikunci orang lain atau sudah ada booking).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION acquire_room_lock(
  p_room_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_locked_by TEXT,
  p_is_admin BOOLEAN DEFAULT FALSE,
  p_ttl_minutes INTEGER DEFAULT 10
)
RETURNS UUID AS $$
DECLARE
  v_lock_id UUID;
  v_booking_conflict INTEGER;
BEGIN
  -- Tolak jika sudah ada booking aktif (bukan pending kadaluarsa)
  SELECT COUNT(*) INTO v_booking_conflict
  FROM bookings
  WHERE room_id = p_room_id
    AND booking_status IN ('CONFIRMED', 'PENDING_PAYMENT', 'CHECKED_IN')
    AND payment_status != 'REFUNDED'
    AND NOT (
      booking_status = 'PENDING_PAYMENT'
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
    )
    AND (check_in < p_check_out AND check_out > p_check_in);

  IF v_booking_conflict > 0 THEN
    RETURN NULL;
  END IF;

  -- Tolak jika ada lock aktif milik orang lain
  IF has_active_lock(p_room_id, p_check_in, p_check_out, p_locked_by) THEN
    RETURN NULL;
  END IF;

  -- Hapus lock lama milik requester ini untuk kamar+tanggal yang sama
  DELETE FROM room_locks
  WHERE room_id = p_room_id
    AND locked_by = p_locked_by
    AND (check_in < p_check_out AND check_out > p_check_in);

  -- Buat lock baru
  INSERT INTO room_locks (room_id, check_in, check_out, locked_by, is_admin, expires_at)
  VALUES (
    p_room_id, p_check_in, p_check_out, p_locked_by, p_is_admin,
    NOW() + (p_ttl_minutes || ' minutes')::INTERVAL
  )
  RETURNING id INTO v_lock_id;

  RETURN v_lock_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION acquire_room_lock(UUID, DATE, DATE, TEXT, BOOLEAN, INTEGER)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION has_active_lock(UUID, DATE, DATE, TEXT)
  TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- STEP 5: Lepas lock (saat batal pilih / form submit / keluar)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION release_room_lock(p_locked_by TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH del AS (
    DELETE FROM room_locks WHERE locked_by = p_locked_by RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM del;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION release_room_lock(TEXT) TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- STEP 6: Bersihkan lock kadaluarsa (dipanggil cron + auto-cancel)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION release_expired_locks()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH del AS (
    DELETE FROM room_locks WHERE expires_at < NOW() RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM del;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION release_expired_locks() TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- STEP 7: Verifikasi
-- ------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '  MODULE 03: SOFT-LOCK TERPASANG';
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '✅ Tabel room_locks dibuat (+ realtime)';
  RAISE NOTICE '✅ acquire_room_lock() / release_room_lock() siap';
  RAISE NOTICE '✅ check_booking_conflict kini hitung lock aktif';
  RAISE NOTICE '✅ release_expired_locks() untuk cron';
  RAISE NOTICE '   TTL lock default: 10 menit';
  RAISE NOTICE '════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
