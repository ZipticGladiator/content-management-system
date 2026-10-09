import { requireOrgSession } from "@/lib/org";
import AssetsView from "@/components/AssetsView";
import { createAsset, deleteAsset, updateAsset } from "@/app/assets/actions";
import type { AssetEntry, AssetItemOption } from "@/lib/assets";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const { session, db } = await requireOrgSession();
  const orgId = session.orgId;

  const [rows, videos, clips] = await Promise.all([
    db.asset.findMany({
      include: {
        youtubeVideo: { select: { id: true, title: true, deletedAt: true } },
        tiktokClip: { select: { id: true, title: true, deletedAt: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.youtubeVideo.findMany({ where: { deletedAt: null }, select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
    db.tiktokClip.findMany({ where: { deletedAt: null }, select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const assets: AssetEntry[] = rows.map((r) => {
    // An item sitting in Trash still counts as linked (it can be restored), but say so.
    const item = r.youtubeVideo
      ? { kind: "youtube" as const, id: r.youtubeVideo.id, title: r.youtubeVideo.title + (r.youtubeVideo.deletedAt ? " (in Trash)" : "") }
      : r.tiktokClip
        ? { kind: "tiktok" as const, id: r.tiktokClip.id, title: r.tiktokClip.title + (r.tiktokClip.deletedAt ? " (in Trash)" : "") }
        : null;
    return { id: r.id, title: r.title, url: r.url, type: r.type, notes: r.notes, item, createdAt: r.createdAt.toISOString() };
  });

  const itemOptions: AssetItemOption[] = [
    ...videos.map((v) => ({ kind: "youtube" as const, id: v.id, title: v.title })),
    ...clips.map((c) => ({ kind: "tiktok" as const, id: c.id, title: c.title })),
  ];

  return (
    <div className="wrap">
      <AssetsView
        assets={assets}
        itemOptions={itemOptions}
        onCreate={createAsset.bind(null, orgId)}
        onUpdate={updateAsset.bind(null, orgId)}
        onDelete={deleteAsset.bind(null, orgId)}
      />
    </div>
  );
}
