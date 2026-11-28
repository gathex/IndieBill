import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Always allow static files, images, brand assets, icons
  if (
    pathname.startsWith("/brand") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|map)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const isLoggedIn = Boolean(req.auth?.user);
  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/share") ||
    pathname.startsWith("/i/") ||
    pathname.startsWith("/q/");
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (!isLoggedIn && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|brand|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
