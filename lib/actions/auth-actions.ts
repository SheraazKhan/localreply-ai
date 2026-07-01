"use server"

import { headers } from "next/headers"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { signupSchema } from "@/lib/validations/auth"
import type { SignupInput } from "@/lib/validations/auth"
import { verifyTurnstileToken } from "@/lib/services/turnstile"
import { checkRateLimit, authRateLimiter } from "@/lib/services/rate-limit"
import type { ActionResult } from "@/lib/actions/location-actions"

const GENERIC_SIGNUP_ERROR = "Unable to create account with these details"
const GENERIC_RESET_MESSAGE = "If that email exists, we've sent a reset link"

async function getClientIp(): Promise<string> {
  const headerList = await headers()
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
}

export async function signup(input: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Invalid signup details" }
  }

  const ip = await getClientIp()
  const rateLimitResult = await checkRateLimit(authRateLimiter, `${ip}:${parsed.data.email.toLowerCase()}`)
  if (!rateLimitResult.success) {
    logger.warn("Signup rate limit exceeded", { email: parsed.data.email })
    return { success: false, error: GENERIC_SIGNUP_ERROR }
  }

  const turnstileValid = await verifyTurnstileToken(parsed.data.turnstileToken, ip)
  if (!turnstileValid) {
    return { success: false, error: "Verification failed. Please try again." }
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (existingUser) {
      logger.info("Signup attempted with existing email", { email: parsed.data.email })
      return { success: false, error: GENERIC_SIGNUP_ERROR }
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12)

    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
      },
    })

    return { success: true }
  } catch (error) {
    logger.error("Signup failed", error, { email: parsed.data.email })
    return { success: false, error: GENERIC_SIGNUP_ERROR }
  }
}

export async function requestPasswordReset(email: string): Promise<ActionResult> {
  const start = Date.now()

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      logger.info("Password reset requested", { email })
      // Token issuance/email delivery would be wired to a transactional email
      // provider here; omitted since no such provider is in scope for this build.
    }
  } catch (error) {
    logger.error("Password reset lookup failed", error)
  }

  const elapsed = Date.now() - start
  const minDelayMs = 250
  if (elapsed < minDelayMs) {
    await new Promise((resolve) => setTimeout(resolve, minDelayMs - elapsed))
  }

  return { success: true, error: GENERIC_RESET_MESSAGE }
}
