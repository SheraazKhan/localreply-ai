import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type Stripe from "stripe"
import { prisma } from "@/lib/prisma"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import { stripe, mapStripeStatus, mapPriceIdToPlan } from "@/lib/services/stripe"

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId
  if (!userId || !session.subscription) {
    logger.warn("checkout.session.completed missing userId or subscription")
    return
  }

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription.id

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = stripeSubscription.items.data[0]?.price.id
  const plan = priceId ? mapPriceIdToPlan(priceId) : null
  const currentPeriodEndUnix = stripeSubscription.items.data[0]?.current_period_end

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId:
        typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId ?? null,
      plan,
      status: mapStripeStatus(stripeSubscription.status),
      currentPeriodEnd: currentPeriodEndUnix ? new Date(currentPeriodEndUnix * 1000) : null,
    },
    update: {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId ?? null,
      plan,
      status: mapStripeStatus(stripeSubscription.status),
      currentPeriodEnd: currentPeriodEndUnix ? new Date(currentPeriodEndUnix * 1000) : null,
    },
  })
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const existing = await prisma.subscription.findUnique({ where: { stripeCustomerId: customerId } })
  if (!existing) {
    logger.warn("invoice.payment_succeeded for unknown customer", { customerId })
    return
  }

  const invoiceWithSub = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription }
  let currentPeriodEnd: Date | null = existing.currentPeriodEnd

  if (invoiceWithSub.subscription) {
    const subscriptionId =
      typeof invoiceWithSub.subscription === "string"
        ? invoiceWithSub.subscription
        : invoiceWithSub.subscription.id
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
    const periodEndUnix = stripeSubscription.items.data[0]?.current_period_end
    currentPeriodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : currentPeriodEnd
  }

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: { status: "active", currentPeriodEnd },
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })
  if (!existing) {
    logger.warn("customer.subscription.updated for unknown subscription", {
      subscriptionId: subscription.id,
    })
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  const plan = priceId ? mapPriceIdToPlan(priceId) : existing.plan
  const currentPeriodEndUnix = subscription.items.data[0]?.current_period_end

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: mapStripeStatus(subscription.status),
      currentPeriodEnd: currentPeriodEndUnix ? new Date(currentPeriodEndUnix * 1000) : existing.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      plan,
      stripePriceId: priceId ?? existing.stripePriceId,
    },
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })
  if (!existing) return

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: "canceled" },
  })
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    logger.error("Stripe webhook signature verification failed", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object)
        break
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object)
        break
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object)
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object)
        break
      default:
        break
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    logger.error("Stripe webhook handler failed", error, { eventType: event.type })
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
