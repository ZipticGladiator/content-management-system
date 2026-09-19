import "server-only";
import { prisma } from "@/lib/prisma";

const SCOPES = [
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

function redirectUri(): string {
  const base = process.env.YOUTUBE_OAUTH_BASE_URL || "http://localhost:3000";
  return `${base}/api/youtube/callback`;
}

export function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.YOUTUBE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

async function fetchChannelInfo(accessToken: string) {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const channel = data.items?.[0];
  return channel ? { id: channel.id as string, title: channel.snippet?.title as string } : null;
}

export async function handleOAuthCallback(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${await res.text()}`);
  }

  const tokens: TokenResponse = await res.json();
  if (!tokens.refresh_token) {
    throw new Error(
      "Google did not return a refresh token. Revoke the app's access at https://myaccount.google.com/permissions and try connecting again."
    );
  }

  const channel = await fetchChannelInfo(tokens.access_token);
  const accessTokenExp = new Date(Date.now() + tokens.expires_in * 1000);

  // Singleton: this app manages one connected YouTube channel.
  const existing = await prisma.youtubeAuth.findFirst();
  const data = {
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token,
    accessTokenExp,
    channelId: channel?.id ?? null,
    channelTitle: channel?.title ?? null,
  };
  if (existing) {
    await prisma.youtubeAuth.update({ where: { id: existing.id }, data });
  } else {
    await prisma.youtubeAuth.create({ data });
  }
}

export async function getConnectedChannel() {
  return prisma.youtubeAuth.findFirst();
}

export async function disconnectYoutube() {
  const existing = await prisma.youtubeAuth.findFirst();
  if (existing) await prisma.youtubeAuth.delete({ where: { id: existing.id } });
}

export async function getValidAccessToken(): Promise<string | null> {
  const auth = await prisma.youtubeAuth.findFirst();
  if (!auth) return null;

  if (auth.accessToken && auth.accessTokenExp && auth.accessTokenExp.getTime() > Date.now() + 60_000) {
    return auth.accessToken;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: auth.refreshToken,
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    return null;
  }

  const tokens: TokenResponse = await res.json();
  const accessTokenExp = new Date(Date.now() + tokens.expires_in * 1000);
  await prisma.youtubeAuth.update({
    where: { id: auth.id },
    data: { accessToken: tokens.access_token, accessTokenExp },
  });

  return tokens.access_token;
}
