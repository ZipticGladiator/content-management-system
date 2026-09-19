import { prisma } from "@/lib/prisma";
import { mapYoutubeVideo } from "@/lib/mappers";
import { YOUTUBE_STAGES, YOUTUBE_STEPS } from "@/lib/pipeline";
import PipelineBoard from "@/components/PipelineBoard";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
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
  searchParams: Promise<{ open?: string }>;
}) {
  const { open } = await searchParams;
  const videos = await prisma.youtubeVideo.findMany({
    include: { script: { select: { id: true } }, _count: { select: { comments: true } } },
    orderBy: { createdAt: "asc" },
  });

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
    />
  );
}
