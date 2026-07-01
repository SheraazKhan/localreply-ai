"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { PricingTable } from "@/components/marketing/pricing-table"
import type { CheckoutResponseBody } from "@/types/stripe"

export function PricingCheckoutButton() {
  const [isPending, startTransition] = useTransition()

  function handleSelectPlan(plan: "starter" | "growth") {
    startTransition(async () => {
      try {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        })

        if (response.status === 401) {
          window.location.href = "/login"
          return
        }

        if (!response.ok) {
          toast.error("Something went wrong, please try again")
          return
        }

        const data = (await response.json()) as CheckoutResponseBody
        window.location.href = data.url
      } catch {
        toast.error("Something went wrong, please try again")
      }
    })
  }

  return (
    <div aria-busy={isPending} className={isPending ? "pointer-events-none opacity-70" : ""}>
      <PricingTable action={handleSelectPlan} />
    </div>
  )
}
