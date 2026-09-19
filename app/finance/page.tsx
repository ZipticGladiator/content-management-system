import { prisma } from "@/lib/prisma";
import FinanceView from "@/components/FinanceView";
import { createEditor, deleteEditor, updateEditor } from "@/app/finance/actions";
import type { EditorEntry, EditorSpend, FinanceSummary, PlatformSpend } from "@/lib/finance";

export const dynamic = "force-dynamic";

function emptyPlatform(): PlatformSpend {
  return { forecasted: 0, paid: 0, outstanding: 0, count: 0 };
}

export default async function FinancePage() {
  const [videos, clips, editorRows] = await Promise.all([
    prisma.youtubeVideo.findMany({ select: { cost: true, paid: true, editor: true } }),
    prisma.tiktokClip.findMany({ select: { cost: true, paid: true, editor: true } }),
    prisma.editor.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const youtube = emptyPlatform();
  const tiktok = emptyPlatform();
  const editorMap = new Map<string, EditorSpend>();

  function tally(platform: PlatformSpend, items: { cost: number; paid: boolean; editor: string }[]) {
    for (const item of items) {
      platform.count += 1;
      platform.forecasted += item.cost;
      if (item.paid) platform.paid += item.cost;

      const name = item.editor.trim();
      if (name) {
        const existing = editorMap.get(name) ?? { editor: name, forecasted: 0, paid: 0, outstanding: 0, count: 0 };
        existing.count += 1;
        existing.forecasted += item.cost;
        if (item.paid) existing.paid += item.cost;
        existing.outstanding = existing.forecasted - existing.paid;
        editorMap.set(name, existing);
      }
    }
    platform.outstanding = platform.forecasted - platform.paid;
  }

  tally(youtube, videos);
  tally(tiktok, clips);

  const summary: FinanceSummary = {
    totalForecasted: youtube.forecasted + tiktok.forecasted,
    totalPaid: youtube.paid + tiktok.paid,
    totalOutstanding: youtube.outstanding + tiktok.outstanding,
    youtube,
    tiktok,
    byEditor: [...editorMap.values()].sort((a, b) => b.forecasted - a.forecasted),
  };

  const editors: EditorEntry[] = editorRows.map((e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    rate: e.rate,
    rateUnit: e.rateUnit,
    bankName: e.bankName,
    accountHolder: e.accountHolder,
    accountNumber: e.accountNumber,
    branchCode: e.branchCode,
    notes: e.notes,
  }));

  return (
    <FinanceView summary={summary} editors={editors} onCreate={createEditor} onUpdate={updateEditor} onDelete={deleteEditor} />
  );
}
