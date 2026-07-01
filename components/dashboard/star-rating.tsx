import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  className?: string
}

export function StarRating({ rating, className }: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "size-4",
            index < rating ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/40"
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
