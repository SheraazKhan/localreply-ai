import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import { stripe, planToPriceId } from "@/lib/services/stripe"

interface CheckoutBody {
  plan: "starter" | "growth"
}

function isCheckoutBody(value: unknown): value is CheckoutBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "plan" in value &&
    (value as { plan: unknown }).plan !== undefined &&
    ["starter", "growth"].includes(String((value as { plan: unknown }).plan))
  )
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!isCheckoutBody(body)) {
    return NextResponse.json({ error: "Invalid plan selection" }, { status: 400 })
  }

  try {
    const userId = session.user.id
    let subscription = await prisma.subscription.findUnique({ where: { userId } })

    let stripeCustomerId = subscription?.stripeCustomerId ?? null

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { userId },
      })
      stripeCustomerId = customer.id

      subscription = await prisma.subscription.upsert({
        where: { userId },
        create: { userId, stripeCustomerId },
        update: { stripeCustomerId },
      })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: planToPriceId(body.plan), quantity: 1 }],
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/pricing?checkout=canceled`,
      metadata: { userId },
      subscription_data: { metadata: { userId } },
    })

    if (!checkoutSession.url) {
      throw new Error("Stripe did not return a checkout URL")
    }

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 })
  } catch (error) {
    logger.error("Failed to create checkout session", error)
    return NextResponse.json({ error: "Something went wrong, please try again" }, { status: 500 })
  }
}
