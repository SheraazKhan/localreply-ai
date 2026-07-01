import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"

export function Hero() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24 text-center">
      <div className="mx-auto mb-6 flex w-fit items-center gap-1 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
        <Star className="size-3 fill-primary text-primary" aria-hidden="true" />
        Built for local business owners
      </div>
      <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        Turn every Google review into an on-brand reply — in seconds
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
        LocalReply AI connects to your Google Business Profile, understands your local SEO
        keywords, and drafts thoughtful, on-brand review replies you can approve with one click.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <Button size="lg" render={<Link href="/signup" />}>
          Start free trial
        </Button>
        <Button size="lg" variant="outline" render={<Link href="/pricing" />}>
          See pricing
        </Button>
      </div>
    </section>
  )
}
