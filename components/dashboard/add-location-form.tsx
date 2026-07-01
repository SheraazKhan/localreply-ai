"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import { createLocation } from "@/lib/actions/location-actions"

export function AddLocationForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const result = await createLocation({ businessName })
      if (!result.success) {
        toast.error(result.error ?? "Unable to process request")
        setIsSubmitting(false)
        return
      }

      toast.success("Location added")
      setOpen(false)
      setBusinessName("")
      router.refresh()
    } catch {
      toast.error("Something went wrong, please try again")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Add location manually</DialogTrigger>
      <DialogContent className="duration-250 ease-out">
        <DialogHeader>
          <DialogTitle>Add a business location</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="e.g. Sunrise Coffee Co."
            />
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting || businessName.trim().length === 0}>
            {isSubmitting ? "Adding..." : "Add location"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
