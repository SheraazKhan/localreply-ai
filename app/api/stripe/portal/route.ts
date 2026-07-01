import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import { stripe } from "@/lib/services/stripe"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { stripeCustomerId: true },
    })

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account found" }, { status: 400 })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/billing`,
    })

    return NextResponse.json({ url: portalSession.url }, { status: 200 })
  } catch (error) {
    logger.error("Failed to create billing portal session", error)
    return NextResponse.json({ error: "Something went wrong, please try again" }, { status: 500 })
  }
}
