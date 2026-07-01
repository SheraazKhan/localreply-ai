import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { KeywordGroupList } from "@/components/dashboard/keyword-group-list"

interface KeywordsPageProps {
  params: Promise<{ locationId: string }>
}

export default async function KeywordsPage({ params }: KeywordsPageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  const { locationId } = await params

  const location = await prisma.businessLocation.findUnique({
    where: { id: locationId },
    select: {
      id: true,
      userId: true,
      businessName: true,
      keywordGroups: {
        select: { id: true, categoryLabel: true, keywords: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!location || location.userId !== session.user.id) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{location.businessName}</h1>
        <p className="text-sm text-muted-foreground">
          Keyword groups guide how AI-generated replies mention your products and ambience.
        </p>
      </div>
      <KeywordGroupList locationId={location.id} groups={location.keywordGroups} />
    </div>
  )
}
