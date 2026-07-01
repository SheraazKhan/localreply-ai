import { NextResponse } from "next/server"
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { env } from "@/lib/env"
import { getGoogleBusinessAuthUrl } from "@/lib/services/google-business"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const state = crypto.randomBytes(16).toString("hex")
  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/google-business/callback`
  const authUrl = getGoogleBusinessAuthUrl(redirectUri, `${state}:${session.user.id}`)

  const response = NextResponse.redirect(authUrl)
  response.cookies.set("gbp_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })

  return response
}
