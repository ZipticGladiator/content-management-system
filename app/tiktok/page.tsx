import { prisma } from "@/lib/prisma";
import { mapTiktokClip } from "@/lib/mappers";
import { TIKTOK_STAGES } from "@/lib/pipeline";
import PipelineBoard from "@/components/PipelineBoard";
import TikTokIcon from "@/components/icons/TikTokIcon";
import {
  createTiktokClip,
  deleteTiktokClip,
  updateTiktokClip,
  updateTiktokStatus,
} from "@/app/tiktok/actions";

export const dynamic = "force-dynamic";

export default async function TiktokPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const { open } = await searchParams;
  const clips = await prisma.tiktokClip.findMany({
    include: { script: { select: { id: true } }, _count: { select: { comments: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <PipelineBoard
      kind="tiktok"
      title="TikTok pipeline"
      subtitle="Siya | Cybersecurity — short-form clips, idea to posted"
      icon={<TikTokIcon size={36} />}
      initialOpenId={open}
      items={clips.map(mapTiktokClip)}
      stages={TIKTOK_STAGES}
      showTopPick={false}
      onCreate={createTiktokClip}
      onUpdate={updateTiktokClip}
      onDelete={deleteTiktokClip}
      onStatusChange={updateTiktokStatus}
    />
  );
}
