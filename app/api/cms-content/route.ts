import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod";

/**
 * CMS CONTENT API
 * ---------------------------------------------------------------
 * GET   (public) -> daftar override harga/nama/stok untuk villa/edu/produk
 * PATCH (admin)  -> simpan perubahan dari panel admin
 * ---------------------------------------------------------------
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function isAdmin() {
  return Boolean(cookies().get("admin_session"));
}

// Skema lentur: tiap item minimal punya id; field lain opsional
const villaItem = z.object({
  id: z.string(),
  nama: z.string().optional(),
  harga: z.number().optional(),
  kapasitas: z.number().optional(),
  deskripsi: z.string().optional(),
});
const eduItem = z.object({
  id: z.string(),
  nama: z.string().optional(),
  harga: z.number().optional(),
  kapasitas: z.number().optional(),
  durasi: z.string().optional(),
});
const productItem = z.object({
  id: z.string(),
  nama: z.string().optional(),
  harga: z.number().optional(),
  stok: z.number().optional(),
  tagline: z.string().optional(),
});

const updateSchema = z.object({
  villa: z.array(villaItem).optional(),
  edu: z.array(eduItem).optional(),
  products: z.array(productItem).optional(),
});

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("cms_content")
      .select("villa, edu, products")
      .eq("id", 1)
      .single();

    if (error || !data) {
      // Fallback: kosong -> landing pakai data statis default
      return NextResponse.json({
        success: true,
        content: { villa: [], edu: [], products: [] },
      });
    }

    return NextResponse.json({ success: true, content: data });
  } catch {
    return NextResponse.json({
      success: true,
      content: { villa: [], edu: [], products: [] },
    });
  }
}

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

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.villa) updateData.villa = parsed.data.villa;
    if (parsed.data.edu) updateData.edu = parsed.data.edu;
    if (parsed.data.products) updateData.products = parsed.data.products;

    const { data, error } = await supabase
      .from("cms_content")
      .update(updateData)
      .eq("id", 1)
      .select("villa, edu, products")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: "Gagal menyimpan konten",
          details: error.message,
          hint: "Pastikan cms_content.sql sudah dijalankan di Supabase.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, content: data });
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
