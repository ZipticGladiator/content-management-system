import "server-only";

const encoder = new TextEncoder();

export const SESSION_COOKIE = "cms_session";
const SESSION_DAYS = 30;

export type SessionPayload = {
  uid: string;
  email: string;
  name: string;
  role: "OWNER" | "EDITOR";
  exp: number;
};

function base64url(input: Uint8Array): string {
  return Buffer.from(input).toString("base64url");
}

function base64urlToUint8Array(input: string): Uint8Array {
  return new Uint8Array(Buffer.from(input, "base64url"));
}

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(user: { id: string; email: string; name: string; role: "OWNER" | "EDITOR" }): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const payload: SessionPayload = {
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  const payloadB64 = base64url(encoder.encode(JSON.stringify(payload)));
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  return `${payloadB64}.${base64url(new Uint8Array(sig))}`;
}

/** Verifies the session cookie and returns the signed-in user's identity, or null. */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const key = await getKey(secret);
  const expectedSig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  if (base64url(new Uint8Array(expectedSig)) !== sig) return null;

  try {
    const payload: SessionPayload = JSON.parse(new TextDecoder().decode(base64urlToUint8Array(payloadB64)));
    if (!Number.isFinite(payload.exp) || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

