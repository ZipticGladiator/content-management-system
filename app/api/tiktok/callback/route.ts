import { NextResponse, type NextRequest } from "next/server";
import { handleOAuthCallback } from "@/lib/tiktok-oauth";
import { getCurrentUser } from "@/lib/session";

// Behind proxy.ts (not in its skip list), so the signed-in user's cookie is
// guaranteed here — the same browser that started the OAuth flow by clicking
// "Connect TikTok" is the one TikTok redirects back to.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/tiktok?tiktok_error=${encodeURIComponent(error)}`, request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/tiktok?tiktok_error=missing_code", request.url));
  }

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.redirect(new URL("/login?from=/tiktok", request.url));
  }

  try {
    await handleOAuthCallback(session.orgId, code);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.redirect(new URL(`/tiktok?tiktok_error=${encodeURIComponent(message)}`, request.url));
  }

  return NextResponse.redirect(new URL("/tiktok?tiktok_connected=1", request.url));
}
