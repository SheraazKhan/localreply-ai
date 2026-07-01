import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { env } from "@/lib/env"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { exchangeCodeForTokens } from "@/lib/services/google-business"

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
    const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/google-business/callback`
    const tokens = await exchangeCodeForTokens(redirectUri, code)

    await prisma.businessLocation.create({
      data: {
        userId: session.user.id,
        businessName: "Connected Google Business",
        encryptedAccessToken: tokens.encryptedAccessToken,
        encryptedRefreshToken: tokens.encryptedRefreshToken,
      },
    })

    return NextResponse.redirect(new URL("/locations", request.url))
  } catch (error) {
    logger.error("Google Business OAuth callback failed", error, { userId: session.user.id })
    return NextResponse.redirect(new URL("/onboarding/connect-google?error=connection_failed", request.url))
  }
}
