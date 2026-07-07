"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { publishReplySchema } from "@/lib/validations/reply"
import { googleBusinessService } from "@/lib/services/google-business"
import type { ActionResult } from "@/lib/actions/location-actions"

async function requireUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }
  return session.user.id
}

export async function publishReply(reviewId: string, replyText: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId()

    const parsed = publishReplySchema.safeParse({ reviewId, replyText })
    if (!parsed.success) {
      return { success: false, error: "Invalid reply text" }
    }

    const review = await prisma.customerReview.findUnique({
      where: { id: parsed.data.reviewId },
      select: {
        id: true,
        locationId: true,
        googleReviewId: true,
        location: {
          select: {
            userId: true,
            googleAccountId: true,
            googleLocationId: true,
            encryptedAccessToken: true,
            encryptedRefreshToken: true,
          },
        },
      },
    })

    if (!review || review.location.userId !== userId) {
      return { success: false, error: "Unable to process request" }
    }

    if (review.location.encryptedAccessToken && review.location.googleAccountId && review.location.googleLocationId) {
      await googleBusinessService.postReply({
        locationId: review.locationId,
        googleReviewId: review.googleReviewId,
        replyText: parsed.data.replyText,
        encryptedAccessToken: review.location.encryptedAccessToken,
        encryptedRefreshToken: review.location.encryptedRefreshToken,
        googleAccountId: review.location.googleAccountId,
        googleLocationId: review.location.googleLocationId,
      })
    } else {
      logger.info("Skipping live Google post — no connected Google Business account", {
        locationId: review.locationId,
      })
    }

    await prisma.customerReview.update({
      where: { id: parsed.data.reviewId },
      data: {
        replyText: parsed.data.replyText,
        replyStatus: "published",
        repliedAt: new Date(),
      },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    logger.error("Failed to publish reply", error)
    return { success: false, error: "Unable to process request" }
  }
}

export async function saveDraftReply(reviewId: string, replyText: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId()

    const parsed = publishReplySchema.safeParse({ reviewId, replyText })
    if (!parsed.success) {
      return { success: false, error: "Invalid reply text" }
    }

    const review = await prisma.customerReview.findUnique({
      where: { id: parsed.data.reviewId },
      select: { location: { select: { userId: true } } },
    })

    if (!review || review.location.userId !== userId) {
      return { success: false, error: "Unable to process request" }
    }

    await prisma.customerReview.update({
      where: { id: parsed.data.reviewId },
      data: { replyText: parsed.data.replyText, replyStatus: "draft" },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    logger.error("Failed to save draft reply", error)
    return { success: false, error: "Unable to process request" }
  }
}
