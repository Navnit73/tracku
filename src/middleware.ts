import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "default_secret_finance_track_key",
  });
  const { pathname } = req.nextUrl;

  // Protect all app workspace routes
  if (!token) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/transactions",
    "/expenses",
    "/income",
    "/investments",
    "/categories",
    "/reports",
    "/settings",
  ],
};
