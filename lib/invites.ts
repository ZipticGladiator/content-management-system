import "server-only";
import { randomBytes } from "node:crypto";

export const INVITE_EXPIRY_DAYS = 7;

/** URL-safe, unguessable invite token. */
export function generateInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export function inviteExpiry(): Date {
  return new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

/** The three categories every new workspace starts with — same as Hacking Hub's, renameable afterward. */
export const DEFAULT_CATEGORIES = [
  { key: "EDUCATIONAL", label: "Educational", order: 0 },
  { key: "TECHNICAL", label: "Technical", order: 1 },
  { key: "LIFESTYLE", label: "Lifestyle", order: 2 },
] as const;
