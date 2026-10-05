import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_KEYS, TIKTOK_STAGES, YOUTUBE_STAGES, YOUTUBE_STEPS } from "@/lib/pipeline";
import type { ItemKind, PipelineItemInput } from "@/lib/types";
import { PLATFORM_KEYS, TYPE_KEYS } from "@/lib/inspiration";
import type { InspirationInput } from "@/app/inspiration/actions";
import type { AssetInput } from "@/app/assets/actions";
import { ASSET_TYPE_KEYS } from "@/lib/assets";
import {
  createYoutubeVideo,
  deleteYoutubeVideo,
  duplicateYoutubeVideo,
  updateYoutubeCategory,
  updateYoutubeStatus,
  updateYoutubeVideo,
} from "@/app/youtube/actions";
import {
  createTiktokClip,
  deleteTiktokClip,
  duplicateTiktokClip,
  updateTiktokCategory,
  updateTiktokStatus,
  updateTiktokClip,
} from "@/app/tiktok/actions";

// REST layer for the Expo mobile app (cms-app). Native clients can't use
// server actions or the httpOnly session cookie, so they send the same signed
// session token as `Authorization: Bearer <token>` instead. proxy.ts skips
// /api/mobile — every route here must call requireUser() itself.

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUser(req: NextRequest): Promise<SessionPayload> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : undefined;
  const user = await verifySessionToken(token);
  if (!user) throw new ApiError(401, "Unauthorized");
  return user;
}

/** Wraps a handler so thrown ApiErrors (and anything unexpected) become JSON error responses. */
export function handle<C>(fn: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status });
      // Prisma: P2025 = record to update/delete not found, P2003 = foreign key points at a missing row.
      const code = (err as { code?: unknown } | null)?.code;
      if (code === "P2025" || code === "P2003") return NextResponse.json({ error: "Not found" }, { status: 404 });
      console.error("[mobile-api]", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export function parseKind(value: string): ItemKind {
  if (value === "youtube" || value === "tiktok") return value;
  throw new ApiError(404, "Unknown item kind");
}

/** 404s unless the video/clip exists and isn't in Trash — check before side effects like storage uploads. */
export async function assertItem(kind: ItemKind, id: string): Promise<void> {
  const where = { id, deletedAt: null };
  const found =
    kind === "youtube"
      ? await prisma.youtubeVideo.findFirst({ where, select: { id: true } })
      : await prisma.tiktokClip.findFirst({ where, select: { id: true } });
  if (!found) throw new ApiError(404, "Item not found");
}

export async function readJson<T = Record<string, unknown>>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}

function stagesFor(kind: ItemKind) {
  return kind === "youtube" ? YOUTUBE_STAGES : TIKTOK_STAGES;
}

export function assertStatus(kind: ItemKind, status: unknown): string {
  if (typeof status === "string" && stagesFor(kind).some((s) => s[0] === status)) return status;
  throw new ApiError(400, "Invalid status");
}

export function assertCategory(category: unknown): string {
  if (typeof category === "string" && (CATEGORY_KEYS as string[]).includes(category)) return category;
  throw new ApiError(400, "Invalid category");
}

/** Normalizes an untrusted JSON body into the same shape the web board's dialogs submit. */
export function parseItemInput(kind: ItemKind, body: Record<string, unknown>): PipelineItemInput {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) throw new ApiError(400, "Title is required");
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const dueDate = typeof body.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate) ? body.dueDate : null;
  const rawSteps = (body.steps ?? {}) as Record<string, unknown>;
  const steps: Record<string, boolean> = {};
  for (const [key] of YOUTUBE_STEPS) steps[key] = rawSteps[key] === true;

  return {
    title,
    pitch: str(body.pitch),
    category: assertCategory(body.category ?? "EDUCATIONAL") as PipelineItemInput["category"],
    status: assertStatus(kind, body.status ?? "IDEA"),
    dueDate,
    cost: Math.max(0, Math.round(Number(body.cost) || 0)),
    paid: body.paid === true,
    editor: str(body.editor),
    url: str(body.url),
    topPick: kind === "youtube" && body.topPick === true,
    notes: str(body.notes),
    steps: kind === "youtube" ? steps : undefined,
  };
}

/** The web app's existing server actions, reused so the mobile API shares their side effects (activity log, revalidation). */
export const ITEM_ACTIONS = {
  youtube: {
    create: createYoutubeVideo,
    update: updateYoutubeVideo,
    remove: deleteYoutubeVideo,
    duplicate: duplicateYoutubeVideo,
    setStatus: updateYoutubeStatus,
    setCategory: updateYoutubeCategory,
  },
  tiktok: {
    create: createTiktokClip,
    update: updateTiktokClip,
    remove: deleteTiktokClip,
    duplicate: duplicateTiktokClip,
    setStatus: updateTiktokStatus,
    setCategory: updateTiktokCategory,
  },
} as const;

export function parseInspirationInput(body: Record<string, unknown>): InspirationInput {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) throw new ApiError(400, "Name is required");
  if (!(PLATFORM_KEYS as unknown[]).includes(body.platform)) throw new ApiError(400, "Invalid platform");
  if (!(TYPE_KEYS as unknown[]).includes(body.type)) throw new ApiError(400, "Invalid type");
  return {
    name,
    platform: body.platform as InspirationInput["platform"],
    type: body.type as InspirationInput["type"],
    url: typeof body.url === "string" ? body.url.trim() : "",
    followers: Math.max(0, Math.round(Number(body.followers) || 0)),
    description: typeof body.description === "string" ? body.description : "",
  };
}

/** Validates an asset body up front so bad links get a 400 with a reason, not a 500 from the action. */
export function parseAssetInput(body: Record<string, unknown>): AssetInput {
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!/^https?:\/\//i.test(url)) throw new ApiError(400, "Link must start with http:// or https://");
  try {
    new URL(url);
  } catch {
    throw new ApiError(400, "That doesn't look like a valid link");
  }
  const rawItem = body.item as { kind?: unknown; id?: unknown } | null | undefined;
  const item =
    rawItem && (rawItem.kind === "youtube" || rawItem.kind === "tiktok") && typeof rawItem.id === "string" && rawItem.id
      ? { kind: rawItem.kind as ItemKind, id: rawItem.id }
      : null;
  return {
    title: typeof body.title === "string" ? body.title : "",
    url,
    type: (ASSET_TYPE_KEYS as unknown[]).includes(body.type) ? (body.type as string) : "OTHER",
    notes: typeof body.notes === "string" ? body.notes : "",
    item,
  };
}
