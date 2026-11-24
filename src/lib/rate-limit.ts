import { Redis } from "@upstash/redis"

// Shared across instances via Upstash Redis when configured — falls back to
// an in-process Map otherwise (fine for a single-instance deploy, but each
// instance has its own counter on a multi-instance/serverless one, so the
// limit isn't reliably enforced platform-wide without Redis).
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null

const buckets = new Map<string, { count: number; resetAt: number }>()

export function isDistributedRateLimitConfigured() { return redis !== null }

/**
 * Returns true if the call under `key` is allowed, false if it should be
 * rejected (limit exceeded). Each call that returns true counts toward
 * the limit.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (redis) {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, Math.ceil(windowMs / 1000))
    }
    return count <= limit
  }

  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) {
    return false
  }
  entry.count++
  return true
}

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown"
}
