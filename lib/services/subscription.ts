import { prisma } from "@/lib/prisma"
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/lib/constants"
import type { SubscriptionStatus } from "@prisma/client"

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { status: true },
  })

  return subscription?.status ?? null
}

export function isActiveStatus(status: SubscriptionStatus | null): boolean {
  if (!status) return false
  return (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status)
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId)
  return isActiveStatus(status)
}
