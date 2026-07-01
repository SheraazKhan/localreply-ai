import { Suspense } from "react"
import Link from "next/link"
import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"
import { LoginForm } from "@/app/(marketing)/login/login-form"

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back. Enter your details to continue.
          </p>
          <div className="mt-6">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-foreground underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
