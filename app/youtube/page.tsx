import { prisma } from "@/lib/prisma";
import { mapYoutubeVideo } from "@/lib/mappers";
import { YOUTUBE_STAGES, YOUTUBE_STEPS } from "@/lib/pipeline";
import PipelineBoard from "@/components/PipelineBoard";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
import { buildAuthUrl, getConnectedChannel } from "@/lib/youtube-oauth";
import { extractYoutubeVideoId, fetchVideoStats, type VideoStats } from "@/lib/youtube-analytics";
import { disconnectYoutubeChannel } from "@/app/youtube/youtube-auth-actions";
import {
  createYoutubeVideo,
  deleteYoutubeVideo,
  updateYoutubeStatus,
  updateYoutubeVideo,
} from "@/app/youtube/actions";

export const dynamic = "force-dynamic";

export default async function YoutubePage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string; youtube_connected?: string; youtube_error?: string }>;
}) {
  const { open, youtube_connected, youtube_error } = await searchParams;
  const videos = await prisma.youtubeVideo.findMany({
    include: {
      script: { select: { id: true } },
      _count: { select: { comments: true, attachments: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const channel = await getConnectedChannel();
  const videoStats: Record<string, VideoStats> = {};

  if (channel) {
    const published = videos.filter((v) => v.status === "PUBLISHED" && extractYoutubeVideoId(v.url));
    await Promise.all(
      published.map(async (v) => {
        const ytId = extractYoutubeVideoId(v.url)!;
        const stats = await fetchVideoStats(ytId);
        if (stats) videoStats[v.id] = stats;
      })
    );
  }

  return (
    <PipelineBoard
      kind="youtube"
      title="YouTube pipeline"
      subtitle="Siya | Cybersecurity — long-form videos, idea to published"
      icon={<YouTubeIcon size={36} />}
      initialOpenId={open}
      items={videos.map(mapYoutubeVideo)}
      stages={YOUTUBE_STAGES}
      steps={YOUTUBE_STEPS}
      showCostAndEditor
      onCreate={createYoutubeVideo}
      onUpdate={updateYoutubeVideo}
      onDelete={deleteYoutubeVideo}
      onStatusChange={updateYoutubeStatus}
      youtubeChannel={channel ? { title: channel.channelTitle } : null}
      youtubeConnectUrl={buildAuthUrl()}
      onDisconnectYoutube={disconnectYoutubeChannel}
      videoStats={videoStats}
      connectNotice={youtube_connected ? "connected" : youtube_error ? `error:${youtube_error}` : undefined}
    />
  );
}
