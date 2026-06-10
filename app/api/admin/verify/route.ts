import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { rateLimit, getClientIP } from "@/lib/rateLimit";

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

    // Get hashed password from environment
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!passwordHash) {
      console.error("ADMIN_PASSWORD_HASH not configured in environment");
      return NextResponse.json(
        { error: "Server configuration error", valid: false },
        { status: 500 }
      );
    }

    // Compare password with hash
    const isValid = await bcrypt.compare(password, passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password", valid: false },
        { status: 401 }
      );
    }

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
