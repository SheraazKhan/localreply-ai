import { GoogleGenAI, Type } from "@google/genai"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import { generateReplyResponseSchema } from "@/lib/validations/reply"
import type {
  AiReplyProvider,
  GenerateReplyInput,
  GenerateReplyResponse,
} from "@/types/gemini"
import { GeminiGenerationError } from "@/types/gemini"

const GEMINI_MODEL_NAME = "gemini-3.5-flash"

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    variations: {
      type: Type.ARRAY,
      minItems: "3",
      maxItems: "3",
      items: {
        type: Type.OBJECT,
        properties: {
          label: {
            type: Type.STRING,
            enum: ["Professional & Direct", "Warm & Conversational", "Short & Punchy"],
          },
          text: { type: Type.STRING },
        },
        required: ["label", "text"],
      },
    },
  },
  required: ["variations"],
}

const SYSTEM_INSTRUCTION = `You are the voice of a local business responding to a customer review.
Always write in first-person-plural ("we", "our team") as the business itself.
Never invent facts, names, incidents, or details not present in the review.
Vary the opening line across the three variations so they don't sound repetitive.
Output must strictly match the provided JSON schema. Do not include markdown formatting, commentary, or any text outside the JSON structure.`

function buildToneInstruction(input: GenerateReplyInput): string {
  const { rating, keywords, resolutionEmail } = input

  if (rating <= 2) {
    return `This is a negative review (rating ${rating}/5). Write an empathetic, non-defensive reply.
Do not use any of these words/phrases anywhere in the reply: ${keywords.length > 0 ? keywords.join(", ") : "(none supplied)"}.
Do not use promotional language. Do not dispute or minimize the reviewer's experience. Do not offer discounts, refunds, or compensation of any kind.
Every variation must end with a natural, non-boilerplate invitation to continue the conversation privately at ${resolutionEmail ?? "our support email"}.`
  }

  if (rating === 3) {
    return `This is a neutral review (rating 3/5). Write a cautious, neutral-toned reply, softer than a negative-review reply but still measured.
Do not use any of these words/phrases anywhere in the reply: ${keywords.length > 0 ? keywords.join(", ") : "(none supplied)"}.
Do not force a resolution-email call to action.`
  }

  const keywordInstruction =
    keywords.length > 0
      ? `Naturally weave exactly 1-2 of these keywords into the reply, only where grammatically fitting, without sounding forced: ${keywords.join(", ")}.`
      : "No keywords were supplied — do not invent or insert any promotional terms."

  return `This is a positive review (rating ${rating}/5). Write an enthusiastic reply that references something concrete from the review text.
${keywordInstruction}
Subtly imply an invitation for repeat business without being pushy or salesy.`
}

function buildUserPrompt(input: GenerateReplyInput): string {
  return `Business name: ${input.businessName}
Reviewer name: ${input.authorName}
Rating: ${input.rating}/5
Review text: """${input.reviewText}"""

${buildToneInstruction(input)}

Return exactly 3 variations with labels "Professional & Direct", "Warm & Conversational", and "Short & Punchy".`
}

export class GeminiReplyService implements AiReplyProvider {
  private readonly client: GoogleGenAI

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey })
  }

  async generateVariations(input: GenerateReplyInput): Promise<GenerateReplyResponse> {
    const prompt = buildUserPrompt(input)

    try {
      return await this.attemptGeneration(prompt)
    } catch (firstError) {
      logger.warn("Gemini first attempt failed validation, retrying", {
        error: firstError instanceof Error ? firstError.message : String(firstError),
      })

      try {
        return await this.attemptGeneration(
          `${prompt}\n\nYour previous response was not valid JSON matching the required schema. Return ONLY valid JSON matching the schema, with no other text.`
        )
      } catch (secondError) {
        logger.error("Gemini generation failed after retry", secondError)
        throw new GeminiGenerationError(
          "Unable to generate reply variations at this time. Please try again."
        )
      }
    }
  }

  private async attemptGeneration(prompt: string): Promise<GenerateReplyResponse> {
    const result = await this.client.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema,
      },
    })

    const rawText = result.text
    if (!rawText) {
      throw new Error("Gemini returned an empty response")
    }

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(rawText)
    } catch {
      throw new Error("Gemini response was not valid JSON")
    }

    const validated = generateReplyResponseSchema.safeParse(parsedJson)
    if (!validated.success) {
      throw new Error("Gemini response did not match the expected schema")
    }

    return validated.data
  }
}

export const aiReplyProvider: AiReplyProvider = new GeminiReplyService(env.GEMINI_API_KEY)
