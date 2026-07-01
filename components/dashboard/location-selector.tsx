"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LocationOption {
  id: string
  businessName: string
}

interface LocationSelectorProps {
  locations: LocationOption[]
  activeLocationId: string
}

export function LocationSelector({ locations, activeLocationId }: LocationSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(locationId: string | null) {
    if (!locationId) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("location", locationId)
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <Select value={activeLocationId} onValueChange={handleChange}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Select a location" />
      </SelectTrigger>
      <SelectContent>
        {locations.map((location) => (
          <SelectItem key={location.id} value={location.id}>
            {location.businessName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
