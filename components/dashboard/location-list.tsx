"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2, Tags, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { deleteLocation } from "@/lib/actions/location-actions"

export interface LocationListItem {
  id: string
  businessName: string
  reviewCount: number
  averageRating: number
  isConnected: boolean
  isDemoConnection: boolean
}

export function LocationList({ locations }: { locations: LocationListItem[] }) {
  const router = useRouter()
  const [syncingId, setSyncingId] = useState<string | null>(null)

  async function handleDelete(locationId: string) {
    const result = await deleteLocation(locationId)
    if (!result.success) {
      toast.error(result.error ?? "Unable to process request")
      return
    }
    toast.success("Location deleted")
    router.refresh()
  }

  async function handleSync(locationId: string) {
    setSyncingId(locationId)
    try {
      const response = await fetch("/api/google-business/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId }),
      })

      if (!response.ok) {
        toast.error("Something went wrong, please try again")
        return
      }

      const data = (await response.json()) as { synced: number }
      toast.success(data.synced > 0 ? `Synced ${data.synced} new review${data.synced === 1 ? "" : "s"}` : "No new reviews found")
      router.refresh()
    } catch {
      toast.error("Something went wrong, please try again")
    } finally {
      setSyncingId(null)
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {locations.map((location) => (
        <Card key={location.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{location.businessName}</CardTitle>
              {location.isDemoConnection && <Badge variant="secondary">Demo</Badge>}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(location.id)}
              aria-label={`Delete ${location.businessName}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {location.reviewCount} reviews · {location.averageRating.toFixed(1)} avg rating
            </p>
            <div className="flex items-center gap-2">
              {location.isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(location.id)}
                  disabled={syncingId === location.id}
                >
                  <RefreshCw className={syncingId === location.id ? "size-4 animate-spin" : "size-4"} />
                  {syncingId === location.id ? "Syncing..." : "Sync"}
                </Button>
              )}
              <Button variant="outline" size="sm" render={<Link href={`/locations/${location.id}/keywords`} />}>
                <Tags className="size-4" />
                Keywords
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
