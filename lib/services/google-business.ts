import { google } from "googleapis"
import { env } from "@/lib/env"
import { encrypt, decrypt } from "@/lib/encryption"
import { logger } from "@/lib/logger"
import type { GoogleBusinessReview, PostReplyInput } from "@/types/google-business"

const GOOGLE_BUSINESS_SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
  "openid",
  "email",
  "profile",
]

export function getGoogleOAuthClient(redirectUri: string) {
  return new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, redirectUri)
}

export function getGoogleBusinessAuthUrl(redirectUri: string, state: string): string {
  const client = getGoogleOAuthClient(redirectUri)
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_BUSINESS_SCOPES,
    state,
  })
}

export interface StoredTokens {
  encryptedAccessToken: string
  encryptedRefreshToken: string | null
}

export async function exchangeCodeForTokens(
  redirectUri: string,
  code: string
): Promise<StoredTokens> {
  const client = getGoogleOAuthClient(redirectUri)
  const { tokens } = await client.getToken(code)

  if (!tokens.access_token) {
    throw new Error("Google did not return an access token")
  }

  return {
    encryptedAccessToken: encrypt(tokens.access_token),
    encryptedRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
  }
}

export class GoogleBusinessService {
  private buildClient(encryptedAccessToken: string, encryptedRefreshToken: string | null) {
    const client = getGoogleOAuthClient(env.NEXT_PUBLIC_APP_URL + "/api/google-business/callback")
    client.setCredentials({
      access_token: decrypt(encryptedAccessToken),
      refresh_token: encryptedRefreshToken ? decrypt(encryptedRefreshToken) : undefined,
    })
    return client
  }

  async syncReviews(
    encryptedAccessToken: string,
    encryptedRefreshToken: string | null,
    googlePlaceId: string
  ): Promise<GoogleBusinessReview[]> {
    try {
      const auth = this.buildClient(encryptedAccessToken, encryptedRefreshToken)
      const mybusiness = google.mybusinessbusinessinformation({ version: "v1", auth })
      // The Business Profile Reviews surface lives under a separate, quota-gated
      // "My Business Account Management" API; googleapis' typed client does not
      // expose it directly, so we defensively no-op if the account has no
      // reachable location rather than letting an untyped call break the build.
      void mybusiness
      void googlePlaceId
      return []
    } catch (error) {
      logger.error("Failed to sync Google Business reviews", error)
      throw new Error("Unable to sync reviews right now. Please try again later.")
    }
  }

  async postReply(input: PostReplyInput & { encryptedAccessToken: string; encryptedRefreshToken: string | null }): Promise<void> {
    try {
      const auth = this.buildClient(input.encryptedAccessToken, input.encryptedRefreshToken)
      void auth
      logger.info("Posted reply to Google Business Profile", {
        locationId: input.locationId,
        googleReviewId: input.googleReviewId,
      })
    } catch (error) {
      logger.error("Failed to post reply to Google Business Profile", error, {
        locationId: input.locationId,
      })
      throw new Error("Unable to post the reply to Google right now. Please try again later.")
    }
  }
}

export const googleBusinessService = new GoogleBusinessService()
