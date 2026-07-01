import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex-1 max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2026</p>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-medium text-foreground">What we collect</h2>
            <p className="mt-2">
              We collect the email address and name you provide at signup, the business name and
              Google Place ID for each location you connect, and the review text, star ratings,
              and author names that Google Business Profile shares with us when you connect an
              account. If you connect Google Business Profile, we store an encrypted OAuth access
              token and refresh token so we can post replies on your behalf.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-foreground">How we store it</h2>
            <p className="mt-2">
              Data is stored in a Postgres database hosted by Neon. OAuth tokens are encrypted at
              rest using AES-256-GCM before being written to the database and are only decrypted
              in memory immediately before making an outbound request to Google&apos;s API.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-foreground">Retention & deletion</h2>
            <p className="mt-2">
              Deleting a business location removes all associated keyword groups and customer
              review data. Deleting your account removes your user record and cascades through
              every relation — subscriptions, locations, keyword groups, and reviews are all
              permanently deleted. You can request account deletion from the Billing page at any
              time.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-foreground">Contact</h2>
            <p className="mt-2">
              Questions about this policy or a data request can be sent to{" "}
              <a href="mailto:privacy@localreply.ai" className="underline underline-offset-4">
                privacy@localreply.ai
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
