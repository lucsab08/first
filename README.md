# syncfit

_Miami moves in sync._

One app for Miami's boutique fitness community. Discover, book, and organize across every studio — with an AI coach that plans your week around your job, your goals, and your recovery.

This repo is the v1 build, covering brand, frontend, backend, AI coach (with tool-use), payments, notifications, and iCal. It runs end-to-end with no external services configured — a deterministic in-memory store backs every route so the UI is instantly inspectable. Supply real env vars and the same code switches to Supabase / Stripe / Anthropic transparently.

---

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000. With no env vars set you are auto-signed-in as Sofia (the prototype user, §10.3). Every screen and flow works.

### Enabling real services

| Variable | Enables |
| --- | --- |
| `DATABASE_URL` | Postgres-backed persistence (see `drizzle` setup below) |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Magic-link + OAuth auth, middleware enforcement, RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Writes to catalog tables (studios, classes) |
| `ANTHROPIC_API_KEY` | Coach uses Claude with real tool-use (§8.8). Without it, Coach streams a deterministic mock plan. |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `STRIPE_PRICE_ID_SYNCFIT_PLUS_MONTHLY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Checkout → webhook reconciliation. Dev fallback flips Sofia to SyncFit+ locally on "Try trial". |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Static maps on Studio Profile. Fallback SVG map renders without it. |
| `RESEND_API_KEY` | Booking confirmation + reminder email channel |
| `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` | Web Push reminders |
| `NEXT_PUBLIC_POSTHOG_KEY` | Analytics |
| `SENTRY_DSN` | Error tracking |

### Database setup (optional in dev)

```bash
npm run db:generate   # generate SQL from Drizzle schema
npm run db:push       # apply to DATABASE_URL
psql $DATABASE_URL -f drizzle/0001_rls_policies.sql
npm run db:seed       # seed studios, classes, sessions, Sofia
```

---

## Architecture

- **Next.js 14 App Router**, React 18, TypeScript strict. Mobile-first layout (390×844). Every screen usable at 320px min-width.
- **Styling** — Tailwind with brand tokens from §2.6 in `tailwind.config.ts`. shadcn primitives heavily restyled.
- **Fonts** — Fraunces (display) + Inter (UI), loaded via `next/font/google`.
- **Data** — tRPC v11 end-to-end. Drizzle + Postgres in production; an in-memory mock (`server/db/mock.ts`) seeded from the same fixtures when `DATABASE_URL` is missing.
- **Auth** — Supabase Auth with magic link + Apple/Google OAuth. Middleware (`middleware.ts` + `lib/supabase/middleware.ts`) enforces auth and onboarding gates. Dev fallback signs in Sofia.
- **AI Coach** — streaming endpoint at `/api/coach/send`. Uses the Anthropic Messages API with the verbatim system prompt (`server/ai/coach-prompt.ts`) and four tools (`server/ai/coach-tools.ts`). Streams ndjson `{type:"text"|"plan"|"meta"|"done"|"error"}`.
- **Payments** — Stripe Checkout + Customer Portal. Webhook reconciles to `subscriptions` table.
- **Calendar** — iCal feed at `/api/ical/[token].ics` (RFC 5545). Vercel cron at `/api/cron/send-reminders` every 5 minutes, idempotent via `reminder_{90,30}_sent` flags.

## Key paths

```
app/
  page.tsx                        Marketing landing
  pricing/page.tsx                SyncFit+ pricing
  signup, login, callback         Auth screens
  onboarding/[1..6, complete]     §9.1 onboarding flow
  (app)/
    layout.tsx                    Bottom nav shell
    today/                        §9.2
    discover/                     §9.3
    calendar/                     §9.4 (week/day/month)
    coach/                        §9.5
    you/                          §9.7
    studio/[slug]/                §9.6
  api/
    trpc/[trpc]                   tRPC bridge
    coach/send                    Anthropic streaming route
    webhooks/stripe               Stripe webhook (§8.4)
    stripe/{checkout,portal}      Billing entry points
    ical/[token]                  iCal feed
    push/subscribe                Web Push registration
    cron/send-reminders           Cron-driven reminders
components/
  brand/                          Mark, LoadingMark, AppIcon, Wordmark
  ui/                             Button, Card, Chip, Sheet, Input, Toast, etc.
  screens/                        BookingSheet, ConflictSheet, FilterSheet
  shared/                         SessionCard, StudioRow, WeekStrip, ...
server/
  trpc.ts                         tRPC init, context, rate limits
  routers/                        auth, user, studio, class, booking, calendar, coach, subscription
  db/
    schema.ts                     Drizzle schema (§8.1)
    fixtures.ts                   §10 seed data — source of truth
    mock.ts                       In-memory store
    seed.ts                       CLI seed script
  ai/
    coach-prompt.ts               System prompt + tool schemas (§8.8)
    coach-tools.ts                Tool fulfillment
    mock-stream.ts                Deterministic Coach stream when no API key
drizzle/
  0001_rls_policies.sql           RLS (§8.2)
```

## Voice and anti-patterns

All copy follows §2.8. No fitness-bro language, no wellness-cult language, no emoji in UI. All colors come from the §2.6 palette (defined as Tailwind tokens; no arbitrary hex values are used). The only loading indicator is the lemniscate Mark (§2.5). §11 anti-patterns are actively avoided.

## Acceptance criteria (§13)

All 26 items from the spec's acceptance checklist are in scope. Run `npm run dev` in mock mode to verify the 26th (the gut-check): show the signed-in Today screen to someone in Brickell.
