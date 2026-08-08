-- ============================================================
-- MODULE 01: SOFT-LOCK TTL + AUTO-CANCEL (FAIL-SAFE)
-- ============================================================
-- File: MODULE_01_TTL_AUTOCANCEL.sql
-- Purpose: Mencegah kamar terkunci selamanya oleh booking PENDING
--          yang ditinggalkan. Menambah expiry 30 menit + auto-cancel.
-- Run AFTER bookings_flow_schema.sql in Supabase SQL Editor.
-- Idempotent: aman dijalankan berulang kali.
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1: Tambah kolom expires_at ke tabel bookings
-- ------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Index untuk query auto-cancel yang cepat
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at
  ON public.bookings(expires_at)
  WHERE booking_status = 'PENDING_PAYMENT';

COMMENT ON COLUMN public.bookings.expires_at IS
  'Waktu kadaluarsa soft-lock. Jika PENDING_PAYMENT melewati waktu ini, auto-cancel.';

-- ------------------------------------------------------------
-- STEP 2: Auto-set expires_at = NOW() + 30 menit saat INSERT
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_booking_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Hanya untuk booking baru yang masih menunggu pembayaran
  IF NEW.booking_status = 'PENDING_PAYMENT' AND NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '30 minutes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_booking_expiry ON public.bookings;
CREATE TRIGGER trg_set_booking_expiry
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION set_booking_expiry();

-- ------------------------------------------------------------
-- STEP 3: Saat status dikonfirmasi, hapus expiry (lock permanen sah)
--         Saat kembali ke pending (jarang), reset expiry.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_booking_expiry_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika sudah CONFIRMED / CHECKED_IN / CHECKED_OUT / CANCELLED -> tidak ada TTL
  IF NEW.booking_status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED') THEN
    NEW.expires_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_booking_expiry ON public.bookings;
CREATE TRIGGER trg_refresh_booking_expiry
BEFORE UPDATE ON public.bookings
FOR EACH ROW
WHEN (OLD.booking_status IS DISTINCT FROM NEW.booking_status)
EXECUTE FUNCTION refresh_booking_expiry_on_update();

-- ------------------------------------------------------------
-- STEP 4: PERBAIKAN INTI -> check_booking_conflict mengabaikan
--         booking PENDING yang sudah kadaluarsa (kamar jadi hijau lagi)
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
    -- ⬇️ KUNCI: pending yang sudah lewat expires_at TIDAK dihitung konflik
    AND NOT (
      booking_status = 'PENDING_PAYMENT'
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
    )
    AND (
      (check_in < p_check_out AND check_out > p_check_in)
    )
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id);

  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- STEP 5: Fungsi auto-cancel booking kadaluarsa
--         Mengembalikan jumlah booking yang dibatalkan.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION expire_stale_bookings()
RETURNS INTEGER AS $$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE bookings
    SET booking_status = 'CANCELLED',
        cancelled_at = NOW(),
        admin_notes = COALESCE(admin_notes, '') ||
          ' [AUTO-CANCELLED: pembayaran tidak dikonfirmasi dalam 30 menit @ ' ||
          NOW()::TEXT || ']'
    WHERE booking_status = 'PENDING_PAYMENT'
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_cancelled_count FROM expired;

  RETURN v_cancelled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION expire_stale_bookings() TO anon;
GRANT EXECUTE ON FUNCTION expire_stale_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION expire_stale_bookings() TO service_role;

-- ------------------------------------------------------------
-- STEP 6: (OPSIONAL) Jadwalkan auto-cancel via pg_cron tiap 5 menit.
--         Jika pg_cron tidak tersedia, blok ini akan gagal diam-diam
--         dan kita pakai pemicu dari API (modul berikutnya).
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Hapus job lama jika ada, lalu buat baru
    PERFORM cron.unschedule('expire-stale-bookings')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-stale-bookings');

    PERFORM cron.schedule(
      'expire-stale-bookings',
      '*/5 * * * *',                 -- setiap 5 menit
      $cron$ SELECT expire_stale_bookings(); $cron$
    );
    RAISE NOTICE '✅ pg_cron job "expire-stale-bookings" dijadwalkan tiap 5 menit';
  ELSE
    RAISE NOTICE '⚠️  pg_cron tidak aktif. Auto-cancel harus dipicu dari API (modul berikutnya).';
    RAISE NOTICE '   -> Aktifkan di Supabase: Database > Extensions > pg_cron, lalu jalankan ulang file ini.';
  END IF;
END $$;

-- ------------------------------------------------------------
-- STEP 7: Backfill - set expiry untuk pending lama yang belum punya
--         (anggap sudah kadaluarsa supaya kamar segera bebas)
-- ------------------------------------------------------------
UPDATE public.bookings
SET expires_at = created_at + INTERVAL '30 minutes'
WHERE booking_status = 'PENDING_PAYMENT'
  AND expires_at IS NULL;

-- ------------------------------------------------------------
-- STEP 8: Verifikasi & laporan
-- ------------------------------------------------------------
DO $$
DECLARE
  v_pending INTEGER;
  v_expired INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_pending
  FROM bookings WHERE booking_status = 'PENDING_PAYMENT';

  SELECT COUNT(*) INTO v_expired
  FROM bookings
  WHERE booking_status = 'PENDING_PAYMENT'
    AND expires_at < NOW();

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '  MODULE 01: TTL + AUTO-CANCEL TERPASANG';
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '✅ Kolom expires_at ditambahkan';
  RAISE NOTICE '✅ Trigger auto-set 30 menit aktif';
  RAISE NOTICE '✅ check_booking_conflict kini abaikan pending kadaluarsa';
  RAISE NOTICE '✅ Fungsi expire_stale_bookings() siap dipanggil';
  RAISE NOTICE '   Pending saat ini: %, sudah kadaluarsa: %', v_pending, v_expired;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Jalankan manual untuk tes: SELECT expire_stale_bookings();';
  RAISE NOTICE '════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
