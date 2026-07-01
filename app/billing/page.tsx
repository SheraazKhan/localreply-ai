import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ManageBillingButton, DeleteAccountButton } from "@/components/dashboard/billing-actions"
import { PLAN_LABELS } from "@/lib/constants"

export default async function BillingPage() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      stripeCustomerId: true,
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your subscription and account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Badge variant={subscription?.status === "active" ? "default" : "outline"}>
              {subscription?.status ?? "no subscription"}
            </Badge>
            {subscription?.plan && <span>{PLAN_LABELS[subscription.plan]}</span>}
            {subscription?.cancelAtPeriodEnd && (
              <span className="text-xs text-muted-foreground">Cancels at period end</span>
            )}
          </div>
          {subscription?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Renews on {subscription.currentPeriodEnd.toLocaleDateString()}
            </p>
          )}
          {subscription?.stripeCustomerId ? (
            <ManageBillingButton />
          ) : (
            <p className="text-sm text-muted-foreground">
              Subscribe to a plan from the pricing page to manage billing.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  )
}
