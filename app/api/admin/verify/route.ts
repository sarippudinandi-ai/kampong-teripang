import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { rateLimit, getClientIP } from "@/lib/rateLimit";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Rate limiter: max 5 login attempts per minute per IP
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 unique IPs tracked
});

// Generate secure session token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const ip = getClientIP(req.headers);
    const rateLimitResult = limiter.check(5, `admin_login_${ip}`);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again in 1 minute.",
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { password } = body;

    // Validate input
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required", valid: false },
        { status: 400 }
      );
    }

    // METHOD 1: Try database authentication first (using pgcrypto)
    let isValid = false;
    let authMethod = "unknown";

    try {
      // Query admin_users table (password hashed with pgcrypto/bcrypt)
      const { data: adminUser, error: dbError } = await supabaseAdmin
        .rpc('verify_admin_password', {
          input_username: 'admin',
          input_password: password
        });

      if (!dbError && adminUser === true) {
        isValid = true;
        authMethod = "database";
      }
    } catch (dbError) {
      console.warn("Database auth failed, falling back to ENV:", dbError);
    }

    // METHOD 2: Fallback to ENV hash if database auth fails
    if (!isValid) {
      const passwordHash = process.env.ADMIN_PASSWORD_HASH;

      if (passwordHash) {
        isValid = await bcrypt.compare(password, passwordHash);
        if (isValid) {
          authMethod = "environment";
        }
      }
    }

    // METHOD 3: Emergency fallback - plaintext comparison (ONLY for development)
    if (!isValid && process.env.NODE_ENV !== "production") {
      const plainPassword = process.env.ADMIN_PASSWORD || "melamun2024";
      if (password === plainPassword) {
        isValid = true;
        authMethod = "plaintext_dev";
        console.warn("⚠️ WARNING: Using plaintext password comparison. NOT secure for production!");
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password", valid: false },
        { status: 401 }
      );
    }

    console.log(`✅ Admin authenticated via: ${authMethod}`);

    // Generate secure session token
    const sessionToken = generateSessionToken();

    // Set httpOnly cookie for session
    cookies().set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    });

    return NextResponse.json({
      valid: true,
      message: "Authentication successful",
    });
  } catch (error) {
    console.error("Admin verification error:", error);
    return NextResponse.json(
      { error: "Internal server error", valid: false },
      { status: 500 }
    );
  }
}

// Session check endpoint (used by /admin/bookings page to verify auth)
export async function GET() {
  try {
    const cookieStore = cookies();
    const adminSession = cookieStore.get("admin_session");

    if (!adminSession) {
      return NextResponse.json(
        { authenticated: false, error: "No active session" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      message: "Session active",
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { authenticated: false, error: "Session check failed" },
      { status: 500 }
    );
  }
}

// Logout endpoint
export async function DELETE() {
  try {
    cookies().delete("admin_session");
    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
