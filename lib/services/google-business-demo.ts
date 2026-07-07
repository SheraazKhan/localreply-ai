import { prisma } from "@/lib/prisma"

/**
 * Google gates production access to the Business Profile Reviews API behind a manual
 * approval process (see README) that requires an already-verified real business — there is
 * no way to exercise the real integration in lib/services/google-business.ts without one.
 * This module simulates that same data flow with realistic sample data so the feature is
 * fully clickable end-to-end; it never makes an external network call.
 */

export const DEMO_ACCOUNT_ID = "demo-account"

export const DEMO_LOCATIONS = [
  { locationId: "demo-location-bakery", title: "Golden Crust Bakery", address: "214 Maple St, Springfield" },
  { locationId: "demo-location-auto", title: "Downtown Auto Repair", address: "88 Industrial Way, Springfield" },
  { locationId: "demo-location-salon", title: "Luxe Hair Studio", address: "5 Market Square, Springfield" },
] as const

interface ReviewTemplate {
  authorName: string
  rating: number
  reviewText: string
}

const REVIEW_TEMPLATES: ReviewTemplate[] = [
  { authorName: "Emma Sanchez", rating: 5, reviewText: "Absolutely fantastic service, the staff went above and beyond." },
  { authorName: "Liam Foster", rating: 1, reviewText: "Waited over an hour past my appointment time with no update. Very frustrating." },
  { authorName: "Olivia Bennett", rating: 4, reviewText: "Great quality and fair pricing, would come back again." },
  { authorName: "Noah Patel", rating: 2, reviewText: "The work was okay but the place was disorganized and my order got mixed up." },
  { authorName: "Ava Thompson", rating: 5, reviewText: "Best in the neighborhood, hands down. Everyone here is so friendly." },
  { authorName: "Ethan Brooks", rating: 3, reviewText: "Decent experience overall, nothing special but got the job done." },
  { authorName: "Sophia Martinez", rating: 5, reviewText: "They really know what they're doing. Highly recommend to anyone nearby." },
  { authorName: "Mason Reilly", rating: 1, reviewText: "Charged me more than the quoted price with no explanation. Not happy." },
  { authorName: "Isabella Cruz", rating: 4, reviewText: "Really solid experience, just wish the hours were a bit longer." },
  { authorName: "James Whitfield", rating: 5, reviewText: "Fast, friendly, and reasonably priced. Couldn't ask for more." },
  { authorName: "Mia Ferguson", rating: 2, reviewText: "Service was slow and the staff seemed overwhelmed the whole time." },
  { authorName: "Lucas Grant", rating: 5, reviewText: "Consistently great every single visit. This is my go-to spot now." },
  { authorName: "Charlotte Diaz", rating: 3, reviewText: "It was fine. Not bad, not amazing, just an average experience." },
  { authorName: "Benjamin Ross", rating: 4, reviewText: "Really impressed with the attention to detail here." },
]

function templateReviewId(locationId: string, index: number): string {
  return `demo-${locationId}-${index}`
}

async function upsertTemplateReview(locationId: string, index: number, daysAgo: number): Promise<boolean> {
  const template = REVIEW_TEMPLATES[index % REVIEW_TEMPLATES.length]!
  const googleReviewId = templateReviewId(locationId, index)

  const existing = await prisma.customerReview.findUnique({
    where: { locationId_googleReviewId: { locationId, googleReviewId } },
    select: { id: true },
  })
  if (existing) return false

  await prisma.customerReview.create({
    data: {
      locationId,
      googleReviewId,
      authorName: template.authorName,
      authorAvatar: null,
      rating: template.rating,
      reviewText: template.reviewText,
      reviewedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    },
  })
  return true
}

/** Seeds an initial batch of realistic reviews immediately after connecting a demo location. */
export async function seedDemoReviews(locationId: string): Promise<number> {
  const initialCount = 6
  let created = 0
  for (let index = 0; index < initialCount; index += 1) {
    const inserted = await upsertTemplateReview(locationId, index, initialCount - index)
    if (inserted) created += 1
  }
  await recalculateLocationStats(locationId)
  return created
}

/** Simulates "new reviews since last sync" by adding a few more templates, up to the pool size. */
export async function syncDemoReviews(locationId: string): Promise<number> {
  const existingCount = await prisma.customerReview.count({ where: { locationId } })
  const batchSize = Math.min(2, Math.max(0, REVIEW_TEMPLATES.length - existingCount))

  let created = 0
  for (let offset = 0; offset < batchSize; offset += 1) {
    const index = existingCount + offset
    const inserted = await upsertTemplateReview(locationId, index, 0)
    if (inserted) created += 1
  }

  if (created > 0) {
    await recalculateLocationStats(locationId)
  }
  return created
}

async function recalculateLocationStats(locationId: string): Promise<void> {
  const aggregate = await prisma.customerReview.aggregate({
    where: { locationId },
    _avg: { rating: true },
    _count: { _all: true },
  })

  await prisma.businessLocation.update({
    where: { id: locationId },
    data: {
      reviewCount: aggregate._count._all,
      averageRating: aggregate._avg.rating ?? 0,
    },
  })
}

/** Simulates the network latency of posting a reply to Google without an external call. */
export async function simulatePostReply(): Promise<void> {
  const delayMs = 400 + Math.floor(Math.random() * 400)
  await new Promise((resolve) => setTimeout(resolve, delayMs))
}
