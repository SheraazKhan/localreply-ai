import { env } from "@/lib/env"
import { logger } from "@/lib/logger"

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

interface TurnstileVerifyResponse {
  success: boolean
  "error-codes"?: string[]
}

export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  try {
    const body = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
    })
    if (remoteIp) {
      body.set("remoteip", remoteIp)
    }

    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })

    const result = (await response.json()) as TurnstileVerifyResponse
    return result.success === true
  } catch (error) {
    logger.error("Turnstile verification request failed", error)
    return false
  }
}
