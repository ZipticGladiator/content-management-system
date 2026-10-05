"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { AssetType } from "@/app/generated/prisma/client";
import { ASSET_TYPE_KEYS } from "@/lib/assets";
import type { ItemKind } from "@/lib/types";

export type AssetInput = {
  title: string;
  url: string;
  type: string;
  notes: string;
  item: { kind: ItemKind; id: string } | null;
};

function toData(data: AssetInput) {
  const url = data.url.trim();
  // Links only: refuses javascript: and other non-web schemes, since the URL is rendered as an <a href>.
  if (!/^https?:\/\//i.test(url)) throw new Error("Link must start with http:// or https://");
  try {
    new URL(url);
  } catch {
    throw new Error("That doesn't look like a valid link");
  }
  const type = (ASSET_TYPE_KEYS as string[]).includes(data.type) ? (data.type as AssetType) : AssetType.OTHER;
  return {
    title: data.title.trim() || "Untitled asset",
    url,
    type,
    notes: data.notes.trim(),
    youtubeVideoId: data.item?.kind === "youtube" ? data.item.id : null,
    tiktokClipId: data.item?.kind === "tiktok" ? data.item.id : null,
  };
}

export async function createAsset(data: AssetInput) {
  await prisma.asset.create({ data: toData(data) });
  revalidatePath("/assets");
}

export async function updateAsset(id: string, data: AssetInput) {
  await prisma.asset.update({ where: { id }, data: toData(data) });
  revalidatePath("/assets");
}

/** Removes the CMS entry only — the file on Google Drive is untouched. */
export async function deleteAsset(id: string) {
  await prisma.asset.delete({ where: { id } });
  revalidatePath("/assets");
}
