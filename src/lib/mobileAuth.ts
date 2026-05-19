// lib/mobileAuth.ts
//
// Mobile auth path: standard signed JWT (HS256) used by the React Native
// app for Authorization: Bearer headers. Verified server-side without
// depending on NextAuth session cookies.
//
// Web (browser) auth is unchanged — NextAuth session cookies still work
// for everything that uses `getServerSession(authOptions)`.

import crypto from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const ALG = "HS256";
const JWT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) {
    throw new Error(
      "NEXTAUTH_SECRET is not set — mobile JWT signing/verification needs it.",
    );
  }
  return s;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

function hmac(input: string): string {
  return b64url(crypto.createHmac("sha256", getSecret()).update(input).digest());
}

// Constant-time string compare to defuse timing attacks on the signature.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export interface MobileJwtPayload {
  sub: string; // userId (Mongo ObjectId as string)
  email: string;
  iat: number;
  exp: number;
}

// ── OAuth state token ────────────────────────────────────────────────────
// Short-lived signed envelope that carries the mobile app's `returnTo` deep
// link through Google's OAuth round-trip. Same HMAC scheme as the user JWT
// but with a tighter expiry and no PII.

const STATE_TTL_SECONDS = 60 * 10; // 10 minutes

// Allowed return-URL schemes. We refuse anything else so the OAuth callback
// can't be tricked into redirecting users to arbitrary URLs (open-redirect).
const ALLOWED_RETURN_SCHEMES = [
  "exp://", // Expo Go
  "exp+money-nest://", // Expo Dev Client
  "moneynest://", // Standalone / production builds
];

export function isAllowedReturnUrl(url: string): boolean {
  return ALLOWED_RETURN_SCHEMES.some((s) => url.startsWith(s));
}

export interface MobileStatePayload {
  returnTo: string;
  nonce: string;
  iat: number;
  exp: number;
}

export function signMobileState(input: { returnTo: string }): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: MobileStatePayload = {
    returnTo: input.returnTo,
    nonce: crypto.randomBytes(16).toString("hex"),
    iat: now,
    exp: now + STATE_TTL_SECONDS,
  };
  const header = b64url(JSON.stringify({ alg: ALG, typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const sig = hmac(`${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

export function verifyMobileState(token: string): MobileStatePayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, b, s] = parts;
  if (!safeEqual(s, hmac(`${h}.${b}`))) return null;
  try {
    const payload = JSON.parse(b64urlDecode(b).toString("utf-8")) as MobileStatePayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    if (typeof payload.returnTo !== "string" || !isAllowedReturnUrl(payload.returnTo)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function signMobileJwt(payload: { sub: string; email: string }): string {
  const now = Math.floor(Date.now() / 1000);
  const full: MobileJwtPayload = {
    sub: payload.sub,
    email: payload.email,
    iat: now,
    exp: now + JWT_TTL_SECONDS,
  };
  const header = b64url(JSON.stringify({ alg: ALG, typ: "JWT" }));
  const body = b64url(JSON.stringify(full));
  const sig = hmac(`${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

export function verifyMobileJwt(token: string): MobileJwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, b, s] = parts;
  if (!safeEqual(s, hmac(`${h}.${b}`))) return null;
  try {
    const payload = JSON.parse(b64urlDecode(b).toString("utf-8")) as MobileJwtPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Google ID token verification ─────────────────────────────────────────
// Uses Google's tokeninfo endpoint. Avoids a heavyweight google-auth-library
// dep at the cost of one extra HTTPS round-trip per sign-in (acceptable —
// sign-in happens rarely).

interface GoogleTokenInfo {
  // selected fields — the endpoint returns more
  sub: string;
  email: string;
  email_verified: string | boolean;
  name?: string;
  picture?: string;
  aud: string;
  exp: string | number;
  error_description?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<{
  sub: string;
  email: string;
  name?: string;
  picture?: string;
} | null> {
  const expectedAud = process.env.GOOGLE_CLIENT_ID;
  if (!expectedAud) {
    throw new Error("GOOGLE_CLIENT_ID is not set.");
  }

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );
  if (!res.ok) return null;
  const info = (await res.json()) as GoogleTokenInfo;
  if (info.error_description) return null;
  if (info.aud !== expectedAud) return null;
  const verified =
    info.email_verified === true || info.email_verified === "true";
  if (!verified) return null;
  if (typeof info.exp !== "undefined") {
    const exp = typeof info.exp === "string" ? parseInt(info.exp, 10) : info.exp;
    if (exp * 1000 < Date.now()) return null;
  }
  return {
    sub: info.sub,
    email: info.email,
    name: info.name,
    picture: info.picture,
  };
}

// ── Unified user-id resolver ─────────────────────────────────────────────
// Routes that need to support BOTH web (NextAuth session cookies) AND
// mobile (Bearer JWT) call this instead of `getServerSession(authOptions)`.

export async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    const payload = verifyMobileJwt(token);
    if (payload) return payload.sub;
  }
  const session = await getServerSession(authOptions);
  return (session?.user?._id as string | undefined) ?? null;
}
