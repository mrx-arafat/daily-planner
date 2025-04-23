import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check if the user is authenticated
  const isAuthenticated =
    request.cookies.get("planner_authenticated")?.value === "true" ||
    request.headers.get("authorization") ===
      `Bearer ${process.env.NEXT_PUBLIC_PLANNER_PASSWORD}`;

  // Get the pathname of the request (e.g. /analytics)
  const pathname = request.nextUrl.pathname;

  // Define protected routes
  const protectedRoutes = ["/analytics", "/api/analytics"];

  // Check if the request is for a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If it's a protected route and the user isn't authenticated,
  // redirect to the home page
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL("/", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/analytics/:path*", "/api/analytics/:path*"],
};
