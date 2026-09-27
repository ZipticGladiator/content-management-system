import { NextResponse, type NextRequest } from "next/server";
import { deleteAttachment, getAttachments, uploadAttachment } from "@/app/attachments/actions";
import { ApiError, handle, parseKind, requireUser } from "@/lib/mobile-api";

type Ctx = RouteContext<"/api/mobile/items/[kind]/[id]/attachments">;

export const GET = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { kind, id } = await ctx.params;
  return NextResponse.json({ attachments: await getAttachments(parseKind(kind), id) });
});

/** multipart/form-data with `file` and optional `label`, same fields as the web uploader. */
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { kind, id } = await ctx.params;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, "Expected multipart form data");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw new ApiError(400, "No file provided");
  const attachment = await uploadAttachment(parseKind(kind), id, form);
  return NextResponse.json({ attachment }, { status: 201 });
});

/** DELETE ?attachmentId=… */
export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { kind } = await ctx.params;
  const attachmentId = req.nextUrl.searchParams.get("attachmentId");
  if (!attachmentId) throw new ApiError(400, "attachmentId is required");
  await deleteAttachment(parseKind(kind), attachmentId);
  return NextResponse.json({ ok: true });
});
