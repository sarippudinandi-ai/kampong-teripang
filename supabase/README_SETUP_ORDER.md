# 📦 SUPABASE DATABASE SETUP - URUTAN EKSEKUSI

## ⚠️ PENTING: Urutan Matters!

File-file SQL di folder ini harus dijalankan dalam urutan tertentu agar database setup benar.

---

## 🎯 QUICK FIX (Jika Database Sudah Ada & Ada Error)

**Situasi**: Database sudah jalan, tapi ada error saat admin konfirmasi booking

### Langkah Cepat:
```
Jalankan: FIX_AUDIT_LOG_AND_RLS.sql
```

File ini akan:
- ✅ Membuat tabel `booking_audit_log` (jika belum ada)
- ✅ Memperbaiki semua RLS policies
- ✅ Verifikasi integritas database

**Selesai!** Tidak perlu run script lain jika sudah ada error.

---

## 🏗️ FRESH INSTALL (Setup Database Dari Nol)

**Situasi**: Database baru / kosong, belum ada tabel apapun

### Urutan Eksekusi:

#### 1️⃣ **Cinema Inventory (Rooms)**
```sql
-- File: cinema_inventory_schema.sql
-- Purpose: Membuat tabel rooms + data 9 kamar Sea Healing
```
**Run ini PERTAMA** karena tabel `rooms` adalah dependency untuk booking flow.

#### 2️⃣ **Bookings Flow (Core)**
```sql
-- File: bookings_flow_schema.sql
-- Purpose: Membuat tabel bookings, booking_audit_log, functions, triggers
```
**Run ini KEDUA** setelah rooms ada.

#### 3️⃣ **Site Config (Optional)**
```sql
-- File: site_config.sql
-- Purpose: Konfigurasi global (WhatsApp number, brand info, dll)
```
Optional, tapi disarankan untuk CMS admin.

#### 4️⃣ **Enable Realtime**
```sql
-- File: ENABLE_REALTIME.sql
-- Purpose: Aktifkan real-time subscription untuk admin dashboard
```
Wajib untuk fitur live update admin panel.

---

## 🔧 TROUBLESHOOTING SCRIPTS

### Jika Ada Error RLS
```
Run: FIX_CONFIRM_RLS.sql
```
Memperbaiki Row Level Security policies untuk bookings & rooms.

### Jika Konfirmasi Masih Error 500
```
Run: FIX_AUDIT_LOG_AND_RLS.sql
```
**INI YANG PALING PENTING** - Membuat audit log table + fix semua RLS issues.

### Jika Perlu Reset Bookings
```
Run: CLEANUP_bookings.sql
```
⚠️ DANGER: Menghapus semua data booking (untuk testing)

### Jika Ada Konflik Parameter
```
Run: FIX_CONFIRM_500.sql
```
Memperbaiki stored functions yang bermasalah.

### Force Reload Schema
```
Run: FORCE_SCHEMA_RELOAD.sql
```
Reload PostgREST cache jika perubahan tidak apply.

---

## 📋 CHECKLIST VERIFIKASI

Setelah setup selesai, cek ini di Supabase Dashboard:

### ✅ Tables Harus Ada:
- [ ] `rooms` (9 rows: A1-A4, B1-B3, C1-C2)
- [ ] `bookings` (mungkin kosong dulu)
- [ ] `booking_audit_log` (kosong dulu)
- [ ] `site_config` (optional)

### ✅ RLS Policies Harus Ada:
- [ ] bookings: "Allow insert bookings"
- [ ] bookings: "Allow select bookings"
- [ ] bookings: "Allow update bookings"
- [ ] bookings: "Allow delete bookings"
- [ ] booking_audit_log: "Allow insert audit log"
- [ ] booking_audit_log: "Allow select audit log"
- [ ] rooms: "Allow select rooms"
- [ ] rooms: "Allow update rooms"

### ✅ Functions Harus Ada:
- [ ] `get_available_rooms_v2(p_check_in, p_check_out, p_room_type)`
- [ ] `fn_sync_booking_to_rooms()` (trigger function)

### ✅ Triggers Harus Ada:
- [ ] `trg_sync_booking_to_rooms` on bookings table

