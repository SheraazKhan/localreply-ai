import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { publishReply } from "@/lib/actions/review-actions"
import { patchReviewSchema } from "@/lib/validations/reply"
import { logger } from "@/lib/logger"

interface RouteParams {
  params: Promise<{ reviewId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const result = await publishReply(reviewId, parsed.data.replyText)
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Unable to process request" }, { status: 400 })
    }
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    logger.error("Failed to publish reply via API route", error)
    return NextResponse.json({ error: "Something went wrong, please try again" }, { status: 500 })
  }
}
