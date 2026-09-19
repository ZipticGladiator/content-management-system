import { prisma } from "@/lib/prisma";
import { createScriptForClip, createScriptForVideo } from "@/app/scripts/actions";
import ScriptsList, { type ScriptRow } from "@/components/ScriptsList";

export const dynamic = "force-dynamic";

export default async function ScriptsPage() {
  const [scripts, videosWithoutScript, clipsWithoutScript] = await Promise.all([
    prisma.script.findMany({
      where: {
        OR: [{ youtubeVideo: { deletedAt: null } }, { tiktokClip: { deletedAt: null } }],
      },
      select: {
        id: true,
        body: true,
        status: true,
        updatedAt: true,
        youtubeVideo: { select: { id: true, title: true } },
        tiktokClip: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.youtubeVideo.findMany({
      where: { script: null, deletedAt: null },
      select: { id: true, title: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tiktokClip.findMany({
      where: { script: null, deletedAt: null },
      select: { id: true, title: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const scriptRows: ScriptRow[] = scripts.map((s) => ({
    id: s.id,
    title: s.youtubeVideo?.title ?? s.tiktokClip?.title ?? "Untitled",
    platform: s.youtubeVideo ? "YouTube" : "TikTok",
    status: s.status,
    updatedAt: s.updatedAt.toISOString(),
    body: s.body,
  }));

  return (
    <div className="wrap">
      <header className="page-header">
        <div>
          <h1>Scripts</h1>
          <p className="sub">Draft and revise scripts for YouTube videos and TikTok clips</p>
        </div>
      </header>

      <div className="bar" style={{ marginTop: 26 }}>
        <form action={createScriptForVideo} style={{ display: "flex", gap: 8 }}>
          <select name="youtubeVideoId" aria-label="Pick a YouTube video" required defaultValue="">
            <option value="" disabled>
              New script for a YouTube video…
            </option>
            {videosWithoutScript.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>
          <button className="btn primary" type="submit" disabled={!videosWithoutScript.length}>
            Start
          </button>
        </form>
        <form action={createScriptForClip} style={{ display: "flex", gap: 8 }}>
          <select name="tiktokClipId" aria-label="Pick a TikTok clip" required defaultValue="">
            <option value="" disabled>
              New script for a TikTok clip…
            </option>
            {clipsWithoutScript.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <button className="btn primary" type="submit" disabled={!clipsWithoutScript.length}>
            Start
          </button>
        </form>
      </div>

      <ScriptsList scripts={scriptRows} />
    </div>
  );
}
