"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { keywordGroupSchema, deleteKeywordGroupSchema } from "@/lib/validations/location"
import type { KeywordGroupInput } from "@/lib/validations/location"
import type { ActionResult } from "@/lib/actions/location-actions"

async function requireUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }
  return session.user.id
}

export async function upsertKeywordGroup(
  input: KeywordGroupInput,
  keywordGroupId?: string
): Promise<ActionResult> {
  try {
    const userId = await requireUserId()
    const parsed = keywordGroupSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: "Invalid keyword group details" }
    }

    const location = await prisma.businessLocation.findUnique({
      where: { id: parsed.data.locationId },
      select: { userId: true },
    })

    if (!location || location.userId !== userId) {
      return { success: false, error: "Unable to process request" }
    }

    if (keywordGroupId) {
      const existing = await prisma.keywordGroup.findUnique({
        where: { id: keywordGroupId },
        select: { location: { select: { userId: true } } },
      })

      if (!existing || existing.location.userId !== userId) {
        return { success: false, error: "Unable to process request" }
      }

      await prisma.keywordGroup.update({
        where: { id: keywordGroupId },
        data: {
          categoryLabel: parsed.data.categoryLabel,
          keywords: parsed.data.keywords,
        },
      })
    } else {
      await prisma.keywordGroup.create({
        data: {
          locationId: parsed.data.locationId,
          categoryLabel: parsed.data.categoryLabel,
          keywords: parsed.data.keywords,
        },
      })
    }

    revalidatePath(`/locations/${parsed.data.locationId}/keywords`)
    return { success: true }
  } catch (error) {
    logger.error("Failed to upsert keyword group", error)
    return { success: false, error: "Unable to process request" }
  }
}

export async function deleteKeywordGroup(keywordGroupId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId()
    const parsed = deleteKeywordGroupSchema.safeParse({ keywordGroupId })
    if (!parsed.success) {
      return { success: false, error: "Invalid request" }
    }

    const existing = await prisma.keywordGroup.findUnique({
      where: { id: parsed.data.keywordGroupId },
      select: { locationId: true, location: { select: { userId: true } } },
    })

    if (!existing || existing.location.userId !== userId) {
      return { success: false, error: "Unable to process request" }
    }

    await prisma.keywordGroup.delete({ where: { id: parsed.data.keywordGroupId } })

    revalidatePath(`/locations/${existing.locationId}/keywords`)
    return { success: true }
  } catch (error) {
    logger.error("Failed to delete keyword group", error)
    return { success: false, error: "Unable to process request" }
  }
}
