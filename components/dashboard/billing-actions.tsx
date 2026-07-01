"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { deleteAccount } from "@/lib/actions/location-actions"
import type { PortalResponseBody } from "@/types/stripe"

export function ManageBillingButton() {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/stripe/portal", { method: "POST" })
        if (!response.ok) {
          toast.error("Something went wrong, please try again")
          return
        }
        const data = (await response.json()) as PortalResponseBody
        window.location.href = data.url
      } catch {
        toast.error("Something went wrong, please try again")
      }
    })
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? "Loading..." : "Manage billing"}
    </Button>
  )
}

export function DeleteAccountButton() {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      try {
        await deleteAccount()
      } catch {
        toast.error("Unable to process request")
      }
    })
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" />}>Delete account</DialogTrigger>
      <DialogContent className="duration-250 ease-out">
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This permanently deletes your account, all business locations, keyword groups, and
          review data. This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Deleting..." : "Yes, delete my account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
