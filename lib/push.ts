import "server-only";
import { prisma } from "@/lib/prisma";
import type { ItemKind } from "@/lib/types";

// Push notifications to the mobile app, via Expo's push service
// (https://docs.expo.dev/push-notifications/sending-notifications/). Devices
// register their Expo push token through /api/mobile/push. Sending never
// throws: a failed push must not break the action that triggered it.

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100; // Expo's per-request limit
const TOKEN_RE = /^Expo(nent)?PushToken\[[^\]]+\]$/;

export type PushData = { kind: ItemKind; itemId: string } | { screen: "notifications" };

type PushMessage = { to: string; title: string; body: string; data: PushData; sound: "default" };
type PushTicket = { status: "ok" | "error"; details?: { error?: string } };

export function isExpoPushToken(token: string): boolean {
  return TOKEN_RE.test(token);
}

async function send(messages: PushMessage[]): Promise<void> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
  };
  // Optional: only needed if "enhanced push security" is turned on for the Expo project.
  if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch(EXPO_PUSH_URL, { method: "POST", headers, body: JSON.stringify(batch) });
      if (!res.ok) {
        console.error("[push] Expo push API returned", res.status, await res.text().catch(() => ""));
        continue;
      }
      const { data } = (await res.json()) as { data?: PushTicket[] };
      // Tickets come back in message order. Forget devices that uninstalled the app or revoked permission.
      const dead = (data ?? [])
        .map((ticket, j) => (ticket.details?.error === "DeviceNotRegistered" ? batch[j].to : null))
        .filter((t): t is string => !!t);
      if (dead.length) await prisma.pushDevice.deleteMany({ where: { token: { in: dead } } });
    } catch (err) {
      console.error("[push] send failed", err);
    }
  }
}

/** Sends one notification to every registered device, optionally skipping one user's (e.g. the comment's author). */
export async function notifyAll(
  { title, body, data }: { title: string; body: string; data: PushData },
  { excludeUserId }: { excludeUserId?: string } = {}
): Promise<void> {
  try {
    const devices = await prisma.pushDevice.findMany({
      where: excludeUserId ? { userId: { not: excludeUserId } } : {},
      select: { token: true },
    });
    if (!devices.length) return;
    await send(devices.map((d) => ({ to: d.token, title, body, data, sound: "default" })));
  } catch (err) {
    console.error("[push] notifyAll failed", err);
  }
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/** "New comment" push to everyone except the author. */
export async function notifyNewComment(opts: {
  kind: ItemKind;
  itemId: string;
  author: string;
  body: string;
  authorUserId?: string;
}): Promise<void> {
  try {
    const item =
      opts.kind === "youtube"
        ? await prisma.youtubeVideo.findUnique({ where: { id: opts.itemId }, select: { title: true } })
        : await prisma.tiktokClip.findUnique({ where: { id: opts.itemId }, select: { title: true } });
    await notifyAll(
      {
        title: truncate(item?.title ?? "New comment", 60),
        body: truncate(`${opts.author}: ${opts.body}`, 180),
        data: { kind: opts.kind, itemId: opts.itemId },
      },
      { excludeUserId: opts.authorUserId }
    );
  } catch (err) {
    console.error("[push] notifyNewComment failed", err);
  }
}
