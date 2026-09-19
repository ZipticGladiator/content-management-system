import { prisma } from "@/lib/prisma";
import { mapYoutubeVideo } from "@/lib/mappers";
import { YOUTUBE_STAGES, YOUTUBE_STEPS } from "@/lib/pipeline";
import PipelineBoard from "@/components/PipelineBoard";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
import { buildAuthUrl, getConnectedChannel } from "@/lib/youtube-oauth";
import { extractYoutubeVideoId, fetchChannelOverview, fetchVideoStats } from "@/lib/youtube-analytics";
import { disconnectYoutubeChannel } from "@/app/youtube/youtube-auth-actions";
import type { StatEntry } from "@/lib/types";
import {
  createYoutubeVideo,
  deleteYoutubeVideo,
  duplicateYoutubeVideo,
  updateYoutubeCategory,
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
  const [videos, editors] = await Promise.all([
    prisma.youtubeVideo.findMany({
      where: { deletedAt: null },
      include: {
        script: { select: { id: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.editor.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  const channel = await getConnectedChannel();
  const itemStats: Record<string, StatEntry[]> = {};
  let overview: StatEntry[] | null = null;

  if (channel) {
    const published = videos.filter((v) => v.status === "PUBLISHED" && extractYoutubeVideoId(v.url));
    const [, channelOverview] = await Promise.all([
      Promise.all(
        published.map(async (v) => {
          const ytId = extractYoutubeVideoId(v.url)!;
          const stats = await fetchVideoStats(ytId);
          if (stats) {
            itemStats[v.id] = [
              { label: "views", value: stats.views.toLocaleString() },
              { label: "minutes watched", value: Math.round(stats.estimatedMinutesWatched).toLocaleString() },
              { label: "likes", value: stats.likes.toLocaleString() },
              { label: "comments", value: stats.comments.toLocaleString() },
            ];
          }
        })
      ),
      fetchChannelOverview(),
    ]);
    if (channelOverview) {
      const net = channelOverview.subscribersGained - channelOverview.subscribersLost;
      overview = [
        { label: "views", value: channelOverview.views.toLocaleString() },
        { label: "minutes watched", value: Math.round(channelOverview.estimatedMinutesWatched).toLocaleString() },
        { label: "likes", value: channelOverview.likes.toLocaleString() },
        { label: "comments", value: channelOverview.comments.toLocaleString() },
        { label: "net subscribers", value: `${net >= 0 ? "+" : ""}${net.toLocaleString()}` },
      ];
    }
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
      onDuplicate={duplicateYoutubeVideo}
      onStatusChange={updateYoutubeStatus}
      onCategoryChange={updateYoutubeCategory}
      connectPlatformLabel="YouTube Studio"
      connectedAccount={channel ? { title: channel.channelTitle } : null}
      connectUrl={buildAuthUrl()}
      onDisconnect={disconnectYoutubeChannel}
      itemStats={itemStats}
      editorOptions={editors.map((e) => e.name)}
      overviewTitle="Channel overview — last 30 days"
      overview={overview}
      connectNotice={youtube_connected ? "connected" : youtube_error ? `error:${youtube_error}` : undefined}
    />
  );
}
