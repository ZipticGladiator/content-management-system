import type { ItemKind } from "@/lib/types";

export const ASSET_TYPE_LABELS = {
  THUMBNAIL: "Thumbnail",
  DOCUMENT: "Document",
  VIDEO: "Video",
  IMAGE: "Image",
  AUDIO: "Audio",
  OTHER: "Other",
} as const;

export type AssetTypeKey = keyof typeof ASSET_TYPE_LABELS;
export const ASSET_TYPE_KEYS = Object.keys(ASSET_TYPE_LABELS) as AssetTypeKey[];

export type AssetEntry = {
  id: string;
  title: string;
  url: string;
  type: AssetTypeKey;
  notes: string;
  item: { kind: ItemKind; id: string; title: string } | null;
  createdAt: string;
};

/** A video/clip an asset can be linked to, for the dialog's picker. */
export type AssetItemOption = { kind: ItemKind; id: string; title: string };

export type DriveLink = { id: string; kind: "file" | "folder" | "doc" | "sheet" | "slides" };

/**
 * Recognises the usual Google Drive / Docs share links:
 * drive.google.com/file/d/ID/…, …/open?id=ID, …/drive/folders/ID,
 * docs.google.com/{document,spreadsheets,presentation}/d/ID/…
 */
export function parseDriveLink(url: string): DriveLink | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  const path = u.pathname;
  if (host === "docs.google.com") {
    const m = path.match(/^\/(document|spreadsheets|presentation)\/d\/([\w-]+)/);
    if (!m) return null;
    const kind = m[1] === "document" ? "doc" : m[1] === "spreadsheets" ? "sheet" : "slides";
    return { id: m[2], kind };
  }
  if (host === "drive.google.com") {
    const folder = path.match(/\/folders\/([\w-]+)/);
    if (folder) return { id: folder[1], kind: "folder" };
    const file = path.match(/\/file\/d\/([\w-]+)/);
    if (file) return { id: file[1], kind: "file" };
    const id = u.searchParams.get("id");
    if (id && /^[\w-]+$/.test(id)) return { id, kind: "file" };
  }
  return null;
}

/**
 * Preview image for a Drive file. Only loads when the file is shared
 * "Anyone with the link"; private files fail and the card shows an icon.
 */
export function driveThumbnailUrl(link: DriveLink | null): string | null {
  if (!link || link.kind === "folder") return null;
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(link.id)}&sz=w640`;
}

/** Best guess at the type from the link, used to pre-fill new assets. */
export function guessAssetType(url: string): AssetTypeKey | null {
  const drive = parseDriveLink(url);
  if (drive && ["doc", "sheet", "slides"].includes(drive.kind)) return "DOCUMENT";
  const ext = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "webp", "gif", "heic"].includes(ext)) return "IMAGE";
  if (["mp4", "mov", "mkv", "webm"].includes(ext)) return "VIDEO";
  if (["mp3", "wav", "m4a", "aac"].includes(ext)) return "AUDIO";
  if (["pdf", "docx", "txt", "md"].includes(ext)) return "DOCUMENT";
  return null;
}
