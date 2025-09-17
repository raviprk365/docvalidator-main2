import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userCookie = request.cookies.get("doc-validator-user");

  // If user has a valid cookie and is on root or auth page, redirect to folders
  if (userCookie && userCookie.value && (pathname === "/" || pathname === "/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/folders";
    return NextResponse.redirect(url);
  }

  // If user doesn't have cookie and is trying to access protected routes, redirect to root
  if ((!userCookie || !userCookie.value) && (pathname === "/folders" || pathname === "/admin" || pathname.startsWith("/dashboard"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/auth", "/folders", "/admin", "/dashboard/:path*"],
};
