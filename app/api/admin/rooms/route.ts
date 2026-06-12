import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Initialize Supabase client with service role (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ──────────────────────────────────────────────────────────────
// GET: Fetch all rooms with occupancy data
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

    // Fetch rooms with current occupancy data
    const { data: rooms, error: roomsError } = await supabaseAdmin
      .from("rooms")
      .select(`
        *,
        room_bookings!left(
          transaction_id,
          booking_date,
          status
        )
      `)
      .order("floor_level", { ascending: true })
      .order("position_order", { ascending: true });

    if (roomsError) {
      console.error("[Admin Rooms API] Error fetching rooms:", roomsError);
      return NextResponse.json(
        { error: "Failed to fetch rooms", details: roomsError.message },
        { status: 500 }
      );
    }

    // Get current date
    const today = new Date().toISOString().split("T")[0];

    // Enrich room data with current guest info
    const enrichedRooms = await Promise.all(
      (rooms || []).map(async (room) => {
        // Check if room has active booking today
        const activeBooking = room.room_bookings?.find(
          (booking: { booking_date: string; status: string }) =>
            booking.booking_date === today &&
            (booking.status === "booked" || booking.status === "checked_in")
        );

        if (activeBooking && activeBooking.transaction_id) {
          // Fetch transaction details
          const { data: transaction } = await supabaseAdmin
            .from("transactions")
            .select("id, nama_pemesan, booking_status, status_pembayaran")
            .eq("id", activeBooking.transaction_id)
            .single();

          return {
            ...room,
            current_guest: transaction?.nama_pemesan || null,
            current_transaction_id: transaction?.id || null,
            room_bookings: undefined, // Remove raw booking data from response
          };
        }

        return {
          ...room,
          current_guest: null,
          current_transaction_id: null,
          room_bookings: undefined,
        };
      })
    );

    return NextResponse.json({
      success: true,
      rooms: enrichedRooms,
      count: enrichedRooms.length,
    });
  } catch (error) {
    console.error("[Admin Rooms API] Unexpected error:", error);
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
// PATCH: Update room status
// ──────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    // Check admin authentication
    const sessionCookie = cookies().get("admin_session");
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized - Please login as admin" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { room_id, status, notes } = body;

    // Validate input
    if (!room_id || !status) {
      return NextResponse.json(
        { error: "room_id and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["available", "occupied", "maintenance", "blocked"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Update room status
    const updateData: {
      status: string;
      updated_at: string;
      notes?: string;
    } = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data, error } = await supabaseAdmin
      .from("rooms")
      .update(updateData)
      .eq("id", room_id)
      .select()
      .single();

    if (error) {
      console.error("[Admin Rooms API] Error updating room:", error);
      return NextResponse.json(
        { error: "Failed to update room", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Room status updated successfully",
      room: data,
    });
  } catch (error) {
    console.error("[Admin Rooms API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
