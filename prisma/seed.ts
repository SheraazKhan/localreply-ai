import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash("Demo1234!", 12)

  const user = await prisma.user.upsert({
    where: { email: "demo@localreply.ai" },
    create: {
      email: "demo@localreply.ai",
      name: "Demo User",
      passwordHash,
    },
    update: {},
  })

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, status: "active", plan: "growth" },
    update: { status: "active", plan: "growth" },
  })

  const location = await prisma.businessLocation.upsert({
    where: { id: "seed-location-1" },
    create: {
      id: "seed-location-1",
      userId: user.id,
      businessName: "Sunrise Coffee Co.",
      reviewCount: 8,
      averageRating: 4.1,
    },
    update: {},
  })

  await prisma.keywordGroup.deleteMany({ where: { locationId: location.id } })
  await prisma.keywordGroup.createMany({
    data: [
      { locationId: location.id, categoryLabel: "Ambience", keywords: ["cozy", "outdoor seating", "free wifi"] },
      { locationId: location.id, categoryLabel: "Products", keywords: ["oat milk latte", "fresh pastries", "cold brew"] },
    ],
  })

  await prisma.customerReview.deleteMany({ where: { locationId: location.id } })
  await prisma.customerReview.createMany({
    data: [
      {
        locationId: location.id,
        googleReviewId: "seed-review-1",
        authorName: "Alex Chen",
        authorAvatar: null,
        rating: 5,
        reviewText: "Best oat milk latte in town! The staff remembered my order and the outdoor seating is so cozy.",
        replyStatus: "unreplied",
        reviewedAt: new Date("2026-06-20"),
      },
      {
        locationId: location.id,
        googleReviewId: "seed-review-2",
        authorName: "Jordan Blake",
        authorAvatar: null,
        rating: 1,
        reviewText: "Waited 25 minutes for a simple coffee and it was cold when it arrived. Very disappointed.",
        replyStatus: "unreplied",
        reviewedAt: new Date("2026-06-22"),
      },
      {
        locationId: location.id,
        googleReviewId: "seed-review-3",
        authorName: "Priya Nair",
        authorAvatar: null,
        rating: 4,
        reviewText: "Great cold brew and fast wifi, perfect spot to get some work done.",
        replyStatus: "published",
        reviewedAt: new Date("2026-06-15"),
        repliedAt: new Date("2026-06-16"),
        replyText: "Thank you Priya! So glad our cold brew and wifi made for a great work session.",
      },
      {
        locationId: location.id,
        googleReviewId: "seed-review-4",
        authorName: "Sam Rivera",
        authorAvatar: null,
        rating: 3,
        reviewText: "Decent coffee but a bit pricey for the portion size.",
        replyStatus: "draft",
        reviewedAt: new Date("2026-06-18"),
        replyText: "Thanks for the honest feedback, Sam.",
      },
      {
        locationId: location.id,
        googleReviewId: "seed-review-5",
        authorName: "Taylor Kim",
        authorAvatar: null,
        rating: 5,
        reviewText: "The fresh pastries are incredible and the ambience is so cozy on a rainy day.",
        replyStatus: "unreplied",
        reviewedAt: new Date("2026-06-25"),
      },
      {
        locationId: location.id,
        googleReviewId: "seed-review-6",
        authorName: "Morgan Lee",
        authorAvatar: null,
        rating: 2,
        reviewText: "The barista was rude and my order was wrong twice in a row.",
        replyStatus: "unreplied",
        reviewedAt: new Date("2026-06-24"),
      },
      {
        locationId: location.id,
        googleReviewId: "seed-review-7",
        authorName: "Casey Nguyen",
        authorAvatar: null,
        rating: 5,
        reviewText: "Love this place! Free wifi, cozy seating, and the oat milk latte is unbeatable.",
        replyStatus: "published",
        reviewedAt: new Date("2026-06-10"),
        repliedAt: new Date("2026-06-11"),
        replyText: "Thank you so much Casey, we're thrilled you love our oat milk latte!",
      },
      {
        locationId: location.id,
        googleReviewId: "seed-review-8",
        authorName: "Riley Park",
        authorAvatar: null,
        rating: 4,
        reviewText: "Solid neighborhood coffee shop with great outdoor seating.",
        replyStatus: "unreplied",
        reviewedAt: new Date("2026-06-27"),
      },
    ],
  })

  console.log("Seed complete:", { userEmail: user.email, locationId: location.id })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
