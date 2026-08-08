import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DEFAULTS = {
  whatsapp_number: process.env.ADMIN_WA_NUMBER || "6283161259104",
  business_name: "MeLamun Villa",
};

const updateSchema = z.object({
  whatsapp_number: z
    .string()
    .regex(/^[0-9]{10,15}$/, "Nomor WhatsApp harus 10-15 digit angka")
    .optional(),
  business_name: z.string().min(1).max(100).optional(),
});

function isAdmin() {
  const adminSession = cookies().get("admin_session");
  return Boolean(adminSession);
}

/**
 * GET /api/site-config  (public)
 * Returns global site configuration with safe fallbacks.
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("site_config")
      .select("whatsapp_number, business_name")
      .eq("id", 1)
      .single();

    if (error || !data) {
      // Fallback so the frontend never breaks if the table is missing
      return NextResponse.json({ success: true, config: DEFAULTS });
    }

    return NextResponse.json({ success: true, config: data });
  } catch {
    return NextResponse.json({ success: true, config: DEFAULTS });
  }
}

/**
 * PATCH /api/site-config  (admin only)
 * Updates the singleton config row.
 */
export async function PATCH(req: NextRequest) {
  try {
    if (!isAdmin()) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validasi gagal",
          details: parsed.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const updateData = { ...parsed.data, updated_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from("site_config")
      .update(updateData)
      .eq("id", 1)
      .select("whatsapp_number, business_name")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Gagal menyimpan konfigurasi", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, config: data });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
