export interface GoogleBusinessReview {
  googleReviewId: string
  authorName: string
  authorAvatar: string | null
  rating: number
  reviewText: string
  reviewedAt: string
}

export interface GoogleBusinessLocationInfo {
  googleAccountId: string
  googleLocationId: string
  businessName: string
}

export interface PostReplyInput {
  locationId: string
  googleReviewId: string
  replyText: string
}
