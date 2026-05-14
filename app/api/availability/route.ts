import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

console.log("[API] Supabase URL:", supabaseUrl ? supabaseUrl.substring(0, 40) + "..." : "MISSING");
console.log("[API] Supabase Key:", supabaseKey ? supabaseKey.substring(0, 20) + "..." : "MISSING");

const supabase = createClient(supabaseUrl, supabaseKey);

// GET — ambil semua data availability
export async function GET() {
  try {
    console.log("[API GET] Querying availability table...");

    const { data, error } = await supabase
      .from("availability")
      .select("tanggal, rooms")
      .order("tanggal", { ascending: true });

    if (error) {
      console.error("[API GET] Supabase error:", JSON.stringify(error));
      return NextResponse.json(
        { error: "Supabase error", detail: error.message, code: error.code },
        { status: 500 }
      );
    }

    console.log("[API GET] Success, rows:", data?.length ?? 0);
    const result = (data ?? []).map((row) => ({
      tanggal: row.tanggal as string,
      rooms: row.rooms,
    }));

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[API GET] Exception:", msg);
    return NextResponse.json({ error: "Exception", detail: msg }, { status: 500 });
  }
}

// POST — simpan satu hari (upsert)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tanggal, rooms } = body;

    console.log("[API POST] Upserting:", tanggal, "rooms count:", rooms?.length);

    if (!tanggal || !Array.isArray(rooms)) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { error } = await supabase
      .from("availability")
      .upsert({ tanggal, rooms }, { onConflict: "tanggal" });

    if (error) {
      console.error("[API POST] Supabase error:", JSON.stringify(error));
      return NextResponse.json(
        { error: "Supabase error", detail: error.message, code: error.code },
        { status: 500 }
      );
    }

    console.log("[API POST] Success:", tanggal);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[API POST] Exception:", msg);
    return NextResponse.json({ error: "Exception", detail: msg }, { status: 500 });
  }
}

// DELETE — hapus satu hari
export async function DELETE(req: NextRequest) {
  try {
    const { tanggal } = await req.json();

    if (!tanggal) {
      return NextResponse.json({ error: "Tanggal diperlukan" }, { status: 400 });
    }

    const { error } = await supabase
      .from("availability")
      .delete()
      .eq("tanggal", tanggal);

    if (error) {
      console.error("[API DELETE] Supabase error:", JSON.stringify(error));
      return NextResponse.json(
        { error: "Supabase error", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[API DELETE] Exception:", msg);
    return NextResponse.json({ error: "Exception", detail: msg }, { status: 500 });
  }
}
