"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2, Tags } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { deleteLocation } from "@/lib/actions/location-actions"

export interface LocationListItem {
  id: string
  businessName: string
  reviewCount: number
  averageRating: number
  isConnected: boolean
}

export function LocationList({ locations }: { locations: LocationListItem[] }) {
  const router = useRouter()

  async function handleDelete(locationId: string) {
    const result = await deleteLocation(locationId)
    if (!result.success) {
      toast.error(result.error ?? "Unable to process request")
      return
    }
    toast.success("Location deleted")
    router.refresh()
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {locations.map((location) => (
        <Card key={location.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{location.businessName}</CardTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(location.id)}
              aria-label={`Delete ${location.businessName}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {location.reviewCount} reviews · {location.averageRating.toFixed(1)} avg rating
            </p>
            <Button variant="outline" size="sm" render={<Link href={`/locations/${location.id}/keywords`} />}>
              <Tags className="size-4" />
              Keywords
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
