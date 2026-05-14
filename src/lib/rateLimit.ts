// lib/rateLimit.ts
//
// In-memory sliding-window rate limiter. Single-process only — for multi-
// instance deployments swap the Map for Redis (Upstash works in middleware).
//
// Usage:
//   const result = checkRateLimit(`${userId}:write`, { limit: 60, windowMs: 60_000 });
//   if (!result.allowed) return new Response("Too Many Requests", { status: 429 });

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically prune expired entries so the Map doesn't grow unbounded.
// Runs once per minute; cheap because we only iterate when keys exist.
let lastSweep = Date.now();
function maybeSweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

export function checkRateLimit(
  key: string,
  opts: RateLimitOptions,
): RateLimitResult {
  maybeSweep();
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + opts.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: opts.limit - 1,
      resetAt,
      retryAfterSec: 0,
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, opts.limit - existing.count);
  const allowed = existing.count <= opts.limit;
  return {
    allowed,
    remaining,
    resetAt: existing.resetAt,
    retryAfterSec: allowed
      ? 0
      : Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
