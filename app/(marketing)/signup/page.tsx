import Link from "next/link"
import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"
import { SignupForm } from "@/app/(marketing)/signup/signup-form"
import { env } from "@/lib/env"

export default function SignupPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start replying to reviews in minutes.
          </p>
          <div className="mt-6">
            <SignupForm turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Log in
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
