import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for auth token in cookies (we'll set this client-side)
  const token = request.cookies.get("auth-token")?.value;

  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  // If authenticated and trying to access login/register, redirect to dashboard
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If not authenticated and trying to access protected routes, redirect to login
  if (!token && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - _next (static files)
     * - favicon, images, etc.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
