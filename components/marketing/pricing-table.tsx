import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PLAN_PRICES } from "@/lib/constants"

interface Plan {
  id: "starter" | "growth"
  name: string
  description: string
  features: string[]
  highlighted?: boolean
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For a single location just getting started with review management.",
    features: [
      "1 business location",
      "AI reply generation",
      "Keyword group management",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing businesses managing multiple locations.",
    features: [
      "Up to 5 business locations",
      "AI reply generation",
      "Keyword group management",
      "Priority support",
    ],
    highlighted: true,
  },
]

interface PricingTableProps {
  action: (plan: "starter" | "growth") => void
}

export function PricingTable({ action }: PricingTableProps) {
  return (
    <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
      {PLANS.map((plan) => (
        <Card key={plan.id} className={plan.highlighted ? "border-primary shadow-sm" : ""}>
          <CardHeader>
            <CardTitle className="flex items-baseline justify-between">
              <span>{plan.name}</span>
              <span className="text-2xl font-semibold">
                ${PLAN_PRICES[plan.id]}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="mt-2 w-full"
              variant={plan.highlighted ? "default" : "outline"}
              onClick={() => action(plan.id)}
            >
              Choose {plan.name}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
