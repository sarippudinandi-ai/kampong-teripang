-- ============================================================
-- DIAGNOSE: SOFT-LOCK ADMIN GAGAL?
-- Jalankan di Supabase SQL Editor untuk menemukan akar masalah.
-- ============================================================

-- TES 1: Apakah fungsi acquire_room_lock ADA?
-- Jika 0 baris -> MODULE_03_SOFT_LOCK.sql BELUM dijalankan (ini penyebabnya).
SELECT proname AS function_name, pronargs AS arg_count
FROM pg_proc
WHERE proname IN ('acquire_room_lock', 'has_active_lock', 'release_room_lock', 'release_expired_locks');

-- TES 2: Apakah tabel room_locks ADA?
-- Jika 0 baris -> tabel belum dibuat.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'room_locks';

-- TES 3: Coba acquire_room_lock LANGSUNG untuk kamar A1 hari ini.
-- Jika mengembalikan UUID -> fungsi BEKERJA (masalah ada di frontend/runtime).
-- Jika NULL -> ada konflik booking/lock nyata di tanggal itu.
-- Jika ERROR -> fungsi/tabel belum ada.
SELECT acquire_room_lock(
  (SELECT id FROM rooms WHERE room_number = 'A1' LIMIT 1),
  CURRENT_DATE,
  (CURRENT_DATE + INTERVAL '1 day')::date,
  'admin',
  TRUE,
  10
) AS hasil_lock;

-- TES 4: Lihat lock yang barusan dibuat (jika TES 3 sukses)
SELECT rl.id, r.room_number, rl.locked_by, rl.is_admin, rl.check_in, rl.check_out, rl.expires_at
FROM room_locks rl
JOIN rooms r ON r.id = rl.room_id
ORDER BY rl.created_at DESC
LIMIT 5;

-- TES 5: Bersihkan lock tes (opsional, agar tidak mengganggu)
-- DELETE FROM room_locks WHERE locked_by = 'admin';
