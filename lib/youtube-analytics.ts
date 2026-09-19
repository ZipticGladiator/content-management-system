import "server-only";
import { getValidAccessToken } from "@/lib/youtube-oauth";

export function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export type VideoStats = {
  views: number;
  estimatedMinutesWatched: number;
  likes: number;
  comments: number;
};

/**
 * Fetches lifetime totals for a single video from the connected channel.
 * Returns null if not connected, the video isn't found, or the call fails
 * (e.g. the video belongs to a different channel).
 */
export async function fetchVideoStats(videoId: string): Promise<VideoStats | null> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return null;

  const params = new URLSearchParams({
    ids: "channel==MINE",
    startDate: "2005-01-01",
    endDate: new Date().toISOString().slice(0, 10),
    metrics: "views,estimatedMinutesWatched,likes,comments",
    dimensions: "video",
    filters: `video==${videoId}`,
  });

  const res = await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;
  const data = await res.json();
  const row: number[] | undefined = data.rows?.[0];
  if (!row) return null;

  const [, views, estimatedMinutesWatched, likes, comments] = row;
  return { views, estimatedMinutesWatched, likes, comments };
}
