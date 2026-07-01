import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { env } from "@/lib/env"

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})

export const generateReplyRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "ratelimit:generate-reply",
  analytics: false,
})

export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: "ratelimit:auth",
  analytics: false,
})

export const googleSyncRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "ratelimit:google-sync",
  analytics: false,
})

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

export async function checkRateLimit(
  limiter: Ratelimit,
  key: string
): Promise<RateLimitResult> {
  const result = await limiter.limit(key)
  return { success: result.success, remaining: result.remaining, reset: result.reset }
}
