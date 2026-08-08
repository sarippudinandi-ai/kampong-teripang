-- ============================================================
-- DIAGNOSE: Apakah lock B2 benar-benar memblok B1? (cross-room)
-- Jalankan di Supabase SQL Editor. Tidak mengubah data.
-- ============================================================

-- LANGKAH 1: Lihat ISI room_locks aktif saat ini (room mana yang terkunci).
-- Pastikan room_number sesuai yang Anda lock (mis. hanya B2).
SELECT rl.id, r.room_number, rl.locked_by, rl.is_admin,
       rl.check_in, rl.check_out, rl.expires_at,
       (rl.expires_at > NOW()) AS masih_aktif
FROM room_locks rl
JOIN rooms r ON r.id = rl.room_id
ORDER BY rl.created_at DESC;

-- LANGKAH 2: Cek ketersediaan SETIAP kamar untuk hari ini.
-- Kolom is_available HARUS: B2=false (terkunci), B1=true (bebas).
-- Jika B1 ikut false padahal tidak ada lock/booking di B1 -> baru ada bug.
SELECT r.room_number,
       check_booking_conflict(
         r.id,
         CURRENT_DATE,
         (CURRENT_DATE + INTERVAL '1 day')::date
       ) AS is_available
FROM rooms r
ORDER BY r.room_number;

-- LANGKAH 3: Cek versi fungsi check_booking_conflict yang AKTIF di DB.
-- Cari apakah definisinya memuat 'has_active_lock' (artinya versi MODULE_03)
-- dan memuat 'room_id = p_room_id'.
SELECT pg_get_functiondef(oid) AS definisi_aktif
FROM pg_proc
WHERE proname = 'check_booking_conflict';

-- LANGKAH 4: Booking nyata yang masih menahan kamar (selain lock).
SELECT b.booking_id, r.room_number, b.booking_status, b.payment_status,
       b.check_in, b.check_out, b.expires_at
FROM bookings b
JOIN rooms r ON r.id = b.room_id
WHERE b.booking_status IN ('CONFIRMED','PENDING_PAYMENT','CHECKED_IN')
ORDER BY b.created_at DESC;
