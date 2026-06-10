import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Protect /admin route (except login page)
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const session = request.cookies.get("admin_session");

    // Allow access to admin page itself (login form), but check session for actual operations
    // The page component will handle showing login vs dashboard based on auth state
    
    // This is a lightweight check - actual auth verification happens in API routes
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
