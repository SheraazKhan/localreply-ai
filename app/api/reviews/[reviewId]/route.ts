import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { patchReviewSchema } from "@/lib/validations/reply"

interface RouteParams {
  params: Promise<{ reviewId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { reviewId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = patchReviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reply text" }, { status: 400 })
  }

  try {
    const review = await prisma.customerReview.findUnique({
      where: { id: reviewId },
      select: { location: { select: { userId: true } } },
    })

    if (!review || review.location.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updated = await prisma.customerReview.update({
      where: { id: reviewId },
      data: { replyText: parsed.data.replyText, replyStatus: "draft" },
      select: { id: true, replyText: true, replyStatus: true },
    })

    return NextResponse.json({ review: updated }, { status: 200 })
  } catch (error) {
    logger.error("Failed to update review", error)
    return NextResponse.json({ error: "Something went wrong, please try again" }, { status: 500 })
  }
}
