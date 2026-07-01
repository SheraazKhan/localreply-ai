import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LocationSelector } from "@/components/dashboard/location-selector"
import { KpiGrid } from "@/components/dashboard/kpi-grid"
import { ReviewList } from "@/components/dashboard/review-list"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import type { ReviewCardData } from "@/components/dashboard/review-card"

interface DashboardPageProps {
  searchParams: Promise<{ location?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  const { location: locationParam } = await searchParams

  const locations = await prisma.businessLocation.findMany({
    where: { userId: session.user.id },
    select: { id: true, businessName: true },
    orderBy: { createdAt: "asc" },
  })

  if (locations.length === 0) {
    return (
      <EmptyState
        title="No business locations yet"
        description="Connect your Google Business Profile or add a location manually to get started."
      />
    )
  }

  const activeLocationId =
    locationParam && locations.some((location) => location.id === locationParam)
      ? locationParam
      : locations[0]!.id

  const [location, aggregate, reviews, keywordGroups] = await Promise.all([
    prisma.businessLocation.findUnique({
      where: { id: activeLocationId },
      select: { businessName: true },
    }),
    prisma.customerReview.aggregate({
      where: { locationId: activeLocationId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.customerReview.findMany({
      where: { locationId: activeLocationId },
      select: {
        id: true,
        authorName: true,
        rating: true,
        reviewText: true,
        replyStatus: true,
        reviewedAt: true,
      },
      orderBy: { reviewedAt: "desc" },
    }),
    prisma.keywordGroup.findMany({
      where: { locationId: activeLocationId },
      select: { keywords: true },
    }),
  ])

  const publishedCount = await prisma.customerReview.count({
    where: { locationId: activeLocationId, replyStatus: "published" },
  })

  const pendingCount = await prisma.customerReview.count({
    where: { locationId: activeLocationId, replyStatus: "unreplied" },
  })

  const businessName = location?.businessName ?? "Your business"
  const allKeywords = keywordGroups.flatMap((group) => group.keywords)

  const reviewCardData: ReviewCardData[] = reviews.map((review) => ({
    id: review.id,
    authorName: review.authorName,
    rating: review.rating,
    reviewText: review.reviewText,
    replyStatus: review.replyStatus,
    reviewedAt: review.reviewedAt.toISOString(),
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{businessName}</p>
        </div>
        <div className="flex items-center gap-3">
          <LocationSelector locations={locations} activeLocationId={activeLocationId} />
          <Button variant="outline" render={<Link href="/locations" />}>
            Manage locations
          </Button>
        </div>
      </div>

      <KpiGrid
        pendingReviews={pendingCount}
        averageRating={aggregate._avg.rating ?? 0}
        totalReviews={aggregate._count._all}
        publishedReplies={publishedCount}
      />

      <ReviewList
        reviews={reviewCardData}
        businessName={businessName}
        keywords={allKeywords}
        resolutionEmail={session.user.email ?? ""}
      />
    </div>
  )
}