### ✅ Realtime Harus Enabled:
- [ ] bookings: INSERT, UPDATE, DELETE
- [ ] rooms: UPDATE

---

## 🧪 CARA TESTING

### Test 1: Rooms Data
```sql
SELECT id, name, room_type, status 
FROM rooms 
ORDER BY name;
```
**Expected**: 9 rows (A1-A4, B1-B3, C1-C2)

### Test 2: Availability Function
```sql
SELECT * FROM get_available_rooms_v2(
  '2026-06-20'::date,
  '2026-06-22'::date,
  'Sea Healing A'
);
```
**Expected**: 4 rows (A1, A2, A3, A4) jika belum ada booking

### Test 3: Audit Log Table
```sql
SELECT * FROM booking_audit_log ORDER BY created_at DESC LIMIT 5;
```
**Expected**: Table exists (mungkin kosong jika belum ada activity)

### Test 4: RLS Policies
```sql
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('bookings', 'rooms', 'booking_audit_log')
ORDER BY tablename, policyname;
```
**Expected**: Minimal 8 policies (lihat checklist di atas)

---

## 🚨 COMMON ERRORS & SOLUTIONS

### Error: "relation 'booking_audit_log' does not exist"
**Solution**: Run `FIX_AUDIT_LOG_AND_RLS.sql`

### Error: "new row violates row-level security policy"
**Solution**: Run `FIX_CONFIRM_RLS.sql` lalu `FIX_AUDIT_LOG_AND_RLS.sql`

### Error: "function get_available_rooms_v2 does not exist"
**Solution**: Run `bookings_flow_schema.sql` (atau file backup yang _SAFE.sql)

### Error: "parameter name 'room_type' used more than once"
**Solution**: Run `FIX_CONFIRM_500.sql` - function signature punya duplicate parameter

### Error: "trigger 'trg_sync_booking_to_rooms' does not exist"
**Solution**: Run `bookings_flow_schema.sql` untuk create trigger

### Admin Konfirmasi Tidak Berfungsi (HTTP 500)
**Solution**: 
1. Run `FIX_AUDIT_LOG_AND_RLS.sql` (PALING PENTING)
2. Cek `.env.local` - pastikan `SUPABASE_SERVICE_ROLE_KEY` ada
3. Restart Next.js server: `npm run dev`

---

## 📁 FILE DESCRIPTIONS

| File | Purpose | Safe to Run Multiple Times? |
|------|---------|----------------------------|
| `cinema_inventory_schema.sql` | Setup rooms table + data | ⚠️ NO (has INSERT without IF NOT EXISTS) |
| `bookings_flow_schema.sql` | Setup bookings + functions + triggers | ⚠️ NO (might conflict) |
| `bookings_flow_schema_SAFE.sql` | Backup/safe version | ✅ YES |
| `FIX_AUDIT_LOG_AND_RLS.sql` | **RECOMMENDED FIX** | ✅ YES (idempotent) |
| `FIX_CONFIRM_RLS.sql` | RLS fix only | ✅ YES |
| `FIX_CONFIRM_500.sql` | Function fix | ✅ YES |
| `CLEANUP_bookings.sql` | Delete all bookings | ⚠️ DANGER (data loss) |
| `ENABLE_REALTIME.sql` | Enable subscriptions | ✅ YES |
| `FORCE_SCHEMA_RELOAD.sql` | Reload cache | ✅ YES |
| `site_config.sql` | Site settings | ✅ YES |

---

## 🎯 RECOMMENDED ACTION NOW

Berdasarkan error yang Anda alami:

```bash
# Error: relation "booking_audit_log" does not exist
```

**ACTION**: 
1. Buka Supabase SQL Editor
2. Run file: `FIX_AUDIT_LOG_AND_RLS.sql`
3. Tunggu hingga selesai (±5 detik)
4. Lihat output - pastikan ada pesan "✅ booking_audit_log table: CREATED"
5. Test admin confirmation lagi

**Tidak perlu run script lain** jika hanya error audit log.

---

**Last Updated**: 2026-06-14  
**Maintainer**: Kiro AI Assistant  
**Project**: Kampong Teripang Sea Healing Booking System
