-- ============================================================
-- MODULE 05: CHECK-IN / CHECK-OUT TIMESTAMPS
-- ============================================================
-- File: MODULE_05_CHECKIN_CHECKOUT.sql
-- Purpose: Tambah kolom waktu check-in & check-out aktual.
--          Status CHECKED_IN / CHECKED_OUT sudah ada di CHECK constraint
--          tabel bookings (lihat bookings_flow_schema.sql), jadi tidak
--          perlu ubah enum.
-- Run di Supabase SQL Editor. Idempotent.
-- ============================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMPTZ;

COMMENT ON COLUMN public.bookings.check_in_time IS
  'Waktu aktual tamu check-in (diisi admin saat klik tombol Check-in).';
COMMENT ON COLUMN public.bookings.check_out_time IS
  'Waktu aktual tamu check-out (diisi admin saat klik tombol Check-out).';

DO $$
BEGIN
  RAISE NOTICE '✅ Kolom check_in_time & check_out_time ditambahkan ke bookings';
END $$;

NOTIFY pgrst, 'reload schema';
