import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Initialize Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Middleware: Check admin authentication
 */
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");

  if (!adminSession) {
    return false;
  }

  return true;
}

/**
 * GET /api/admin/bookings/[id]
 * Get single booking details (Admin only)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const bookingId = params.id;

    // Get booking from view (includes room details)
    const { data: booking, error } = await supabaseAdmin
      .from("vw_bookings_dashboard")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: "Booking tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: booking,
    });
  } catch (error) {
    console.error("[Admin Bookings API] GET error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/bookings/[id]
 * Update booking status (Admin only)
 * 
 * Request body:
 * {
 *   "booking_status"?: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "CHECKED_IN" | "CHECKED_OUT",
 *   "payment_status"?: "UNPAID" | "PAID" | "REFUNDED",
 *   "admin_notes"?: string
 * }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const bookingId = params.id;
    const body = await req.json();

    const { booking_status, payment_status, admin_notes } = body;

    // Validate status values
    const validBookingStatuses = [
      "PENDING_PAYMENT",
      "CONFIRMED",
      "CANCELLED",
      "CHECKED_IN",
      "CHECKED_OUT",
    ];
    const validPaymentStatuses = ["UNPAID", "PAID", "REFUNDED"];

    if (booking_status && !validBookingStatuses.includes(booking_status)) {
      return NextResponse.json(
        {
          error: "Invalid booking_status",
          valid_values: validBookingStatuses,
        },
        { status: 400 }
      );
    }

    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      return NextResponse.json(
        {
          error: "Invalid payment_status",
          valid_values: validPaymentStatuses,
        },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {};

    if (booking_status) {
      updateData.booking_status = booking_status;
    }

    if (payment_status) {
      updateData.payment_status = payment_status;
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    // Additional logic: auto-set confirmed_at when confirming
    if (booking_status === "CONFIRMED" && payment_status === "PAID") {
      updateData.confirmed_at = new Date().toISOString();
    }

    // Additional logic: auto-set cancelled_at when cancelling
    if (booking_status === "CANCELLED") {
      updateData.cancelled_at = new Date().toISOString();
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) {
      console.error("[Admin Bookings API] Update error:", updateError);
      return NextResponse.json(
        {
          error: "Gagal mengupdate booking",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Get updated booking with room details
    const { data: booking } = await supabaseAdmin
      .from("vw_bookings_dashboard")
      .select("*")
      .eq("id", bookingId)
      .single();

    return NextResponse.json({
      success: true,
      message: "Booking berhasil diupdate",
      booking: booking || updatedBooking,
    });
  } catch (error) {
    console.error("[Admin Bookings API] PATCH error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/bookings/[id]
 * Delete booking (Admin only - soft delete via CANCELLED status)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const bookingId = params.id;

    // Soft delete by setting status to CANCELLED
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        booking_status: "CANCELLED",
        cancelled_at: new Date().toISOString(),
        admin_notes: "Deleted by admin",
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("[Admin Bookings API] Delete error:", updateError);
      return NextResponse.json(
        {
          error: "Gagal menghapus booking",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking berhasil dibatalkan",
    });
  } catch (error) {
    console.error("[Admin Bookings API] DELETE error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
