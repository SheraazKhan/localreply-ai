import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EmptyState } from "@/components/shared/empty-state"
import { AddLocationForm } from "@/components/dashboard/add-location-form"
import { LocationList } from "@/components/dashboard/location-list"

export default async function LocationsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  const locations = await prisma.businessLocation.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      businessName: true,
      reviewCount: true,
      averageRating: true,
      encryptedAccessToken: true,
      isDemoConnection: true,
    },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
          <p className="text-sm text-muted-foreground">
            Manage the business locations connected to your account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddLocationForm />
        </div>
      </div>

      {locations.length === 0 ? (
        <EmptyState
          title="No locations yet"
          description="Add a business location manually or connect Google Business Profile from onboarding."
        />
      ) : (
        <LocationList
          locations={locations.map((location) => ({
            id: location.id,
            businessName: location.businessName,
            reviewCount: location.reviewCount,
            averageRating: location.averageRating,
            isConnected: location.encryptedAccessToken !== null || location.isDemoConnection,
            isDemoConnection: location.isDemoConnection,
          }))}
        />
      )}
    </div>
  )
}
