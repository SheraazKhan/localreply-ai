import { prisma } from "@/lib/prisma"
import { ACTIVE_SUBSCRIPTION_STATUSES, PLAN_LOCATION_LIMITS } from "@/lib/constants"
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

export async function hasLocationCapacity(userId: string): Promise<boolean> {
  const [subscription, locationCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId }, select: { plan: true } }),
    prisma.businessLocation.count({ where: { userId } }),
  ])

  const limit = PLAN_LOCATION_LIMITS[subscription?.plan ?? "starter"]
  return locationCount < limit
}
