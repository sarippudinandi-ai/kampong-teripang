import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * AUTO-CANCEL CRON ENDPOINT
 * ---------------------------------------------------------------
 * Memicu fungsi database `expire_stale_bookings()` yang membatalkan
 * booking PENDING_PAYMENT yang sudah melewati `expires_at` (TTL 30 menit).
 *
 * Cara pakai:
 *  1. Vercel Cron  -> set di vercel.json (lihat catatan di bawah)
 *  2. Lazy sweep   -> dipanggil fire-and-forget dari frontend saat cek ketersediaan
 *  3. Manual       -> GET /api/cron/expire-bookings
 *
 * Keamanan opsional: set CRON_SECRET di .env.local, lalu kirim header
 *   Authorization: Bearer <CRON_SECRET>
 * Jika CRON_SECRET tidak di-set, endpoint terbuka (cukup untuk dev/lazy sweep).
 * ---------------------------------------------------------------
 */

// Service role agar bypass RLS untuk operasi sistem
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function runExpiry(req: NextRequest) {
  // Optional secret check (untuk Vercel Cron / pemanggilan eksternal)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    const provided = authHeader?.replace(/^Bearer\s+/i, "");
    // Izinkan jika secret cocok ATAU request internal lazy-sweep (header khusus)
    const isInternal = req.headers.get("x-internal-sweep") === "1";
    if (!isInternal && provided !== cronSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  const { data, error } = await supabaseAdmin.rpc("expire_stale_bookings");

  if (error) {
    console.error("[Cron expire-bookings] RPC error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        hint: "Pastikan MODULE_01_TTL_AUTOCANCEL.sql sudah dijalankan di Supabase.",
      },
      { status: 500 }
    );
  }

  const cancelledCount = typeof data === "number" ? data : 0;

  // Bersihkan juga lock kadaluarsa (Module 03). Best-effort.
  let releasedLocks = 0;
  try {
    const { data: lockData } = await supabaseAdmin.rpc("release_expired_locks");
    releasedLocks = typeof lockData === "number" ? lockData : 0;
  } catch {
    // abaikan jika MODULE_03 belum dijalankan
  }

  if (cancelledCount > 0 || releasedLocks > 0) {
    console.log(
      `[Cron expire-bookings] Auto-cancel: ${cancelledCount} booking, ${releasedLocks} lock dibersihkan`
    );
  }

  return NextResponse.json({
    success: true,
    cancelled: cancelledCount,
    released_locks: releasedLocks,
    timestamp: new Date().toISOString(),
  });
}

// GET — untuk Vercel Cron & pemanggilan manual di browser
export async function GET(req: NextRequest) {
  return runExpiry(req);
}

// POST — untuk lazy sweep fire-and-forget dari frontend
export async function POST(req: NextRequest) {
  return runExpiry(req);
}
