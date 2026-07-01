export interface ReplyVariation {
  label: string
  text: string
}

export interface GenerateReplyInput {
  reviewText: string
  rating: number
  authorName: string
  businessName: string
  keywords: string[]
  resolutionEmail?: string
}

export interface GenerateReplyResponse {
  variations: ReplyVariation[]
}

export interface AiReplyProvider {
  generateVariations(input: GenerateReplyInput): Promise<GenerateReplyResponse>
}

export class GeminiGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GeminiGenerationError"
  }
}
