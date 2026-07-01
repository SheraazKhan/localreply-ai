"use client"

import { useRef, useState, useLayoutEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/dashboard/star-rating"
import { SentimentBadge } from "@/components/dashboard/sentiment-badge"
import { AiWorkspace } from "@/components/dashboard/ai-workspace"
import { cn } from "@/lib/utils"

export interface ReviewCardData {
  id: string
  authorName: string
  rating: number
  reviewText: string
  replyStatus: "unreplied" | "draft" | "published"
  reviewedAt: string
}

interface ReviewCardProps {
  review: ReviewCardData
}

const STATUS_LABELS: Record<ReviewCardData["replyStatus"], string> = {
  unreplied: "Unreplied",
  draft: "Draft saved",
  published: "Published",
}

const STATUS_VARIANTS: Record<ReviewCardData["replyStatus"], "outline" | "secondary" | "default"> = {
  unreplied: "outline",
  draft: "secondary",
  published: "default",
}

export function ReviewCard({ review }: ReviewCardProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [measuredHeight, setMeasuredHeight] = useState(0)

  useLayoutEffect(() => {
    if (contentRef.current) {
      setMeasuredHeight(contentRef.current.scrollHeight)
    }
  }, [isExpanded])

  function handlePublished() {
    setIsExpanded(false)
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarFallback>{review.authorName.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{review.authorName}</span>
              <StarRating rating={review.rating} />
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{review.reviewText}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={STATUS_VARIANTS[review.replyStatus]}>
                {STATUS_LABELS[review.replyStatus]}
              </Badge>
              <SentimentBadge rating={review.rating} />
            </div>
          </div>
        </div>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform duration-250 ease-out", isExpanded && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <div
        style={{
          height: isExpanded ? measuredHeight : 0,
          transition: "height 250ms cubic-bezier(0, 0, 0.2, 1)",
          overflow: "hidden",
        }}
      >
        <div ref={contentRef} className="pt-4">
          <AiWorkspace reviewId={review.id} onPublished={handlePublished} />
        </div>
      </div>
    </div>
  )
}
