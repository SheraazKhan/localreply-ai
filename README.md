# LocalReply AI

AI-powered review management for local businesses. Connect a Google Business Profile, define
local SEO keyword groups per location, and generate on-brand, context-aware replies to customer
reviews — with tone and content automatically adapted to the review's sentiment before a human
ever touches the draft.

## What it does

- **Review dashboard** — pending review count, average rating, and a live "reply rate" completion
  wheel per business location, with an inline workspace for drafting and publishing replies.
- **AI reply generation** — given a review's star rating and text, generates three distinct reply
  variations ("Professional & Direct", "Warm & Conversational", "Short & Punchy") with the tone
  and content rules branching on sentiment:
  - **Negative reviews (1–2★)**: empathetic, non-defensive language, no SEO keywords, no
    discounts/refunds offered, always closes with a private resolution-contact invitation.
  - **Neutral (3★)**: cautious, measured tone, keywords still suppressed.
  - **Positive (4–5★)**: enthusiastic tone that naturally weaves in 1–2 configured local SEO
    keywords without reading as keyword-stuffed.
- **Local SEO keyword groups** — per-location categorized keyword sets that feed the AI prompt.
- **Google Business Profile integration** — full OAuth connection flow (account/location
  discovery, encrypted token storage with automatic refresh) plus real review sync and reply
  posting against Google's Business Profile APIs. Note: Google gates production access to the
  Reviews endpoints behind a manual approval process, independent of this codebase.
- **Subscription billing** — Stripe-backed Starter/Growth tiers with a two-layer paywall (edge
  auth gate + server-side subscription-status gate) and a self-serve billing portal.
- **Auth** — email/password and Google OAuth, with rate-limited sign-in, anti-enumeration
  password reset, and CAPTCHA-protected signup.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript (strict, no `any`) |
| UI | Tailwind CSS, shadcn/ui, Lucide icons |
| Database | PostgreSQL (Neon, serverless) via Prisma ORM |
| Auth | Auth.js (NextAuth) — Credentials + Google OAuth |
| AI | Google Gemini (`@google/genai`), structured JSON output via response schemas |
| Billing | Stripe Checkout, Billing Portal, and webhooks |
| Rate limiting | Upstash Redis (sliding window) |
| Bot protection | Cloudflare Turnstile |
| Validation | Zod at every API/server-action boundary |

## Architecture notes

- **Server/client boundary**: pages and layouts are server components by default; interactivity
  (the AI workspace, tabs, forms) is isolated to a small set of client components. Data fetching
  happens in server components, server actions, and route handlers — never via client-side
  `useEffect` fetches.
- **AI provider abstraction**: the reply-generation route depends on an `AiReplyProvider`
  interface, not the concrete Gemini client — swapping providers is a one-line change.
- **Structured output, defensively parsed**: Gemini is asked for JSON via a response schema, the
  result is `zod`-validated, and a single corrective retry is attempted before failing with a
  typed, client-safe error.
- **Stripe sync via webhooks**: `checkout.session.completed`, `invoice.payment_succeeded`,
  `customer.subscription.updated`, and `customer.subscription.deleted` all upsert (not update) the
  subscription row keyed by user ID, closing the race where a webhook can arrive before any other
  write creates it.
- **Motion design**: animations follow a small, deliberate set of duration/easing tokens
  (transform/opacity only, scaled to surface size) rather than ad hoc transitions, with a global
  `prefers-reduced-motion` fallback.

## Security

- Every query touching a user-owned resource (`BusinessLocation`, `KeywordGroup`,
  `CustomerReview`) re-verifies ownership as the first check in the function body — never trusts a
  client-supplied ID alone.
- OAuth tokens are encrypted at rest with AES-256-GCM and only decrypted in memory immediately
  before an outbound API call.
- Rate limiting on auth endpoints, AI generation, and review sync; CAPTCHA on public signup;
  generic, non-leaking error messages and anti-enumeration auth flows throughout.
- Security headers (CSP, HSTS, X-Frame-Options, etc.) and same-origin CORS enforcement on all API
  routes.
- Secrets are read from a single `zod`-validated env module; API responses are explicitly shaped
  so fields like password hashes and encrypted tokens never reach the client.
