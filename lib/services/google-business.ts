import { google } from "googleapis"
import { env } from "@/lib/env"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/encryption"
import { logger } from "@/lib/logger"
import type { GoogleBusinessReview, PostReplyInput } from "@/types/google-business"

const GOOGLE_BUSINESS_SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
  "openid",
  "email",
  "profile",
]

const MYBUSINESS_V4_BASE = "https://mybusiness.googleapis.com/v4"

type GoogleOAuth2Client = InstanceType<(typeof google)["auth"]["OAuth2"]>

export function getGoogleOAuthClient(redirectUri: string): GoogleOAuth2Client {
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

export interface GoogleBusinessAccountSummary {
  accountId: string
  accountName: string
}

export interface GoogleBusinessLocationSummary {
  locationId: string
  title: string
  address: string | null
}

function stripResourcePrefix(name: string, prefix: string): string {
  return name.startsWith(prefix) ? name.slice(prefix.length) : name
}

/**
 * Builds an OAuth2 client for a one-off, not-yet-persisted connection (used during the
 * connect flow, before a BusinessLocation row exists to attribute a refreshed token to).
 */
function buildTransientClient(encryptedAccessToken: string, encryptedRefreshToken: string | null): GoogleOAuth2Client {
  const client = getGoogleOAuthClient(`${env.NEXT_PUBLIC_APP_URL}/api/google-business/callback`)
  client.setCredentials({
    access_token: decrypt(encryptedAccessToken),
    refresh_token: encryptedRefreshToken ? decrypt(encryptedRefreshToken) : undefined,
  })
  return client
}

export async function listGoogleBusinessAccounts(
  encryptedAccessToken: string,
  encryptedRefreshToken: string | null
): Promise<GoogleBusinessAccountSummary[]> {
  const auth = buildTransientClient(encryptedAccessToken, encryptedRefreshToken)
  const accountManagement = google.mybusinessaccountmanagement({ version: "v1", auth })
  const response = await accountManagement.accounts.list()

  return (response.data.accounts ?? [])
    .filter((account) => account.name)
    .map((account) => ({
      accountId: stripResourcePrefix(account.name!, "accounts/"),
      accountName: account.accountName ?? "Business account",
    }))
}

export async function listGoogleBusinessLocations(
  encryptedAccessToken: string,
  encryptedRefreshToken: string | null,
  googleAccountId: string
): Promise<GoogleBusinessLocationSummary[]> {
  const auth = buildTransientClient(encryptedAccessToken, encryptedRefreshToken)
  const businessInfo = google.mybusinessbusinessinformation({ version: "v1", auth })
  const response = await businessInfo.accounts.locations.list({
    parent: `accounts/${googleAccountId}`,
    readMask: "name,title,storefrontAddress",
  })

  return (response.data.locations ?? [])
    .filter((location) => location.name)
    .map((location) => ({
      locationId: stripResourcePrefix(location.name!, "locations/"),
      title: location.title ?? "Business location",
      address: location.storefrontAddress?.addressLines?.join(", ") ?? null,
    }))
}

interface AuthorizedFetchContext {
  locationId: string
  encryptedAccessToken: string
  encryptedRefreshToken: string | null
  googleAccountId: string
  googleLocationId: string
}

/**
 * The Reviews resource lives under the legacy v4 "My Business API", which the typed
 * googleapis client no longer exposes — it must be called as a raw authenticated REST
 * request. This helper refreshes the access token first if expired (googleapis'
 * OAuth2Client does this automatically given a refresh_token) and persists any refreshed
 * token back to the owning BusinessLocation row before returning.
 */
async function authorizedFetch(context: AuthorizedFetchContext, path: string, init?: RequestInit): Promise<Response> {
  const client = buildTransientClient(context.encryptedAccessToken, context.encryptedRefreshToken)
  const accessTokenResponse = await client.getAccessToken()
  const accessToken = accessTokenResponse.token

  if (!accessToken) {
    throw new Error("Unable to obtain a valid Google access token")
  }

  const refreshedCredentials = client.credentials
  if (refreshedCredentials.access_token && refreshedCredentials.access_token !== decrypt(context.encryptedAccessToken)) {
    await prisma.businessLocation.update({
      where: { id: context.locationId },
      data: { encryptedAccessToken: encrypt(refreshedCredentials.access_token) },
    })
  }

  return fetch(`${MYBUSINESS_V4_BASE}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })
}

interface GoogleV4Review {
  reviewId: string
  reviewer?: { displayName?: string; profilePhotoUrl?: string }
  starRating?: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE"
  comment?: string
  createTime: string
}

const STAR_RATING_MAP: Record<NonNullable<GoogleV4Review["starRating"]>, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
}

export class GoogleBusinessService {
  async syncReviews(
    locationId: string,
    encryptedAccessToken: string,
    encryptedRefreshToken: string | null,
    googleAccountId: string,
    googleLocationId: string
  ): Promise<GoogleBusinessReview[]> {
    try {
      const response = await authorizedFetch(
        { locationId, encryptedAccessToken, encryptedRefreshToken, googleAccountId, googleLocationId },
        `/accounts/${googleAccountId}/locations/${googleLocationId}/reviews`
      )

      if (!response.ok) {
        throw new Error(`Google reviews API responded with ${response.status}`)
      }

      const data = (await response.json()) as { reviews?: GoogleV4Review[] }
      const reviews = data.reviews ?? []

      const synced: GoogleBusinessReview[] = []
      for (const review of reviews) {
        const rating = review.starRating ? STAR_RATING_MAP[review.starRating] : 3
        const upserted = await prisma.customerReview.upsert({
          where: { locationId_googleReviewId: { locationId, googleReviewId: review.reviewId } },
          create: {
            locationId,
            googleReviewId: review.reviewId,
            authorName: review.reviewer?.displayName ?? "Anonymous",
            authorAvatar: review.reviewer?.profilePhotoUrl ?? null,
            rating,
            reviewText: review.comment ?? "",
            reviewedAt: new Date(review.createTime),
          },
          update: {
            authorName: review.reviewer?.displayName ?? "Anonymous",
            authorAvatar: review.reviewer?.profilePhotoUrl ?? null,
            rating,
            reviewText: review.comment ?? "",
          },
        })

        synced.push({
          googleReviewId: upserted.googleReviewId,
          authorName: upserted.authorName,
          authorAvatar: upserted.authorAvatar,
          rating: upserted.rating,
          reviewText: upserted.reviewText,
          reviewedAt: upserted.reviewedAt.toISOString(),
        })
      }

      return synced
    } catch (error) {
      logger.error("Failed to sync Google Business reviews", error, { locationId })
      throw new Error("Unable to sync reviews right now. Please try again later.")
    }
  }

  async postReply(
    input: PostReplyInput & {
      encryptedAccessToken: string
      encryptedRefreshToken: string | null
      googleAccountId: string
      googleLocationId: string
    }
  ): Promise<void> {
    try {
      const response = await authorizedFetch(
        {
          locationId: input.locationId,
          encryptedAccessToken: input.encryptedAccessToken,
          encryptedRefreshToken: input.encryptedRefreshToken,
          googleAccountId: input.googleAccountId,
          googleLocationId: input.googleLocationId,
        },
        `/accounts/${input.googleAccountId}/locations/${input.googleLocationId}/reviews/${input.googleReviewId}/reply`,
        { method: "PUT", body: JSON.stringify({ comment: input.replyText }) }
      )

      if (!response.ok) {
        throw new Error(`Google reply API responded with ${response.status}`)
      }

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
