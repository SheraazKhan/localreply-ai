"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { createLocationSchema } from "@/lib/validations/location"
import type { CreateLocationInput } from "@/lib/validations/location"
import { hasLocationCapacity } from "@/lib/services/subscription"
import { seedDemoReviews } from "@/lib/services/google-business-demo"

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

    if (!(await hasLocationCapacity(userId))) {
      return {
        success: false,
        error: "Your plan's business location limit is already reached. Upgrade to add more.",
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

export async function connectGoogleLocation(
  googleAccountId: string,
  googleLocationId: string,
  businessName: string,
  isDemo: boolean
): Promise<void> {
  const userId = await requireUserId()

  if (!(await hasLocationCapacity(userId))) {
    redirect("/onboarding/connect-google?error=plan_limit_reached")
  }

  let locationId: string
  if (isDemo) {
    try {
      const location = await prisma.businessLocation.create({
        data: {
          userId,
          businessName,
          googleAccountId,
          googleLocationId,
          isDemoConnection: true,
        },
      })
      locationId = location.id
    } catch (error) {
      logger.error("Failed to connect demo Google Business location", error, { userId })
      redirect("/onboarding/connect-google?error=connection_failed")
    }

    await seedDemoReviews(locationId)
  } else {
    const cookieStore = await cookies()
    const encryptedAccessToken = cookieStore.get("gbp_pending_access")?.value
    const encryptedRefreshToken = cookieStore.get("gbp_pending_refresh")?.value ?? null

    if (!encryptedAccessToken) {
      redirect("/onboarding/connect-google?error=connection_failed")
    }

    try {
      await prisma.businessLocation.create({
        data: {
          userId,
          businessName,
          googleAccountId,
          googleLocationId,
          encryptedAccessToken,
          encryptedRefreshToken,
        },
      })
    } catch (error) {
      logger.error("Failed to connect Google Business location", error, { userId })
      redirect("/onboarding/connect-google?error=connection_failed")
    }

    cookieStore.delete("gbp_pending_access")
    cookieStore.delete("gbp_pending_refresh")
  }

  revalidatePath("/locations")
  redirect("/locations")
}
