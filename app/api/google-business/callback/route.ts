import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import { exchangeCodeForTokens } from "@/lib/services/google-business"
import { hasLocationCapacity } from "@/lib/services/subscription"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")
  const storedState = request.cookies.get("gbp_oauth_state")?.value

  if (!code || !state || !storedState) {
    return NextResponse.redirect(new URL("/onboarding/connect-google?error=invalid_request", request.url))
  }

  const [returnedState, returnedUserId] = state.split(":")
  if (returnedState !== storedState || returnedUserId !== session.user.id) {
    return NextResponse.redirect(new URL("/onboarding/connect-google?error=state_mismatch", request.url))
  }

  try {
    if (!(await hasLocationCapacity(session.user.id))) {
      return NextResponse.redirect(new URL("/onboarding/connect-google?error=plan_limit_reached", request.url))
    }

    const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/google-business/callback`
    const tokens = await exchangeCodeForTokens(redirectUri, code)

    const response = NextResponse.redirect(new URL("/onboarding/select-location", request.url))
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 600,
      path: "/",
    }
    response.cookies.set("gbp_pending_access", tokens.encryptedAccessToken, cookieOptions)
    if (tokens.encryptedRefreshToken) {
      response.cookies.set("gbp_pending_refresh", tokens.encryptedRefreshToken, cookieOptions)
    }
    response.cookies.delete("gbp_oauth_state")

    return response
  } catch (error) {
    logger.error("Google Business OAuth callback failed", error, { userId: session.user.id })
    return NextResponse.redirect(new URL("/onboarding/connect-google?error=connection_failed", request.url))
  }
}
