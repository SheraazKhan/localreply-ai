import { z } from "zod"

export const generateReplyRequestSchema = z.object({
  reviewId: z.string().cuid(),
})

export type GenerateReplyRequest = z.infer<typeof generateReplyRequestSchema>

export const replyVariationSchema = z.object({
  label: z.enum(["Professional & Direct", "Warm & Conversational", "Short & Punchy"]),
  text: z.string().min(1),
})

export const generateReplyResponseSchema = z.object({
  variations: z.array(replyVariationSchema).length(3),
})

export type GenerateReplyResponseParsed = z.infer<typeof generateReplyResponseSchema>

export const patchReviewSchema = z.object({
  replyText: z.string().min(1).max(5000),
})

export type PatchReviewInput = z.infer<typeof patchReviewSchema>

export const publishReplySchema = z.object({
  reviewId: z.string().cuid(),
  replyText: z.string().min(1).max(5000),
})

export type PublishReplyInput = z.infer<typeof publishReplySchema>
