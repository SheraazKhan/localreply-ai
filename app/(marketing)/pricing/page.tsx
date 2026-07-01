import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"
import { PricingCheckoutButton } from "@/components/marketing/pricing-checkout-button"

interface PricingPageProps {
  searchParams: Promise<{ reason?: string }>
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const { reason } = await searchParams

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Simple, transparent pricing</h1>
          <p className="mt-3 text-muted-foreground">
            Choose the plan that fits your business. Cancel anytime.
          </p>
          {reason === "subscription_required" && (
            <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              An active subscription is required to access the dashboard.
            </p>
          )}
        </div>
        <div className="mt-12">
          <PricingCheckoutButton />
        </div>
      </main>
      <Footer />
    </>
  )
}
