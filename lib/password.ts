import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Deliberately kept separate from lib/auth.ts, which proxy.ts (Next.js
// middleware, Edge runtime) imports — node:crypto's scrypt isn't available
// there. Only server actions (Node runtime) should import this file.

const SCRYPT_KEYLEN = 64;

/** Hashes a password as "saltHex:hashHex" using scrypt (Node's built-in crypto, no extra dependency). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => (err ? reject(err) : resolve(derivedKey)));
  });
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => (err ? reject(err) : resolve(derivedKey)));
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
