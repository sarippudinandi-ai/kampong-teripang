import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIP } from "@/lib/rateLimit";

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

    // TODO: Save to Supabase (uncomment when ready)
    /*
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        nama_pemesan: sanitized.nama,
        email: sanitized.email,
        no_wa: sanitized.no_wa,
        total_bayar: sanitized.total_bayar || 0,
        status_pembayaran: "pending",
        tipe_order: sanitized.tipe_order || "villa",
        detail_order: sanitized,
      })
      .select()
      .single();

    if (error) throw error;
    */

    // For now, return success (mock)
    return NextResponse.json({
      success: true,
      message: "Reservasi berhasil diterima",
      order_id: `ORD-${Date.now()}`,
      data: sanitized,
    });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
