import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod";

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

// Validation schema for update
const updateBookingSchema = z.object({
  booking_status: z.enum([
    "PENDING_PAYMENT",
    "CONFIRMED",
    "CHECKED_IN",
    "CHECKED_OUT",
    "CANCELLED",
  ]).optional(),
  payment_status: z.enum(["UNPAID", "PAID", "REFUNDED"]).optional(),
  admin_notes: z.string().max(1000).optional(),
});

/**
 * GET /api/admin/bookings/[id]
 * Get single booking details (Admin only)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Get booking from view
    const { data: booking, error } = await supabaseAdmin
      .from("vw_bookings_dashboard")
      .select("*")
      .eq("id", id)
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
 * This handles payment confirmation, status changes, and admin notes
 * SECURITY: Uses service_role to bypass RLS
 * IDEMPOTENCY: Safe to call multiple times (for double-click protection)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await req.json();

    // Validate request body
    const validationResult = updateBookingSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: "Validasi gagal",
          details: errors,
        },
        { status: 400 }
      );
    }

    const { booking_status, payment_status, admin_notes } = validationResult.data;

    // IDEMPOTENCY CHECK: If already in desired state, return success immediately
    // This prevents double-click issues
    const { data: currentBooking } = await supabaseAdmin
      .from("bookings")
      .select("booking_status, payment_status")
      .eq("id", id)
      .single();

    if (currentBooking) {
      const alreadyInDesiredState = 
        (!booking_status || currentBooking.booking_status === booking_status) &&
        (!payment_status || currentBooking.payment_status === payment_status);

      if (alreadyInDesiredState) {
        console.log(`[Admin Bookings API] Booking ${id} already in desired state, skipping update`);
        return NextResponse.json({
          success: true,
          message: "Booking sudah dalam status yang diminta",
          booking: currentBooking,
          idempotent: true,
        });
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (booking_status) {
      updateData.booking_status = booking_status;
      // Catat waktu aktual check-in / check-out
      if (booking_status === "CHECKED_IN") {
        updateData.check_in_time = new Date().toISOString();
      } else if (booking_status === "CHECKED_OUT") {
        updateData.check_out_time = new Date().toISOString();
      }
    }

    if (payment_status) {
      updateData.payment_status = payment_status;
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    // Update booking using service_role (bypasses RLS)
    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from("bookings")
      .update(updateData)
      .eq("id", id)
      .select();

    if (updateError) {
      console.error("[Admin Bookings API] Update error:", updateError);
      return NextResponse.json(
        {
          error: `Gagal mengupdate booking: ${updateError.message}`,
          code: updateError.code,
          details: updateError.details || updateError.hint || updateError.message,
        },
        { status: 500 }
      );
    }

    if (!updatedRows || updatedRows.length === 0) {
      // 0 rows = booking not found
      return NextResponse.json(
        {
          error: "Booking tidak ditemukan atau sudah dihapus",
        },
        { status: 404 }
      );
    }

    const updatedBooking = updatedRows[0];

    // Log to audit trail (best effort - don't fail if audit logging fails)
    try {
      const auditData: any = {
        action: "STATUS_UPDATE",
        new_status: booking_status || currentBooking?.booking_status || null,
        changed_by: "admin",
        notes: admin_notes || null,
        metadata: {
          booking_id: id,
          booking_status: booking_status,
          payment_status: payment_status,
          updated_at: new Date().toISOString(),
        },
      };

      if (currentBooking) {
        auditData.old_status = currentBooking.booking_status;
      }

      const { error: auditError } = await supabaseAdmin
        .from("booking_audit_log")
        .insert(auditData);

      if (auditError) {
        console.warn("[Admin Bookings API] Audit log warning:", auditError.message);
        // Don't fail the request - audit is non-critical
      }
    } catch (auditError) {
      console.warn("[Admin Bookings API] Audit log exception:", auditError);
      // Continue - audit logging is best-effort
    }

    return NextResponse.json({
      success: true,
      message: "Booking berhasil diupdate",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("[Admin Bookings API] PATCH error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/bookings/[id]
 * Cancel/delete booking (Admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Instead of deleting, update status to CANCELLED
    const { data: cancelledRows, error: cancelError } = await supabaseAdmin
      .from("bookings")
      .update({
        booking_status: "CANCELLED",
        payment_status: "REFUNDED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (cancelError) {
      console.error("[Admin Bookings API] Cancel error:", cancelError);
      return NextResponse.json(
        {
          error: `Gagal membatalkan booking: ${cancelError.message}`,
          details: cancelError.details || cancelError.hint || cancelError.message,
        },
        { status: 500 }
      );
    }

    if (!cancelledRows || cancelledRows.length === 0) {
      return NextResponse.json(
        {
          error:
            "Pembatalan tidak mengubah data (0 baris). Kemungkinan RLS memblokir UPDATE.",
          details:
            "Jalankan supabase/FIX_CONFIRM_RLS.sql di Supabase, atau set SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 403 }
      );
    }

    const cancelledBooking = cancelledRows[0];

    // Log to audit trail (schema: action, old_status, new_status, changed_by, notes, metadata)
    try {
      await supabaseAdmin.from("booking_audit_log").insert({
        action: "CANCELLED",
        new_status: "CANCELLED",
        changed_by: "admin",
        notes: "Admin cancellation",
        metadata: {
          booking_id: id,
          reason: "Admin cancellation",
          cancelled_at: new Date().toISOString(),
        },
      });
    } catch (auditError) {
      console.error("[Admin Bookings API] Audit log error:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Booking berhasil dibatalkan",
      booking: cancelledBooking,
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
