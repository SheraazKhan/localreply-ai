import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex-1 max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2026</p>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-medium text-foreground">Using the service</h2>
            <p className="mt-2">
              LocalReply AI generates draft review replies using an AI model. You are responsible
              for reviewing and approving any reply before it is posted to Google on your behalf.
              We do not guarantee the factual accuracy of generated text and you should not rely
              on it to make representations about your business without review.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-foreground">Subscriptions & billing</h2>
            <p className="mt-2">
              Paid plans are billed monthly through Stripe. You can cancel at any time from the
              Billing page; access continues until the end of the current billing period.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-foreground">Account termination</h2>
            <p className="mt-2">
              You may delete your account at any time from the Billing page. We may suspend
              accounts that abuse the service, violate Google&apos;s API terms, or attempt to
              circumvent rate limiting or authentication controls.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-foreground">Contact</h2>
            <p className="mt-2">
              Questions about these terms can be sent to{" "}
              <a href="mailto:legal@localreply.ai" className="underline underline-offset-4">
                legal@localreply.ai
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
