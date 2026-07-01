import Stripe from "stripe"
import { env } from "@/lib/env"
import type { PlanTier, SubscriptionStatus } from "@prisma/client"

export const stripe = new Stripe(env.STRIPE_SECRET_KEY)

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active"
    case "trialing":
      return "trialing"
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "past_due"
    case "canceled":
    case "incomplete_expired":
    case "paused":
      return "canceled"
    default:
      return "past_due"
  }
}

export function mapPriceIdToPlan(priceId: string): PlanTier | null {
  if (priceId === env.STRIPE_PRICE_ID_STARTER) return "starter"
  if (priceId === env.STRIPE_PRICE_ID_GROWTH) return "growth"
  return null
}

export function planToPriceId(plan: PlanTier): string {
  return plan === "starter" ? env.STRIPE_PRICE_ID_STARTER : env.STRIPE_PRICE_ID_GROWTH
}
