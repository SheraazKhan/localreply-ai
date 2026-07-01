import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

interface SentimentBadgeProps {
  rating: number
}

export function SentimentBadge({ rating }: SentimentBadgeProps) {
  if (rating > 2) return null

  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="size-3" aria-hidden="true" />
      Needs attention
    </Badge>
  )
}
