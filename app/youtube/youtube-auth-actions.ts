"use server";

import { revalidatePath } from "next/cache";
import { disconnectYoutube } from "@/lib/youtube-oauth";

export async function disconnectYoutubeChannel() {
  await disconnectYoutube();
  revalidatePath("/youtube");
}
