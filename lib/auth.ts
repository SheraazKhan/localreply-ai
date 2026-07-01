import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import { loginSchema } from "@/lib/validations/auth"
import { checkRateLimit, authRateLimiter } from "@/lib/services/rate-limit"

async function getRequestIp(): Promise<string> {
  const headerList = await headers()
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
}

const GENERIC_AUTH_ERROR = "Invalid email or password"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        const { email, password } = parsed.data
        const ip = await getRequestIp()

        const rateLimitKey = `${email.toLowerCase()}:${ip}`
        const rateLimitResult = await checkRateLimit(authRateLimiter, rateLimitKey)
        if (!rateLimitResult.success) {
          logger.warn("Login rate limit exceeded", { email })
          throw new Error(GENERIC_AUTH_ERROR)
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.passwordHash) {
          return null
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash)
        if (!passwordMatches) {
          return null
        }

        return { id: user.id, name: user.name, email: user.email, image: user.image }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id
      }
      return session
    },
  },
  secret: env.NEXTAUTH_SECRET,
})
