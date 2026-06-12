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

// Zod validation schema untuk booking
const bookingSchema = z.object({
  nama: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama maksimal 100 karakter")
    .regex(/^[a-zA-Z\s.]+$/, "Nama hanya boleh berisi huruf dan spasi"),
  email: z
    .string()
    .email("Format email tidak valid")
    .max(255, "Email terlalu panjang"),
  no_wa: z
    .string()
    .regex(/^[0-9]{10,15}$/, "Nomor WhatsApp harus 10-15 digit angka"),
  paket: z.string().min(1, "Paket harus dipilih"),
  room_id: z.string().uuid("Invalid room ID").optional(), // New: specific room selection
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
  tamu: z
    .number()
    .int("Jumlah tamu harus bilangan bulat")
    .min(1, "Minimal 1 tamu")
    .max(20, "Maksimal 20 tamu"),
  catatan: z
    .string()
    .max(500, "Catatan maksimal 500 karakter")
    .optional(),
  total_bayar: z.number().positive("Total bayar harus lebih dari 0").optional(),
  tipe_order: z.enum(["villa", "tour", "produk"]).optional(),
});

// Sanitasi string untuk mencegah XSS
function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, "") // Remove < dan >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const ip = getClientIP(req.headers);
    const rateLimitResult = limiter.check(5, `booking_${ip}`);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Terlalu banyak permintaan. Silakan coba lagi dalam 1 menit.",
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate with Zod
    const validationResult = bookingSchema.safeParse(body);

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
      ...validated,
      nama: sanitizeString(validated.nama),
      email: sanitizeString(validated.email),
      paket: sanitizeString(validated.paket),
      catatan: validated.catatan ? sanitizeString(validated.catatan) : undefined,
    };

    // NEW: Check room availability if room_id provided
    let selectedRoomId = sanitized.room_id;

    if (!selectedRoomId) {
      // Auto-assign available room based on package type
      const roomTypeMap: Record<string, string> = {
        "villa-standard": "standard",
        "villa-deluxe": "deluxe",
        "villa-family": "family",
      };

      const roomType = roomTypeMap[sanitized.paket];

      if (roomType) {
        // Call Supabase function to get available rooms
        const { data: availableRooms, error: availError } = await supabase.rpc(
          "get_available_rooms",
          {
            p_check_in: sanitized.check_in,
            p_check_out: sanitized.check_out,
            p_room_type: roomType,
          }
        );

        if (availError) {
          console.error("[Booking API] Error checking availability:", availError);
          return NextResponse.json(
            {
              error: "Gagal mengecek ketersediaan kamar",
              details: availError.message,
            },
            { status: 500 }
          );
        }

        if (!availableRooms || availableRooms.length === 0) {
          return NextResponse.json(
            {
              error: "Tidak ada kamar tersedia untuk tanggal yang dipilih",
              suggestion: "Silakan pilih tanggal lain atau hubungi admin",
            },
            { status: 409 }
          );
        }

        // Assign first available room
        selectedRoomId = availableRooms[0].room_id;
      }
    } else {
      // Verify specific room is available
      const { data: isAvailable, error: checkError } = await supabase.rpc(
        "check_room_availability",
        {
          p_room_id: selectedRoomId,
          p_check_in: sanitized.check_in,
          p_check_out: sanitized.check_out,
        }
      );

      if (checkError || !isAvailable) {
        return NextResponse.json(
          {
            error: "Kamar yang dipilih tidak tersedia untuk tanggal tersebut",
            suggestion: "Silakan pilih kamar atau tanggal lain",
          },
          { status: 409 }
        );
      }
    }

    // Save to Supabase transactions table
    const { data: transaction, error: insertError } = await supabase
      .from("transactions")
      .insert({
        nama_pemesan: sanitized.nama,
        email: sanitized.email,
        no_wa: sanitized.no_wa,
        total_bayar: sanitized.total_bayar || 0,
        status_pembayaran: "pending",
        booking_status: "inquiry", // Initial status
        tipe_order: sanitized.tipe_order || "villa",
        room_id: selectedRoomId,
        check_in: sanitized.check_in,
        check_out: sanitized.check_out,
        guest_count: sanitized.tamu,
        detail_order: {
          paket: sanitized.paket,
          catatan: sanitized.catatan,
          ip_address: ip,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Booking API] Error creating transaction:", insertError);
      return NextResponse.json(
        {
          error: "Gagal membuat reservasi",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // Log to audit trail
    await supabase.from("booking_audit_log").insert({
      transaction_id: transaction.id,
      action: "created",
      old_status: null,
      new_status: "inquiry",
      changed_by: "system",
      notes: "Booking created from public website",
      metadata: {
        ip_address: ip,
        user_agent: req.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reservasi berhasil diterima. Admin akan menghubungi Anda segera.",
      order_id: transaction.id,
      booking_code: `KM-${transaction.id.slice(0, 8).toUpperCase()}`,
      data: {
        ...sanitized,
        room_id: selectedRoomId,
      },
    });
  } catch (error) {
    console.error("[Booking API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
