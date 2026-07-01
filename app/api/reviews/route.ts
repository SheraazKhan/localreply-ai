import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const locationId = request.nextUrl.searchParams.get("locationId")
  if (!locationId) {
    return NextResponse.json({ error: "locationId is required" }, { status: 400 })
  }

  try {
    const location = await prisma.businessLocation.findUnique({
      where: { id: locationId },
      select: { userId: true },
    })

    if (!location || location.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const reviews = await prisma.customerReview.findMany({
      where: { locationId },
      select: {
        id: true,
        authorName: true,
        authorAvatar: true,
        rating: true,
        reviewText: true,
        replyText: true,
        replyStatus: true,
        reviewedAt: true,
        repliedAt: true,
      },
      orderBy: { reviewedAt: "desc" },
    })

    return NextResponse.json({ reviews }, { status: 200 })
  } catch (error) {
    logger.error("Failed to list reviews", error)
    return NextResponse.json({ error: "Something went wrong, please try again" }, { status: 500 })
  }
}
