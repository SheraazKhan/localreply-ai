import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { googleBusinessService } from "@/lib/services/google-business"
import { checkRateLimit, googleSyncRateLimiter } from "@/lib/services/rate-limit"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rateLimitResult = await checkRateLimit(googleSyncRateLimiter, session.user.id)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many requests, please wait a moment" }, { status: 429 })
  }

  let body: unknown
  try {
    body = (await request.json()) as unknown
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const locationId =
    typeof body === "object" && body !== null && "locationId" in body
      ? String((body as Record<string, unknown>).locationId)
      : null

  if (!locationId) {
    return NextResponse.json({ error: "locationId is required" }, { status: 400 })
  }

  try {
    const location = await prisma.businessLocation.findUnique({
      where: { id: locationId },
      select: {
        userId: true,
        googleAccountId: true,
        googleLocationId: true,
        encryptedAccessToken: true,
        encryptedRefreshToken: true,
      },
    })

    if (!location || location.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (!location.encryptedAccessToken || !location.googleAccountId || !location.googleLocationId) {
      return NextResponse.json({ error: "Location is not connected to Google" }, { status: 400 })
    }

    const reviews = await googleBusinessService.syncReviews(
      locationId,
      location.encryptedAccessToken,
      location.encryptedRefreshToken,
      location.googleAccountId,
      location.googleLocationId
    )

    return NextResponse.json({ synced: reviews.length }, { status: 200 })
  } catch (error) {
    logger.error("Failed to sync Google Business reviews", error)
    return NextResponse.json({ error: "Something went wrong, please try again" }, { status: 500 })
  }
}
