"use server";

import { revalidatePath } from "next/cache";
import { disconnectTiktok } from "@/lib/tiktok-oauth";

export async function disconnectTiktokAccount(orgId: string) {
  await disconnectTiktok(orgId);
  revalidatePath("/tiktok");
}
