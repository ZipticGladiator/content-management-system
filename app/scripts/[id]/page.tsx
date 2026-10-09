import { notFound } from "next/navigation";
import { requireOrgSession } from "@/lib/org";
import ScriptEditor from "@/components/ScriptEditor";
import { deleteScript, generateScriptDraftForScript, updateScript } from "@/app/scripts/actions";

export const dynamic = "force-dynamic";

export default async function ScriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { session, db } = await requireOrgSession();
  const orgId = session.orgId;

  const script = await db.script.findUnique({
    where: { id },
    include: {
      youtubeVideo: { select: { title: true } },
      tiktokClip: { select: { title: true } },
    },
  });

  if (!script) notFound();

  const platform = script.youtubeVideo ? "YouTube" : "TikTok";
  const parentTitle = script.youtubeVideo?.title ?? script.tiktokClip?.title ?? "Untitled";

  return (
    <ScriptEditor
      id={script.id}
      parentTitle={parentTitle}
      platform={platform}
      initialBody={script.body}
      initialStatus={script.status}
      onSave={updateScript.bind(null, orgId)}
      onDelete={deleteScript.bind(null, orgId)}
      onGenerateDraft={generateScriptDraftForScript.bind(null, orgId)}
    />
  );
}
