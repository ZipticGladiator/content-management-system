import { prisma } from "@/lib/prisma";
import { mapTiktokClip } from "@/lib/mappers";
import { TIKTOK_STAGES } from "@/lib/pipeline";
import PipelineBoard from "@/components/PipelineBoard";
import TikTokIcon from "@/components/icons/TikTokIcon";
import { buildAuthUrl, getConnectedAccount } from "@/lib/tiktok-oauth";
import { extractTiktokVideoId, fetchAccountOverview, fetchClipStats } from "@/lib/tiktok-analytics";
import { disconnectTiktokAccount } from "@/app/tiktok/tiktok-auth-actions";
import type { StatEntry } from "@/lib/types";
import {
  createTiktokClip,
  deleteTiktokClip,
  duplicateTiktokClip,
  updateTiktokClip,
  updateTiktokStatus,
} from "@/app/tiktok/actions";

export const dynamic = "force-dynamic";

export default async function TiktokPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string; tiktok_connected?: string; tiktok_error?: string }>;
}) {
  const { open, tiktok_connected, tiktok_error } = await searchParams;
  const [clips, editors] = await Promise.all([
    prisma.tiktokClip.findMany({
      where: { deletedAt: null },
      include: {
        script: { select: { id: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.editor.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  const account = await getConnectedAccount();
  const itemStats: Record<string, StatEntry[]> = {};
  let overview: StatEntry[] | null = null;

  if (account) {
    const posted = clips.filter((c) => c.status === "POSTED" && extractTiktokVideoId(c.url));
    const [, accountOverview] = await Promise.all([
      Promise.all(
        posted.map(async (c) => {
          const clipId = extractTiktokVideoId(c.url)!;
          const stats = await fetchClipStats(clipId);
          if (stats) {
            itemStats[c.id] = [
              { label: "views", value: stats.views.toLocaleString() },
              { label: "likes", value: stats.likes.toLocaleString() },
              { label: "comments", value: stats.comments.toLocaleString() },
              { label: "shares", value: stats.shares.toLocaleString() },
            ];
          }
        })
      ),
      fetchAccountOverview(),
    ]);
    if (accountOverview) {
      overview = [
        { label: "followers", value: accountOverview.followerCount.toLocaleString() },
        { label: "total likes", value: accountOverview.likesCount.toLocaleString() },
        { label: "videos posted", value: accountOverview.videoCount.toLocaleString() },
      ];
    }
  }

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
      showCostAndEditor
      onCreate={createTiktokClip}
      onUpdate={updateTiktokClip}
      onDelete={deleteTiktokClip}
      onDuplicate={duplicateTiktokClip}
      onStatusChange={updateTiktokStatus}
      connectPlatformLabel="TikTok"
      connectedAccount={account ? { title: account.displayName } : null}
      connectUrl={buildAuthUrl()}
      onDisconnect={disconnectTiktokAccount}
      itemStats={itemStats}
      editorOptions={editors.map((e) => e.name)}
      overviewTitle="Account overview (current totals)"
      overview={overview}
      connectNotice={tiktok_connected ? "connected" : tiktok_error ? `error:${tiktok_error}` : undefined}
    />
  );
}
