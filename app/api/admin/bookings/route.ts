import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Initialize Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Middleware: Check admin authentication
 */
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");

  if (!adminSession) {
    return false;
  }

  return true;
}

/**
 * GET /api/admin/bookings
 * Get all bookings with filtering (Admin only)
 * 
 * Query params:
 * - status: filter by booking_status
 * - timeline: filter by timeline (today, upcoming, current, past, future)
 * - limit: number of results (default: 50)
 * - offset: pagination offset (default: 0)
 */
export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const timeline = searchParams.get("timeline");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabaseAdmin
      .from("vw_bookings_dashboard")
      .select("*", { count: "exact" });

    // Filter by booking status
    if (status) {
      query = query.eq("booking_status", status);
    }

    // Filter by timeline
    if (timeline) {
      query = query.eq("timeline_status", timeline);
    }

    // Apply pagination
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: bookings, error, count } = await query;

    if (error) {
      console.error("[Admin Bookings API] Query error:", error);
      return NextResponse.json(
        {
          error: "Gagal mengambil data bookings",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookings: bookings || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: count ? count > offset + limit : false,
      },
    });
  } catch (error) {
    console.error("[Admin Bookings API] GET error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
