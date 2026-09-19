import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RETENTION_DAYS = 30;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000);

  const [videos, clips] = await Promise.all([
    prisma.youtubeVideo.deleteMany({ where: { deletedAt: { lt: cutoff } } }),
    prisma.tiktokClip.deleteMany({ where: { deletedAt: { lt: cutoff } } }),
  ]);

  return NextResponse.json({ purgedVideos: videos.count, purgedClips: clips.count });
}
