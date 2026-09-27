import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { deleteComment, getComments } from "@/app/comments/actions";
import { ApiError, assertItem, handle, parseKind, readJson, requireUser } from "@/lib/mobile-api";

type Ctx = RouteContext<"/api/mobile/items/[kind]/[id]/comments">;

export const GET = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { kind, id } = await ctx.params;
  return NextResponse.json({ comments: await getComments(parseKind(kind), id) });
});

// Not reusing addComment(): it reads the author from the session cookie,
// which mobile requests don't carry — the author comes from the bearer token.
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireUser(req);
  const { kind: rawKind, id } = await ctx.params;
  const kind = parseKind(rawKind);
  const { body } = await readJson<{ body?: unknown }>(req);
  const clean = typeof body === "string" ? body.trim() : "";
  if (!clean) throw new ApiError(400, "Comment can't be empty");
  await assertItem(kind, id);

  const row = await prisma.comment.create({
    data: {
      ...(kind === "youtube" ? { youtubeVideoId: id } : { tiktokClipId: id }),
      author: user.name || "Anonymous",
      body: clean,
    },
  });
  revalidatePath(`/${kind}`);
  return NextResponse.json(
    {
      comment: {
        id: row.id,
        author: row.author,
        body: row.body,
        isSystem: row.isSystem,
        createdAt: row.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
});

/** DELETE ?commentId=… */
export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { kind } = await ctx.params;
  const commentId = req.nextUrl.searchParams.get("commentId");
  if (!commentId) throw new ApiError(400, "commentId is required");
  await deleteComment(parseKind(kind), commentId);
  return NextResponse.json({ ok: true });
});
