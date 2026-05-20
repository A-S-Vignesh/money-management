// proxy.ts (Next 16 — formerly middleware.ts)
//
// Edge proxy that runs before /api/* and /dashboard/* requests. Three concerns:
//
//   1. Auth gate: any /dashboard/* request without a valid session is
//      redirected to /login?callbackUrl=<original-path>.
//
//   2. CSRF: state-changing requests (POST/PUT/PATCH/DELETE) must come from
//      our own origin. SameSite=Lax cookies (NextAuth default) already block
//      most cross-site form submits; this is belt-and-braces and also blocks
//      malicious fetches from other tabs.
//
//   3. Rate limiting: in-memory token bucket per user (or IP for anon
//      requests). Different limits for reads vs writes. /api/auth/* is
//      excluded — NextAuth has its own protections and we don't want to
//      lock users out of signing in.
//
// All rate-limit state lives in process memory (see lib/rateLimit.ts). For
// multi-instance deploys you'd swap the bucket store for Redis.
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkRateLimit } from "@/lib/rateLimit";

// Limits per minute. Generous for normal use, tight enough that a runaway
// client or a single attacker can't melt the DB.
const READ_LIMIT = { limit: 240, windowMs: 60_000 };
const WRITE_LIMIT = { limit: 60, windowMs: 60_000 };
const ANON_LIMIT = { limit: 30, windowMs: 60_000 };

const STATE_CHANGING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function clientIp(req: NextRequest): string {
  // Trust standard proxy headers in this priority order.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");
  if (!host) return false;

  // Build the set of acceptable origins. NEXTAUTH_URL is the source of truth
  // in prod; in dev we also accept the request's own host.
  const allowed = new Set<string>();
  const envUrl = process.env.NEXTAUTH_URL;
  if (envUrl) {
    try {
      allowed.add(new URL(envUrl).origin);
    } catch {
      /* ignore malformed env */
    }
  }
  // Local-dev convenience — accept matching host header
  allowed.add(`http://${host}`);
  allowed.add(`https://${host}`);

  if (origin) return allowed.has(origin);
  if (referer) {
    try {
      return allowed.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }
  // No Origin or Referer header on a state-changing request → suspicious.
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  // Identify the user once — used by both the dashboard auth gate and the
  // rate-limit key. NextAuth's getToken works in edge runtime.
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const userId = token?._id || token?.sub;

  // ── Dashboard auth gate ──
  // Any /dashboard/* (or /dashboard) request without a session goes to /login
  // with a callbackUrl so we land them back where they were trying to go.
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    if (!userId) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    // Authed dashboard requests pass through — no rate limit on page loads.
    return NextResponse.next();
  }

  // ── API only beyond this point ──
  // Skip NextAuth — it has its own CSRF handling and we don't want to
  // accidentally rate-limit sign-in flows.
  if (pathname.startsWith("/api/auth/")) return NextResponse.next();

  // ── CSRF: Origin/Referer check on state-changing requests ──
  // Bearer-token requests are exempt from the same-origin check. CSRF
  // works because browsers auto-attach NextAuth's session cookie to
  // cross-site requests; Authorization headers are NEVER auto-attached
  // by the browser, so a malicious page cannot forge a Bearer request
  // on the user's behalf. The mobile app legitimately calls these
  // endpoints cross-origin (Expo Web on localhost, Android/iOS native
  // builds with their own origin), and would be blocked otherwise.
  const hasBearer = req.headers.get("authorization")?.startsWith("Bearer ");
  if (STATE_CHANGING.has(method) && !hasBearer && !isSameOrigin(req)) {
    return new NextResponse(
      JSON.stringify({
        message: "Cross-origin request blocked",
        type: "error",
        success: false,
      }),
      { status: 403, headers: { "content-type": "application/json" } },
    );
  }

  // ── Rate limit ──
  let key: string;
  let limits: { limit: number; windowMs: number };

  if (userId) {
    const bucket = STATE_CHANGING.has(method) ? "write" : "read";
    key = `u:${userId}:${bucket}`;
    limits = STATE_CHANGING.has(method) ? WRITE_LIMIT : READ_LIMIT;
  } else {
    key = `ip:${clientIp(req)}`;
    limits = ANON_LIMIT;
  }

  const result = checkRateLimit(key, limits);
  const headers = new Headers({
    "X-RateLimit-Limit": String(limits.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
  });

  if (!result.allowed) {
    headers.set("Retry-After", String(result.retryAfterSec));
    headers.set("content-type", "application/json");
    return new NextResponse(
      JSON.stringify({
        message: `Too many requests. Try again in ${result.retryAfterSec}s.`,
        type: "error",
        success: false,
      }),
      { status: 429, headers },
    );
  }

  const res = NextResponse.next();
  headers.forEach((v, k) => res.headers.set(k, v));
  return res;
}

export const config = {
  // Apply to every API route AND the dashboard tree. Everything else
  // (landing page, login, static assets) skips the proxy.
  matcher: ["/api/:path*", "/dashboard", "/dashboard/:path*"],
};
