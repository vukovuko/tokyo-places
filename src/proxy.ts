import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (isAdminRoute) {
    if (!req.auth) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (req.auth.user.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (isLoginPage && req.auth?.user.role === "admin") {
    return NextResponse.redirect(new URL("/admin/places", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
