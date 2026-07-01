"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { createLocationSchema } from "@/lib/validations/location"
import type { CreateLocationInput } from "@/lib/validations/location"
import { PLAN_LOCATION_LIMITS } from "@/lib/constants"

export interface ActionResult {
  success: boolean
  error?: string
}

async function requireUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }
  return session.user.id
}

export async function createLocation(input: CreateLocationInput): Promise<ActionResult> {
  try {
    const userId = await requireUserId()
    const parsed = createLocationSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: "Invalid business location details" }
    }

    const [subscription, locationCount] = await Promise.all([
      prisma.subscription.findUnique({ where: { userId }, select: { plan: true } }),
      prisma.businessLocation.count({ where: { userId } }),
    ])

    const limit = PLAN_LOCATION_LIMITS[subscription?.plan ?? "starter"]
    if (locationCount >= limit) {
      return {
        success: false,
        error: `Your plan allows up to ${limit} business location${limit === 1 ? "" : "s"}. Upgrade to add more.`,
      }
    }

    await prisma.businessLocation.create({
      data: {
        userId,
        businessName: parsed.data.businessName,
        googlePlaceId: parsed.data.googlePlaceId,
      },
    })

    revalidatePath("/locations")
    return { success: true }
  } catch (error) {
    logger.error("Failed to create location", error)
    return { success: false, error: "Unable to process request" }
  }
}

export async function deleteLocation(locationId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId()

    const location = await prisma.businessLocation.findUnique({
      where: { id: locationId },
      select: { userId: true },
    })

    if (!location || location.userId !== userId) {
      return { success: false, error: "Unable to process request" }
    }

    await prisma.businessLocation.delete({ where: { id: locationId } })

    revalidatePath("/locations")
    return { success: true }
  } catch (error) {
    logger.error("Failed to delete location", error)
    return { success: false, error: "Unable to process request" }
  }
}

export async function deleteAccount(): Promise<void> {
  const userId = await requireUserId()

  try {
    await prisma.user.delete({ where: { id: userId } })
  } catch (error) {
    logger.error("Failed to delete account", error, { userId })
    throw new Error("Unable to process request")
  }

  await signOut({ redirect: false })
  redirect("/")
}
