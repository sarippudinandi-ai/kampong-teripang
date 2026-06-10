import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIP } from "@/lib/rateLimit";

// Rate limiter
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

// Zod validation schema
const checkoutItemSchema = z.object({
  id: z.string(),
  nama: z.string(),
  harga: z.number().positive(),
  qty: z.number().int().positive().max(100),
});

const checkoutSchema = z.object({
  nama: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama maksimal 100 karakter")
    .regex(/^[a-zA-Z\s.]+$/, "Nama hanya boleh berisi huruf dan spasi"),
  email: z.string().email("Format email tidak valid"),
  no_wa: z.string().regex(/^[0-9]{10,15}$/, "Nomor WhatsApp tidak valid"),
  alamat: z
    .string()
    .min(10, "Alamat minimal 10 karakter")
    .max(500, "Alamat maksimal 500 karakter"),
  items: z
    .array(checkoutItemSchema)
    .min(1, "Minimal 1 item")
    .max(20, "Maksimal 20 item"),
  total_bayar: z.number().positive(),
  tipe_order: z.literal("produk").optional(),
});

function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "");
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(req.headers);
    const rateLimitResult = limiter.check(5, `checkout_${ip}`);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi dalam 1 menit." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate
    const validationResult = checkoutSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        { error: "Validasi gagal", details: errors },
        { status: 400 }
      );
    }

    const validated = validationResult.data;

    // Verify total_bayar calculation
    const calculatedTotal = validated.items.reduce(
      (sum, item) => sum + item.harga * item.qty,
      0
    );

    if (Math.abs(calculatedTotal - validated.total_bayar) > 1) {
      return NextResponse.json(
        { error: "Total pembayaran tidak sesuai dengan item" },
        { status: 400 }
      );
    }

    // Sanitize
    const sanitized = {
      ...validated,
      nama: sanitizeString(validated.nama),
      email: sanitizeString(validated.email),
      alamat: sanitizeString(validated.alamat),
    };

    // TODO: Save to database
    // TODO: Xendit payment integration

    return NextResponse.json({
      success: true,
      message: "Pesanan berhasil diterima",
      order_id: `SHOP-${Date.now()}`,
      data: sanitized,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
