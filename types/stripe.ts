import type { PlanTier, SubscriptionStatus } from "@prisma/client"

export interface CheckoutRequestBody {
  plan: "starter" | "growth"
}

export interface CheckoutResponseBody {
  url: string
}

export interface PortalResponseBody {
  url: string
}

export interface SubscriptionSummary {
  plan: PlanTier | null
  status: SubscriptionStatus
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}
