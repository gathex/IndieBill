import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Always allow static files, images, brand assets, videos, icons
  if (
    pathname.startsWith("/brand") ||
    pathname.startsWith("/videos") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|map|mp4|webm)$/i.test(pathname)
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
  const isExpiredSession = nextUrl.searchParams.get("session") === "expired";

  if (isAuthPage && isExpiredSession) {
    const res = NextResponse.next();
    for (const cookieName of [
      "authjs.session-token",
      "__Secure-authjs.session-token",
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
    ]) {
      res.cookies.delete(cookieName);
    }
    return res;
  }

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
    "/((?!api|_next/static|_next/image|brand|videos|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
  ],
};
