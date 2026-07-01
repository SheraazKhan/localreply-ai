import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { generateReplyRequestSchema } from "@/lib/validations/reply"
import { aiReplyProvider } from "@/lib/services/gemini"
import { GeminiGenerationError } from "@/types/gemini"
import { hasActiveSubscription } from "@/lib/services/subscription"
import { checkRateLimit, generateReplyRateLimiter } from "@/lib/services/rate-limit"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rateLimitResult = await checkRateLimit(generateReplyRateLimiter, session.user.id)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests, please wait a moment" },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = generateReplyRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const review = await prisma.customerReview.findUnique({
    where: { id: parsed.data.reviewId },
    select: { location: { select: { userId: true } } },
  })

  if (!review || review.location.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const isSubscribed = await hasActiveSubscription(session.user.id)
  if (!isSubscribed) {
    return NextResponse.json({ error: "subscription_required" }, { status: 402 })
  }

  try {
    const result = await aiReplyProvider.generateVariations({
      reviewText: parsed.data.reviewText,
      rating: parsed.data.rating,
      authorName: parsed.data.authorName,
      businessName: parsed.data.businessName,
      keywords: parsed.data.keywords,
      resolutionEmail: parsed.data.resolutionEmail,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof GeminiGenerationError) {
      return NextResponse.json({ error: error.message }, { status: 502 })
    }

    logger.error("Unexpected error generating reply", error)
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    )
  }
}
