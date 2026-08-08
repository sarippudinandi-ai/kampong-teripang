import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * ROOM SOFT-LOCK API
 * ---------------------------------------------------------------
 * POST   -> menahan kamar sementara (10 menit) saat pelanggan/admin
 *           klik kamar kosong. Mencegah double-booking.
 * DELETE -> melepas lock (saat batal pilih / form submit / keluar).
 * ---------------------------------------------------------------
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const lockSchema = z.object({
  room_id: z.string().uuid("Invalid room ID"),
  check_in: z.string(),
  check_out: z.string(),
  locked_by: z.string().min(4, "identifier tidak valid").max(128),
  is_admin: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = lockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { room_id, check_in, check_out, locked_by, is_admin } = parsed.data;

    // Bersihkan lock kadaluarsa dulu (fail-safe)
    await supabaseAdmin.rpc("release_expired_locks");

    const { data: lockId, error } = await supabaseAdmin.rpc("acquire_room_lock", {
      p_room_id: room_id,
      p_check_in: check_in,
      p_check_out: check_out,
      p_locked_by: locked_by,
      p_is_admin: is_admin ?? false,
      p_ttl_minutes: 10,
    });

    if (error) {
      console.error("[Room Lock API] acquire error:", error);
      return NextResponse.json(
        {
          error: "Gagal menahan kamar",
          details: error.message,
          hint: "Pastikan MODULE_03_SOFT_LOCK.sql sudah dijalankan.",
        },
        { status: 500 }
      );
    }

    // lockId null = ditolak. Cari tahu ALASAN PERSIS dari database (bukan tebakan).
    if (!lockId) {
      // Cek booking aktif yang bentrok di tanggal ini
      const { data: conflictBookings } = await supabaseAdmin
        .from("bookings")
        .select("booking_id, booking_status, payment_status, check_in, check_out, expires_at")
        .eq("room_id", room_id)
        .in("booking_status", ["CONFIRMED", "PENDING_PAYMENT", "CHECKED_IN"])
        .lt("check_in", check_out)
        .gt("check_out", check_in);

      // Cek lock aktif milik orang lain
      const { data: conflictLocks } = await supabaseAdmin
        .from("room_locks")
        .select("locked_by, is_admin, expires_at")
        .eq("room_id", room_id)
        .gt("expires_at", new Date().toISOString())
        .lt("check_in", check_out)
        .gt("check_out", check_in)
        .neq("locked_by", locked_by);

      const activeBooking = (conflictBookings || []).find((b) => {
        // abaikan pending yang sudah kadaluarsa
        if (
          b.booking_status === "PENDING_PAYMENT" &&
          b.expires_at &&
          new Date(b.expires_at) < new Date()
        ) {
          return false;
        }
        return true;
      });

      let reason = "Kamar tidak bisa ditahan.";
      if (activeBooking) {
        reason = `Kamar sudah ada booking ${activeBooking.booking_id} (${activeBooking.booking_status}) pada tanggal tersebut.`;
      } else if (conflictLocks && conflictLocks.length > 0) {
        reason =
          "Kamar sedang ditahan sesi lain (akan otomatis lepas saat kadaluarsa).";
      }

      return NextResponse.json(
        {
          success: false,
          locked: false,
          message: reason,
          debug: {
            conflicting_bookings: conflictBookings || [],
            conflicting_locks: conflictLocks || [],
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      locked: true,
      lock_id: lockId,
      expires_in_minutes: 10,
    });
  } catch (error) {
    console.error("[Room Lock API] POST error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server", message: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const lockedBy = body?.locked_by;

    if (!lockedBy || typeof lockedBy !== "string") {
      return NextResponse.json(
        { error: "locked_by diperlukan" },
        { status: 400 }
      );
    }

    const { data: count, error } = await supabaseAdmin.rpc("release_room_lock", {
      p_locked_by: lockedBy,
    });

    if (error) {
      console.error("[Room Lock API] release error:", error);
      return NextResponse.json(
        { error: "Gagal melepas lock", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, released: count ?? 0 });
  } catch (error) {
    console.error("[Room Lock API] DELETE error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server", message: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
