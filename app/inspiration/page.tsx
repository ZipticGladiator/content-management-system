import { prisma } from "@/lib/prisma";
import InspirationGrid from "@/components/InspirationGrid";
import { createInspiration, deleteInspiration, updateInspiration } from "@/app/inspiration/actions";
import type { InspirationEntry } from "@/lib/inspiration";

export const dynamic = "force-dynamic";

export default async function InspirationPage() {
  const rows = await prisma.inspiration.findMany({ orderBy: { followers: "desc" } });
  const items: InspirationEntry[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    platform: r.platform,
    type: r.type,
    url: r.url,
    followers: r.followers,
    description: r.description,
  }));

  return (
    <InspirationGrid
      items={items}
      onCreate={createInspiration}
      onUpdate={updateInspiration}
      onDelete={deleteInspiration}
    />
  );
}
