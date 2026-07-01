"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { upsertKeywordGroup } from "@/lib/actions/keyword-actions"

interface KeywordGroupFormProps {
  locationId: string
  existingGroup?: {
    id: string
    categoryLabel: string
    keywords: string[]
  }
}

export function KeywordGroupForm({ locationId, existingGroup }: KeywordGroupFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [categoryLabel, setCategoryLabel] = useState(existingGroup?.categoryLabel ?? "")
  const [keywords, setKeywords] = useState<string[]>(existingGroup?.keywords ?? [])
  const [keywordInput, setKeywordInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function addKeyword() {
    const trimmed = keywordInput.trim()
    if (!trimmed || keywords.length >= 10 || keywords.includes(trimmed)) {
      setKeywordInput("")
      return
    }
    setKeywords((prev) => [...prev, trimmed])
    setKeywordInput("")
  }

  function removeKeyword(keyword: string) {
    setKeywords((prev) => prev.filter((item) => item !== keyword))
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const result = await upsertKeywordGroup(
        { locationId, categoryLabel, keywords },
        existingGroup?.id
      )

      if (!result.success) {
        toast.error(result.error ?? "Unable to process request")
        setIsSubmitting(false)
        return
      }

      toast.success("Keyword group saved")
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Something went wrong, please try again")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={existingGroup ? "outline" : "default"} />}>
        {existingGroup ? "Edit group" : "Add keyword group"}
      </DialogTrigger>
      <DialogContent className="duration-250 ease-out">
        <DialogHeader>
          <DialogTitle>{existingGroup ? "Edit keyword group" : "New keyword group"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="categoryLabel">Category label</Label>
            <Input
              id="categoryLabel"
              value={categoryLabel}
              onChange={(event) => setCategoryLabel(event.target.value)}
              placeholder="e.g. Ambience"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="keywordInput">Keywords (up to 10)</Label>
            <div className="flex gap-2">
              <Input
                id="keywordInput"
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    addKeyword()
                  }
                }}
                placeholder="Type a keyword and press Enter"
              />
              <Button type="button" variant="outline" onClick={addKeyword}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
                >
                  {keyword}
                  <button type="button" onClick={() => removeKeyword(keyword)} aria-label={`Remove ${keyword}`}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || categoryLabel.trim().length === 0}
          >
            {isSubmitting ? "Saving..." : "Save keyword group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
