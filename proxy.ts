import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (session) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // These API routes authenticate themselves instead of using the session cookie:
  // api/mobile with a bearer session token (lib/mobile-api.ts), api/cron with CRON_SECRET
  // (Vercel's cron requests carry no cookie, so redirecting them to /login meant Trash was never purged).
  matcher: ["/((?!login|api/mobile|api/cron|_next/static|_next/image|favicon.ico).*)"],
};
