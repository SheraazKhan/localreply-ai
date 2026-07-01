"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { publishReply } from "@/lib/actions/review-actions"
import { REPLY_VARIATION_LABELS } from "@/lib/constants"
import type { ReplyVariation } from "@/types/gemini"

interface AiWorkspaceProps {
  reviewId: string
  onPublished: () => void
}

function VariationSkeleton() {
  return (
    <div className="flex flex-col gap-2 py-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

export function AiWorkspace({ reviewId, onPublished }: AiWorkspaceProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [variations, setVariations] = useState<ReplyVariation[] | null>(null)
  const [activeTab, setActiveTab] = useState<string>(REPLY_VARIATION_LABELS[0])
  const [editedText, setEditedText] = useState("")
  const [hasManualEdit, setHasManualEdit] = useState(false)
  const [isPosting, setIsPosting] = useState(false)

  async function handleGenerate() {
    setIsGenerating(true)
    setVariations(null)
    setHasManualEdit(false)

    try {
      const response = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      })

      if (response.status === 402) {
        toast.error("An active subscription is required to generate replies")
        setIsGenerating(false)
        return
      }

      if (response.status === 429) {
        toast.error("Too many requests, please wait a moment")
        setIsGenerating(false)
        return
      }

      if (!response.ok) {
        toast.error("Something went wrong, please try again")
        setIsGenerating(false)
        return
      }

      const data = (await response.json()) as { variations: ReplyVariation[] }
      setVariations(data.variations)
      const first = data.variations[0]
      setActiveTab(first ? first.label : REPLY_VARIATION_LABELS[0])
      setEditedText(first ? first.text : "")
    } catch {
      toast.error("Something went wrong, please try again")
    } finally {
      setIsGenerating(false)
    }
  }

  function handleTabChange(tabValue: string) {
    setActiveTab(tabValue)
    if (!hasManualEdit) {
      const variation = variations?.find((item) => item.label === tabValue)
      if (variation) {
        setEditedText(variation.text)
      }
    }
  }

  function handleTextChange(value: string) {
    setEditedText(value)
    setHasManualEdit(true)
  }

  async function handleApprove() {
    setIsPosting(true)
    try {
      const result = await publishReply(reviewId, editedText)
      if (!result.success) {
        toast.error(result.error ?? "Unable to process request")
        setIsPosting(false)
        return
      }

      toast.success("Reply posted")
      onPublished()
    } catch {
      toast.error("Something went wrong, please try again")
      setIsPosting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!variations && !isGenerating && (
        <Button
          onClick={handleGenerate}
          className="w-fit active:scale-[0.98] transition-transform duration-100"
        >
          Generate Smart Reply
        </Button>
      )}

      {isGenerating && (
        <div className="transition-opacity duration-150 ease-out">
          <VariationSkeleton />
          <VariationSkeleton />
          <VariationSkeleton />
        </div>
      )}

      {variations && !isGenerating && (
        <div className="flex flex-col gap-4 opacity-100 transition-opacity duration-150 ease-out">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              {variations.map((variation) => (
                <TabsTrigger key={variation.label} value={variation.label}>
                  {variation.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {variations.map((variation) => (
              <TabsContent
                key={variation.label}
                value={variation.label}
                className="transition-opacity duration-[120ms] ease-out"
              >
                <Textarea
                  value={activeTab === variation.label ? editedText : variation.text}
                  onChange={(event) => handleTextChange(event.target.value)}
                  rows={5}
                />
              </TabsContent>
            ))}
          </Tabs>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleApprove}
              disabled={isPosting || editedText.trim().length === 0}
              className="active:scale-[0.98] transition-transform duration-100"
            >
              {isPosting ? "Posting..." : "Approve & Post to Google"}
            </Button>
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={isPosting}
              className="active:scale-[0.98] transition-transform duration-100"
            >
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
