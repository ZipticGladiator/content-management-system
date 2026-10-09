import { mapTiktokClip } from "@/lib/mappers";
import { TIKTOK_STAGES } from "@/lib/pipeline";
import { requireOrgSession } from "@/lib/org";
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
  updateTiktokCategory,
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
  const { session, db } = await requireOrgSession();
  const orgId = session.orgId;

  const [clips, editors, categories] = await Promise.all([
    db.tiktokClip.findMany({
      where: { deletedAt: null },
      include: {
        script: { select: { id: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.editor.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { order: "asc" }, select: { key: true, label: true } }),
  ]);

  const account = await getConnectedAccount(orgId);
  const itemStats: Record<string, StatEntry[]> = {};
  let overview: StatEntry[] | null = null;

  if (account) {
    const posted = clips.filter((c) => c.status === "POSTED" && extractTiktokVideoId(c.url));
    const [, accountOverview] = await Promise.all([
      Promise.all(
        posted.map(async (c) => {
          const clipId = extractTiktokVideoId(c.url)!;
          const stats = await fetchClipStats(orgId, clipId);
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
      fetchAccountOverview(orgId),
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
      orgId={orgId}
      title="TikTok pipeline"
      subtitle="Short-form clips, idea to posted"
      icon={<TikTokIcon size={36} />}
      initialOpenId={open}
      items={clips.map(mapTiktokClip)}
      categories={categories}
      stages={TIKTOK_STAGES}
      showTopPick={false}
      showCostAndEditor
      onCreate={createTiktokClip.bind(null, orgId)}
      onUpdate={updateTiktokClip.bind(null, orgId)}
      onDelete={deleteTiktokClip.bind(null, orgId)}
      onDuplicate={duplicateTiktokClip.bind(null, orgId)}
      onStatusChange={updateTiktokStatus.bind(null, orgId)}
      onCategoryChange={updateTiktokCategory.bind(null, orgId)}
      connectPlatformLabel="TikTok"
      connectedAccount={account ? { title: account.displayName } : null}
      connectUrl={buildAuthUrl()}
      onDisconnect={disconnectTiktokAccount.bind(null, orgId)}
      itemStats={itemStats}
      editorOptions={editors.map((e) => e.name)}
      overviewTitle="Account overview (current totals)"
      overview={overview}
      connectNotice={tiktok_connected ? "connected" : tiktok_error ? `error:${tiktok_error}` : undefined}
    />
  );
}
