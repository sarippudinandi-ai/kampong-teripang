import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const info = {
    url_set: !!url,
    url_preview: url ? url.substring(0, 50) : "MISSING",
    key_set: !!key,
    key_preview: key ? key.substring(0, 30) + "..." : "MISSING",
  };

  if (!url || !key) {
    return NextResponse.json({ error: "ENV vars missing", info }, { status: 500 });
  }

  try {
    const supabase = createClient(url, key);

    // Test 1: list tables
    const { data: tables, error: tableErr } = await supabase
      .from("availability")
      .select("count")
      .limit(1);

    if (tableErr) {
      return NextResponse.json({
        status: "TABLE_ERROR",
        error: tableErr.message,
        code: tableErr.code,
        hint: tableErr.hint,
        info,
        fix: tableErr.code === "42P01"
          ? "Tabel 'availability' belum dibuat. Jalankan SQL di Supabase SQL Editor."
          : "Cek RLS policy di Supabase.",
      }, { status: 500 });
    }

    // Test 2: insert test
    const testDate = "2099-01-01";
    const { error: insertErr } = await supabase
      .from("availability")
      .upsert({ tanggal: testDate, rooms: [] }, { onConflict: "tanggal" });

    if (insertErr) {
      return NextResponse.json({
        status: "INSERT_ERROR",
        error: insertErr.message,
        code: insertErr.code,
        info,
      }, { status: 500 });
    }

    // Cleanup test data
    await supabase.from("availability").delete().eq("tanggal", testDate);

    return NextResponse.json({
      status: "OK",
      message: "Supabase terhubung dan tabel availability berfungsi normal",
      info,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      status: "EXCEPTION",
      error: err instanceof Error ? err.message : String(err),
      info,
    }, { status: 500 });
  }
}
