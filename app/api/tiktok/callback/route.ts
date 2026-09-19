import { NextResponse, type NextRequest } from "next/server";
import { handleOAuthCallback } from "@/lib/tiktok-oauth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/tiktok?tiktok_error=${encodeURIComponent(error)}`, request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/tiktok?tiktok_error=missing_code", request.url));
  }

  try {
    await handleOAuthCallback(code);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.redirect(new URL(`/tiktok?tiktok_error=${encodeURIComponent(message)}`, request.url));
  }

  return NextResponse.redirect(new URL("/tiktok?tiktok_connected=1", request.url));
}
