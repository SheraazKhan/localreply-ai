"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"
import { toast } from "sonner"
import { signupSchema, type SignupInput } from "@/lib/validations/auth"
import { signup } from "@/lib/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export function SignupForm({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const router = useRouter()
  const turnstileRef = useRef<TurnstileInstance>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", turnstileToken: "" },
  })

  async function onSubmit(values: SignupInput) {
    setIsSubmitting(true)
    try {
      const result = await signup(values)
      if (!result.success) {
        toast.error(result.error ?? "Unable to create account with these details")
        turnstileRef.current?.reset()
        form.setValue("turnstileToken", "")
        setIsSubmitting(false)
        return
      }

      toast.success("Account created. Please log in.")
      router.push("/login")
    } catch {
      toast.error("Unable to create account with these details")
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      {/* eslint-disable-next-line react-hooks/refs -- react-hook-form's handleSubmit reads form.control internally; this is the documented usage pattern, not a render-time ref read */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="turnstileToken"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Turnstile
                  ref={turnstileRef}
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => field.onChange(token)}
                  onExpire={() => field.onChange("")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <a href="/terms" className="underline underline-offset-4">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </a>
          .
        </p>
        <Button type="submit" disabled={isSubmitting} className="mt-2 active:scale-[0.98] transition-transform duration-100">
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </Form>
  )
}
