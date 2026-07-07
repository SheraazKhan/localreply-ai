import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"
import {
  listGoogleBusinessAccounts,
  listGoogleBusinessLocations,
} from "@/lib/services/google-business"
import { connectGoogleLocation } from "@/lib/actions/location-actions"

interface SelectableLocation {
  googleAccountId: string
  googleLocationId: string
  title: string
  address: string | null
}

export default async function SelectLocationPage() {
  const cookieStore = await cookies()
  const encryptedAccessToken = cookieStore.get("gbp_pending_access")?.value
  const encryptedRefreshToken = cookieStore.get("gbp_pending_refresh")?.value ?? null

  if (!encryptedAccessToken) {
    redirect("/onboarding/connect-google?error=connection_failed")
  }

  const locations: SelectableLocation[] = []
  try {
    const accounts = await listGoogleBusinessAccounts(encryptedAccessToken, encryptedRefreshToken)
    for (const account of accounts) {
      const accountLocations = await listGoogleBusinessLocations(
        encryptedAccessToken,
        encryptedRefreshToken,
        account.accountId
      )
      locations.push(
        ...accountLocations.map((location) => ({
          googleAccountId: account.accountId,
          googleLocationId: location.locationId,
          title: location.title,
          address: location.address,
        }))
      )
    }
  } catch (error) {
    logger.error("Failed to list Google Business accounts/locations", error)
    redirect("/onboarding/connect-google?error=connection_failed")
  }

  if (locations.length === 0) {
    redirect("/onboarding/connect-google?error=no_locations")
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a location</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select which Google Business Profile location to connect to LocalReply AI.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {locations.map((location) => (
          <Card key={`${location.googleAccountId}:${location.googleLocationId}`}>
            <CardHeader>
              <CardTitle className="text-base">{location.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">{location.address ?? "No address on file"}</p>
              <form
                action={connectGoogleLocation.bind(
                  null,
                  location.googleAccountId,
                  location.googleLocationId,
                  location.title
                )}
              >
                <Button type="submit">Connect</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
