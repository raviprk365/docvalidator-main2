import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get("doc-validator-user");
  // If cookie "doc-validator-user" is missing, redirect to /auth
  if (!userCookie || userCookie.value === undefined) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  // const { pathname } = request.nextUrl;

  // if (userCookie && (pathname === "/" || pathname === "/auth")) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = "/folders";
  //   return NextResponse.redirect(url);
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/folders", "/admin"],
};
