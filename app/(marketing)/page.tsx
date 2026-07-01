import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"
import { Hero } from "@/components/marketing/hero"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, ShieldCheck, Gauge } from "lucide-react"

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-crafted replies",
    description:
      "Three tone variations per review, tuned to the star rating, written in your business's voice.",
  },
  {
    icon: Gauge,
    title: "Local SEO keywords",
    description:
      "Weave your target keywords naturally into positive replies without sounding like an ad.",
  },
  {
    icon: ShieldCheck,
    title: "Safe by design",
    description:
      "Negative reviews never get discounts, disputes, or promotional language — just an empathetic path to resolution.",
  },
]

export default function MarketingHomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <section id="features" className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="size-6 text-primary" aria-hidden="true" />
                  <CardTitle className="mt-3">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
