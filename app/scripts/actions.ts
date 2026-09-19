"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ScriptStatus } from "@/app/generated/prisma/client";

export async function createScriptForVideo(formData: FormData) {
  const youtubeVideoId = String(formData.get("youtubeVideoId") || "");
  if (!youtubeVideoId) return;
  const script = await prisma.script.create({ data: { youtubeVideoId } });
  redirect(`/scripts/${script.id}`);
}

export async function createScriptForClip(formData: FormData) {
  const tiktokClipId = String(formData.get("tiktokClipId") || "");
  if (!tiktokClipId) return;
  const script = await prisma.script.create({ data: { tiktokClipId } });
  redirect(`/scripts/${script.id}`);
}

export async function updateScript(id: string, body: string, status: ScriptStatus) {
  await prisma.script.update({ where: { id }, data: { body, status } });
  revalidatePath("/scripts");
  revalidatePath(`/scripts/${id}`);
}

export async function deleteScript(id: string) {
  await prisma.script.delete({ where: { id } });
  revalidatePath("/scripts");
  redirect("/scripts");
}
