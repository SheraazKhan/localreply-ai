import { ReviewCard, type ReviewCardData } from "@/components/dashboard/review-card"
import { EmptyState } from "@/components/shared/empty-state"

interface ReviewListProps {
  reviews: ReviewCardData[]
  businessName: string
  keywords: string[]
  resolutionEmail: string
}

export function ReviewList({ reviews, businessName, keywords, resolutionEmail }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        title="No reviews yet"
        description="Once customers leave reviews on your Google Business Profile, they'll show up here."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          businessName={businessName}
          keywords={keywords}
          resolutionEmail={resolutionEmail}
        />
      ))}
    </div>
  )
}
