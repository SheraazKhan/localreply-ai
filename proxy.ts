import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PROTECTED_MATCHERS = ["/dashboard", "/billing", "/locations", "/onboarding"]

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_MATCHERS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin")
    const isSameOrigin = !origin || origin === request.nextUrl.origin
    const isWebhook = pathname.startsWith("/api/webhooks/")

    if (!isSameOrigin && !isWebhook) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.next()
  }

  if (isProtectedPath(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/billing/:path*",
    "/locations/:path*",
    "/onboarding/:path*",
    "/api/:path*",
  ],
}
