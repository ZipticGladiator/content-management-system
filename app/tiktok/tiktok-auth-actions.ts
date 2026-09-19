"use server";

import { revalidatePath } from "next/cache";
import { disconnectTiktok } from "@/lib/tiktok-oauth";

export async function disconnectTiktokAccount() {
  await disconnectTiktok();
  revalidatePath("/tiktok");
}
