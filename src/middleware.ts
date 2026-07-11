import { NextResponse, type NextRequest } from "next/server";
import { DASHBOARD_COOKIE, isAuthenticated } from "@/lib/dashboard-auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /dashboard 내부 페이지는 인증 필요 (단, /dashboard/login 제외)
  if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/login") {
    const token = req.cookies.get(DASHBOARD_COOKIE)?.value;
    if (!isAuthenticated(token)) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // `/dashboard/:path*`만으로는 `/dashboard` 루트가 매칭되지 않음
  matcher: ["/dashboard", "/dashboard/:path*"],
};
