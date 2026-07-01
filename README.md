# LocalReply AI

AI-powered review reply management for local businesses. Connect Google Business Profile,
manage local SEO keyword groups, and generate on-brand review replies with Gemini.

## Setup (all free-tier)

1. **Neon Postgres**: create a free project at neon.tech, copy the pooled connection string into
   `DATABASE_URL` and the direct connection string into `DIRECT_URL`.
2. **NextAuth secret**: `npx auth secret` (or `openssl rand -base64 32`) → `NEXTAUTH_SECRET`.
3. **Token encryption key**: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   → `TOKEN_ENCRYPTION_KEY` (must be exactly 64 hex characters).
4. **Google Cloud**: new project → enable "Google Business Profile API" → OAuth consent screen
   (External, scopes `business.manage`/`openid`/`email`/`profile`, add yourself as a Test User) →
   OAuth Client ID (Web) → redirect URIs `http://localhost:3000/api/auth/callback/google` and
   `http://localhost:3000/api/google-business/callback` → `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`.
5. **Gemini API key**: aistudio.google.com/app/apikey → `GEMINI_API_KEY`. As of mid-2026, Google is
   mid-migration to `AQ.`-prefixed authorization keys, and freshly created keys under a project
   called "Default Gemini Project" have frequently been rejected with `401
   ACCESS_TOKEN_TYPE_UNSUPPORTED` (a known, open issue on Google's side, not this app). If that
   happens, create the key under a different imported project instead (e.g. "My First Project") —
   this has resolved it in practice. The app uses `@google/genai` (the current SDK, not the
   deprecated `@google/generative-ai`), which is required for `AQ.` keys to work at all.
6. **Stripe (test mode)**: create "Starter" ($29/mo) and "Growth" ($59/mo) recurring Products,
   copy the Price IDs into `STRIPE_PRICE_ID_*` / `NEXT_PUBLIC_STRIPE_PRICE_ID_*`. Run
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe` for `STRIPE_WEBHOOK_SECRET`.
7. **Upstash Redis**: free database at console.upstash.com → REST URL/token.
8. **Cloudflare Turnstile**: free widget for `localhost` → site key/secret key.

Copy `.env.example` to `.env.local` and fill in all values.

## Database migrations

```bash
npx prisma migrate dev --name init
npx prisma migrate dev --create-only --name add_rating_check
```

Prisma cannot express a CHECK constraint in schema syntax. After generating the `add_rating_check`
migration, hand-edit the generated `migration.sql` to add:

```sql
ALTER TABLE "customer_reviews" ADD CONSTRAINT "rating_range_check" CHECK ("rating" >= 1 AND "rating" <= 5);
```

Then run `npx prisma migrate dev` again to apply it, and seed demo data:

```bash
npx prisma db seed
```

This creates a demo user (`demo@localreply.ai` / `Demo1234!`) with an active subscription, one
business location, two keyword groups, and eight reviews spanning all ratings/statuses.

## Running locally

```bash
npm run dev
```

In a second terminal, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` whenever
testing billing flows.

## Security model notes

- All Prisma queries run from trusted server code (route handlers, server actions, server
  components) — the browser never talks to Postgres directly, so there is no client-exposed
  database role to lock down with row-level security. The equivalent risk is IDOR through our own
  API/action layer, which is why every query touching `BusinessLocation`/`KeywordGroup`/
  `CustomerReview` filters by `location.userId === session.user.id` as the first check in every
  function body — see `lib/actions/*.ts` and `app/api/reviews/**`.
- OAuth tokens for Google Business Profile are encrypted with AES-256-GCM (`lib/encryption.ts`)
  before being written to the database and are only decrypted in memory immediately before an
  outbound Google API call.
- Rate limiting (`lib/services/rate-limit.ts`, Upstash sliding window) protects credentials
  sign-in/signup (5/10min by email+IP), `/api/generate-reply` (10/min by user), and
  `/api/google-business/sync` (5/min by user).
- `lib/logger.ts` redacts secrets/tokens before logging; API routes never return
  `passwordHash`/`encryptedAccessToken`/`encryptedRefreshToken`/`stripeCustomerId` to the client.

## What is stubbed

- `lib/services/google-business.ts` implements the OAuth token exchange and encryption pipeline
  end-to-end, but `syncReviews` returns an empty array — the Business Profile "Reviews" surface
  lives under a separate, quota-gated Google API that requires manual allowlisting per project and
  isn't safely callable without a live, approved Google Cloud project. `postReply` similarly logs
  rather than making a live call. Both are wired so that swapping in the real API call later is a
  small, isolated change; the review-management UI works fully against seeded/local data in the
  meantime.
- Password-reset email delivery is not wired to a transactional email provider (out of scope for
  a $0 build) — `requestPasswordReset` in `lib/actions/auth-actions.ts` implements the full
  timing-safe, non-enumerating response behavior described in the plan, but does not actually send
  an email.
