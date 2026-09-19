import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";
import { createScriptForClip, createScriptForVideo } from "@/app/scripts/actions";

export const dynamic = "force-dynamic";

export default async function ScriptsPage() {
  const [scripts, videosWithoutScript, clipsWithoutScript] = await Promise.all([
    prisma.script.findMany({
      include: {
        youtubeVideo: { select: { id: true, title: true } },
        tiktokClip: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.youtubeVideo.findMany({
      where: { script: null },
      select: { id: true, title: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tiktokClip.findMany({
      where: { script: null },
      select: { id: true, title: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

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

      {scripts.length ? (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {scripts.map((s) => {
                const platform = s.youtubeVideo ? "YouTube" : "TikTok";
                const parentTitle = s.youtubeVideo?.title ?? s.tiktokClip?.title ?? "Untitled";
                return (
                  <tr key={s.id}>
                    <td>
                      <Link className="linkish" href={`/scripts/${s.id}`}>
                        {parentTitle}
                      </Link>
                    </td>
                    <td className="cat">{platform}</td>
                    <td className="cat">{s.status === "FINAL" ? "Final" : "Draft"}</td>
                    <td className="cat">{fmtDate(s.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="tablewrap">
          <div className="empty">No scripts yet. Start one from a video or clip above.</div>
        </div>
      )}
    </div>
  );
}
