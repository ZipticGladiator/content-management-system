import "server-only";
import { getValidAccessToken } from "@/lib/tiktok-oauth";

export function extractTiktokVideoId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/) || url.match(/\/v\/(\d+)/);
  return m ? m[1] : null;
}

export type ClipStats = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
};

/**
 * Fetches current totals for a single clip from the connected account.
 * TikTok's public API only exposes live cumulative counters, not a
 * historical/date-ranged breakdown the way YouTube Analytics does.
 */
export async function fetchClipStats(videoId: string): Promise<ClipStats | null> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return null;

  const res = await fetch(
    "https://open.tiktokapis.com/v2/video/query/?fields=id,view_count,like_count,comment_count,share_count",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filters: { video_ids: [videoId] } }),
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  const video = data.data?.videos?.[0];
  if (!video) return null;

  return {
    views: video.view_count ?? 0,
    likes: video.like_count ?? 0,
    comments: video.comment_count ?? 0,
    shares: video.share_count ?? 0,
  };
}

export type AccountOverview = {
  followerCount: number;
  likesCount: number;
  videoCount: number;
};

/** Current account totals — a snapshot, not a trailing-period delta. */
export async function fetchAccountOverview(): Promise<AccountOverview | null> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return null;

  const res = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=follower_count,likes_count,video_count",
    { headers: { Authorization: `Bearer ${accessToken}` }, next: { revalidate: 3600 } }
  );

  if (!res.ok) return null;
  const data = await res.json();
  const user = data.data?.user;
  if (!user) return null;

  return {
    followerCount: user.follower_count ?? 0,
    likesCount: user.likes_count ?? 0,
    videoCount: user.video_count ?? 0,
  };
}
