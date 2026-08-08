import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Initialize Supabase client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ──────────────────────────────────────────────────────────────
// GET: Fetch upcoming bookings
// ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const sessionCookie = cookies().get("admin_session");
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized - Please login as admin" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status"); // Filter by booking_status
    const paymentStatus = searchParams.get("payment_status");

    // Build query
    let query = supabaseAdmin
      .from("transactions")
      .select(`
        id,
        nama_pemesan,
        email,
        no_wa,
        booking_status,
        status_pembayaran,
        check_in,
        check_out,
        guest_count,
        total_bayar,
        created_at,
        admin_notes,
        rooms (
          room_number,
          room_name,
          room_type
        )
      `)
      .eq("tipe_order", "villa")
      .gte("check_out", new Date().toISOString().split("T")[0]) // Only future/current bookings
      .order("check_in", { ascending: true })
      .limit(limit);

    // Apply filters
    if (status) {
      query = query.eq("booking_status", status);
    }

    if (paymentStatus) {
      query = query.eq("status_pembayaran", paymentStatus);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error("[Upcoming Bookings API] Error fetching bookings:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings", details: error.message },
        { status: 500 }
      );
    }

    // Format response
    const formattedBookings = (bookings || []).map((booking) => {
      const room = (booking.rooms as any) || null;
      const r = Array.isArray(room) ? room[0] : room;
      return {
        id: booking.id,
        nama_pemesan: booking.nama_pemesan,
        email: booking.email,
        no_wa: booking.no_wa,
        booking_status: booking.booking_status,
        status_pembayaran: booking.status_pembayaran,
        check_in: booking.check_in,
        check_out: booking.check_out,
        guest_count: booking.guest_count,
        total_bayar: booking.total_bayar,
        created_at: booking.created_at,
        admin_notes: booking.admin_notes,
        room_number: r?.room_number || null,
        room_name: r?.room_name || null,
        room_type: r?.room_type || null,
      };
    });

    // Calculate statistics
    const today = new Date().toISOString().split("T")[0];
    const stats = {
      total: formattedBookings.length,
      today: formattedBookings.filter((b) => b.check_in === today).length,
      confirmed: formattedBookings.filter((b) => b.booking_status === "confirmed").length,
      pending: formattedBookings.filter((b) => b.booking_status === "pending").length,
      inquiry: formattedBookings.filter((b) => b.booking_status === "inquiry").length,
    };

    return NextResponse.json({
      success: true,
      bookings: formattedBookings,
      stats,
      count: formattedBookings.length,
    });
  } catch (error) {
    console.error("[Upcoming Bookings API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
