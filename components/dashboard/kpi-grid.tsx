import { Inbox, Star } from "lucide-react"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { StarRating } from "@/components/dashboard/star-rating"
import { ReplyRateWheel } from "@/components/dashboard/reply-rate-wheel"

interface KpiGridProps {
  pendingReviews: number
  averageRating: number
  totalReviews: number
  publishedReplies: number
}

export function KpiGrid({
  pendingReviews,
  averageRating,
  totalReviews,
  publishedReplies,
}: KpiGridProps) {
  const replyRatePercent =
    totalReviews > 0 ? Math.round((publishedReplies / totalReviews) * 100) : 0

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <KpiCard title="Pending Reviews" icon={Inbox}>
        <span className="text-2xl font-semibold">{pendingReviews}</span>
      </KpiCard>
      <KpiCard title="Average Rating" icon={Star}>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold">{averageRating.toFixed(1)}</span>
          <StarRating rating={Math.round(averageRating)} />
        </div>
      </KpiCard>
      <KpiCard title="Reply Rate" icon={Inbox}>
        <ReplyRateWheel percent={replyRatePercent} />
      </KpiCard>
    </div>
  )
}
