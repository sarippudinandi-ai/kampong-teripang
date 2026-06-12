import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Initialize Supabase client with service role (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ──────────────────────────────────────────────────────────────
// GET: Fetch single transaction by ID
// ──────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const sessionCookie = cookies().get("admin_session");
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized - Please login as admin" },
        { status: 401 }
      );
    }

    const transactionId = params.id;

    // Fetch transaction with room details
    const { data: transaction, error } = await supabaseAdmin
      .from("transactions")
      .select(`
        *,
        rooms (
          id,
          room_number,
          room_name,
          room_type,
          capacity,
          base_price
        )
      `)
      .eq("id", transactionId)
      .single();

    if (error) {
      console.error("[Admin Transaction API] Error fetching transaction:", error);
      return NextResponse.json(
        { error: "Transaction not found", details: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("[Admin Transaction API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ──────────────────────────────────────────────────────────────
// PATCH: Update transaction status
// ──────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const sessionCookie = cookies().get("admin_session");
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized - Please login as admin" },
        { status: 401 }
      );
    }

    const transactionId = params.id;
    const body = await req.json();
    const { booking_status, status_pembayaran, admin_notes, confirmed_by } = body;

    // Validate at least one field is provided
    if (!booking_status && !status_pembayaran && !admin_notes) {
      return NextResponse.json(
        { error: "At least one field must be provided for update" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: {
      booking_status?: string;
      status_pembayaran?: string;
      admin_notes?: string;
      confirmed_by?: string;
      confirmed_at?: string;
    } = {};

    if (booking_status) {
      const validBookingStatuses = [
        "inquiry",
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
      ];
      if (!validBookingStatuses.includes(booking_status)) {
        return NextResponse.json(
          {
            error: `Invalid booking_status. Must be one of: ${validBookingStatuses.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.booking_status = booking_status;

      // Set confirmed timestamp when confirming
      if (booking_status === "confirmed") {
        updateData.confirmed_at = new Date().toISOString();
        updateData.confirmed_by = confirmed_by || "admin";
      }
    }

    if (status_pembayaran) {
      const validPaymentStatuses = ["pending", "paid", "failed", "refunded"];
      if (!validPaymentStatuses.includes(status_pembayaran)) {
        return NextResponse.json(
          {
            error: `Invalid status_pembayaran. Must be one of: ${validPaymentStatuses.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.status_pembayaran = status_pembayaran;
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    // Get current transaction to log changes
    const { data: oldTransaction } = await supabaseAdmin
      .from("transactions")
      .select("booking_status, status_pembayaran, room_id, check_in, check_out")
      .eq("id", transactionId)
      .single();

    // Update transaction
    const { data: updatedTransaction, error: updateError } = await supabaseAdmin
      .from("transactions")
      .update(updateData)
      .eq("id", transactionId)
      .select()
      .single();

    if (updateError) {
      console.error("[Admin Transaction API] Error updating transaction:", updateError);
      return NextResponse.json(
        { error: "Failed to update transaction", details: updateError.message },
        { status: 500 }
      );
    }

    // Log to audit trail
    if (oldTransaction) {
      await supabaseAdmin.from("booking_audit_log").insert({
        transaction_id: transactionId,
        action: "status_changed",
        old_status: oldTransaction.booking_status,
        new_status: updateData.booking_status || oldTransaction.booking_status,
        changed_by: confirmed_by || "admin",
        notes: admin_notes || null,
        metadata: {
          payment_status: updateData.status_pembayaran || oldTransaction.status_pembayaran,
        },
      });
    }

    // If confirmed and paid, create room bookings
    if (
      updateData.booking_status === "confirmed" &&
      updateData.status_pembayaran === "paid" &&
      oldTransaction?.room_id &&
      oldTransaction?.check_in &&
      oldTransaction?.check_out
    ) {
      // Call the PostgreSQL function to create booking range
      const { error: bookingError } = await supabaseAdmin.rpc("create_booking_range", {
        p_room_id: oldTransaction.room_id,
        p_transaction_id: transactionId,
        p_check_in: oldTransaction.check_in,
        p_check_out: oldTransaction.check_out,
      });

      if (bookingError) {
        console.error("[Admin Transaction API] Error creating booking range:", bookingError);
        // Don't fail the request, just log the error
      }

      // Update room status to occupied
      await supabaseAdmin
        .from("rooms")
        .update({ status: "occupied", updated_at: new Date().toISOString() })
        .eq("id", oldTransaction.room_id);
    }

    // If cancelled, release bookings
    if (updateData.booking_status === "cancelled" && oldTransaction?.room_id) {
      // Delete room bookings
      await supabaseAdmin
        .from("room_bookings")
        .delete()
        .eq("transaction_id", transactionId);

      // Check if room should be set back to available
      const { data: remainingBookings } = await supabaseAdmin
        .from("room_bookings")
        .select("id")
        .eq("room_id", oldTransaction.room_id)
        .gte("booking_date", new Date().toISOString().split("T")[0])
        .limit(1);

      if (!remainingBookings || remainingBookings.length === 0) {
        await supabaseAdmin
          .from("rooms")
          .update({ status: "available", updated_at: new Date().toISOString() })
          .eq("id", oldTransaction.room_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Transaction updated successfully",
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("[Admin Transaction API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
