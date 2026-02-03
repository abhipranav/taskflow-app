import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes without redirect
  const publicRoutes = ["/welcome", "/login", "/blog", "/api"];
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/sw.js") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg")
  ) {
    return NextResponse.next();
  }
  
  // Check for auth session cookie
  const hasSession = request.cookies.has("next-auth.session-token") || 
                     request.cookies.has("__Secure-next-auth.session-token");
  
  // Redirect unauthenticated users accessing protected routes to welcome
  if (!hasSession && !isPublicRoute) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }
  
  // Only redirect authenticated users from login page (allow welcome page access)
  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
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
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)",
  ],
};
