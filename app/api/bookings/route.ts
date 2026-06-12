import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIP } from "@/lib/rateLimit";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Rate limiter: max 5 booking attempts per minute per IP
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500,
});

// Zod validation schema untuk new booking flow
const createBookingSchema = z.object({
  guest_name: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama maksimal 100 karakter")
    .regex(/^[a-zA-Z\s.]+$/, "Nama hanya boleh berisi huruf dan spasi"),
  guest_email: z
    .string()
    .email("Format email tidak valid")
    .max(255, "Email terlalu panjang"),
  guest_wa: z
    .string()
    .regex(/^[0-9]{10,15}$/, "Nomor WhatsApp harus 10-15 digit angka"),
  room_id: z.string().uuid("Invalid room ID"),
  check_in: z
    .string()
    .refine((date) => {
      const checkIn = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return checkIn >= today;
    }, "Tanggal check-in tidak boleh di masa lalu"),
  check_out: z
    .string()
    .refine((date) => {
      const checkOut = new Date(date);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return checkOut >= tomorrow;
    }, "Tanggal check-out minimal 1 hari setelah check-in"),
  guest_count: z
    .number()
    .int("Jumlah tamu harus bilangan bulat")
    .min(1, "Minimal 1 tamu")
    .max(20, "Maksimal 20 tamu"),
  notes: z
    .string()
    .max(500, "Catatan maksimal 500 karakter")
    .optional(),
});

// Sanitasi string untuk mencegah XSS
function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, "") // Remove < dan >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

/**
 * POST /api/bookings
 * Create new booking (Guest Flow - Frontend)
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const ip = getClientIP(req.headers);
    const rateLimitResult = limiter.check(5, `booking_${ip}`);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Terlalu banyak permintaan. Silakan coba lagi dalam 1 menit.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate with Zod
    const validationResult = createBookingSchema.safeParse(body);

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

    const validated = validationResult.data;

    // Additional validation: check-out must be after check-in
    const checkInDate = new Date(validated.check_in);
    const checkOutDate = new Date(validated.check_out);

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: "Tanggal check-out harus setelah check-in" },
        { status: 400 }
      );
    }

    // Sanitize all string inputs
    const sanitized = {
      guest_name: sanitizeString(validated.guest_name),
      guest_email: sanitizeString(validated.guest_email),
      guest_wa: validated.guest_wa.replace(/\D/g, ""), // Remove non-digits
      room_id: validated.room_id,
      check_in: validated.check_in,
      check_out: validated.check_out,
      guest_count: validated.guest_count,
      notes: validated.notes ? sanitizeString(validated.notes) : null,
    };

    // Check room availability using PostgreSQL function
    const { data: isAvailable, error: checkError } = await supabase.rpc(
      "check_booking_conflict",
      {
        p_room_id: sanitized.room_id,
        p_check_in: sanitized.check_in,
        p_check_out: sanitized.check_out,
      }
    );

    if (checkError) {
      console.error("[Bookings API] Error checking availability:", checkError);
      return NextResponse.json(
        {
          error: "Gagal mengecek ketersediaan kamar",
          details: checkError.message,
        },
        { status: 500 }
      );
    }

    if (!isAvailable) {
      return NextResponse.json(
        {
          error: "Kamar tidak tersedia untuk tanggal yang dipilih",
          message:
            "Maaf, kamar ini sudah dipesan untuk tanggal tersebut. Silakan pilih kamar lain atau tanggal berbeda.",
        },
        { status: 409 }
      );
    }

    // Get room details to calculate price
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("base_price, room_name, room_type")
      .eq("id", sanitized.room_id)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "Kamar tidak ditemukan" },
        { status: 404 }
      );
    }

    // Calculate total price (nights * base_price)
    const nights =
      Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    const totalPrice = nights * room.base_price;

    // Insert booking to database
    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        guest_name: sanitized.guest_name,
        guest_email: sanitized.guest_email,
        guest_wa: sanitized.guest_wa,
        room_id: sanitized.room_id,
        check_in: sanitized.check_in,
        check_out: sanitized.check_out,
        guest_count: sanitized.guest_count,
        total_price: totalPrice,
        booking_status: "PENDING_PAYMENT",
        payment_status: "UNPAID",
        notes: sanitized.notes,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Bookings API] Error creating booking:", insertError);
      return NextResponse.json(
        {
          error: "Gagal membuat reservasi",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // Return booking details for checkout page
    return NextResponse.json({
      success: true,
      message: "Reservasi berhasil dibuat. Silakan lanjutkan ke pembayaran.",
      booking: {
        id: booking.id,
        booking_id: booking.booking_id,
        guest_name: booking.guest_name,
        guest_wa: booking.guest_wa,
        room_name: room.room_name,
        room_type: room.room_type,
        check_in: booking.check_in,
        check_out: booking.check_out,
        nights: nights,
        guest_count: booking.guest_count,
        total_price: totalPrice,
        booking_status: booking.booking_status,
        payment_status: booking.payment_status,
        created_at: booking.created_at,
      },
    });
  } catch (error) {
    console.error("[Bookings API] Unexpected error:", error);
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
 * GET /api/bookings?booking_id=KLM-XXXXX
 * Get booking details by booking_id (for guest to check status)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("booking_id");

    if (!bookingId) {
      return NextResponse.json(
        { error: "booking_id parameter required" },
        { status: 400 }
      );
    }

    // Get booking from database
    const { data: booking, error } = await supabase
      .from("vw_bookings_dashboard")
      .select("*")
      .eq("booking_id", bookingId)
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
    console.error("[Bookings API] GET error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
