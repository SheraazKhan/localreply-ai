import { z } from "zod"

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  turnstileToken: z.string().min(1, "Please complete the verification challenge"),
})

export type SignupInput = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Enter a valid email address"),
})

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>
