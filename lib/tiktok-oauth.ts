import "server-only";
import { prisma } from "@/lib/prisma";

const SCOPES = ["user.info.basic", "video.list"].join(",");

function redirectUri(): string {
  const base = process.env.TIKTOK_OAUTH_BASE_URL || "http://localhost:3000";
  return `${base}/api/tiktok/callback`;
}

export function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES,
    state: "cms",
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  open_id: string;
  error?: string;
  error_description?: string;
};

async function fetchDisplayName(accessToken: string) {
  const res = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=display_name",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.user?.display_name ?? null;
}

export async function handleOAuthCallback(code: string) {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri(),
    }),
  });

  const tokens: TokenResponse = await res.json();
  if (!res.ok || tokens.error) {
    throw new Error(tokens.error_description || `Token exchange failed: ${JSON.stringify(tokens)}`);
  }

  const displayName = await fetchDisplayName(tokens.access_token);
  const accessTokenExp = new Date(Date.now() + tokens.expires_in * 1000);

  const existing = await prisma.tiktokAuth.findFirst();
  const data = {
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token,
    accessTokenExp,
    openId: tokens.open_id,
    displayName,
  };
  if (existing) {
    await prisma.tiktokAuth.update({ where: { id: existing.id }, data });
  } else {
    await prisma.tiktokAuth.create({ data });
  }
}

export async function getConnectedAccount() {
  return prisma.tiktokAuth.findFirst();
}

export async function disconnectTiktok() {
  const existing = await prisma.tiktokAuth.findFirst();
  if (existing) await prisma.tiktokAuth.delete({ where: { id: existing.id } });
}

export async function getValidAccessToken(): Promise<string | null> {
  const auth = await prisma.tiktokAuth.findFirst();
  if (!auth) return null;

  if (auth.accessToken && auth.accessTokenExp && auth.accessTokenExp.getTime() > Date.now() + 60_000) {
    return auth.accessToken;
  }

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: auth.refreshToken,
    }),
  });

  const tokens: TokenResponse = await res.json();
  if (!res.ok || tokens.error) return null;

  const accessTokenExp = new Date(Date.now() + tokens.expires_in * 1000);
  await prisma.tiktokAuth.update({
    where: { id: auth.id },
    data: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, accessTokenExp },
  });

  return tokens.access_token;
}
