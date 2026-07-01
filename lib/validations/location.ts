import { z } from "zod"

export const createLocationSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(200),
  googlePlaceId: z.string().max(200).optional(),
})

export type CreateLocationInput = z.infer<typeof createLocationSchema>

export const keywordGroupSchema = z.object({
  locationId: z.string().cuid(),
  categoryLabel: z.string().min(1, "Category label is required").max(80),
  keywords: z
    .array(z.string().min(1).max(60))
    .max(10, "Up to 10 keywords per group")
    .default([]),
})

export type KeywordGroupInput = z.infer<typeof keywordGroupSchema>

export const deleteKeywordGroupSchema = z.object({
  keywordGroupId: z.string().cuid(),
})
