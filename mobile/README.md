# syncfit-mobile

React Native (Expo SDK 52) iOS build of SyncFit. Implements **v4 + v4.1 patch** — Stripe Payment Sheet + Apple Pay for class bookings, StoreKit 2 via `react-native-iap` for the SyncFit+ subscription. Lives at `mobile/` inside the same repo as the Next.js web/backend (one directory up).

---

## What works on Windows vs what needs a Mac

| Layer | Windows | Mac |
| --- | --- | --- |
| All JS — screens, navigation, brand, layout | ✅ via Expo web preview | ✅ |
| Stripe Payment Sheet UI | partial (web fallback) | ✅ full sheet |
| Apple Pay button | ❌ — iPhone-only | ✅ requires real device + Wallet card |
| StoreKit subscription sheet | ❌ — iOS-only | ✅ requires real device + sandbox tester or `.storekit` config in Xcode |
| Push notifications | ❌ | ✅ |
| App Store Connect product setup | ✅ — web console | ✅ |
| EAS Build / TestFlight upload | ✅ — runs in cloud | ✅ |

You can do every JS edit, every backend integration, and every CI / EAS setup from Windows. On-device verification of the two payment surfaces requires a Mac with Xcode and a paired iPhone.

---

## Quick start (Windows or Mac)

```bash
cd mobile                          # from the repo root
npm install --legacy-peer-deps
cp .env.example .env

# Start the metro bundler. Press `w` for the web preview which works on
# Windows; `i` opens the iOS simulator (Mac only).
npm start
```

In another terminal, start the web/backend from the repo root (`npm run dev`). The mobile app reads `EXPO_PUBLIC_API_URL` (defaults to `http://localhost:3000`) and consumes the same tRPC API that the web client uses. The `AppRouter` type is imported from `../server/routers` for end-to-end type safety.

---

## Architecture

- **Expo SDK 52, React Native 0.76, expo-router 4** — file-based routing under `app/`.
- **NativeWind v4** — Tailwind class names compile to RN style objects. Brand tokens defined in `tailwind.config.js` mirror the web v1's `tailwind.config.ts`.
- **Fonts** — Fraunces (display) + Inter (UI) via `@expo-google-fonts/*` loaded in `app/_layout.tsx`.
- **State** — React Query + tRPC v11 (`@trpc/react-query`) with the type-imported `AppRouter` from `../my-app/server/routers`. Zustand for transient UI state (filters, onboarding draft).
- **Brand** — `components/brand/{mark,loading-mark}.tsx` — asymmetric lemniscate as `react-native-svg` paths; LoadingMark animates `strokeDashoffset` via Reanimated 3.
- **Sheets / modals** — `components/ui/sheet.tsx` builds a custom Modal with Reanimated translateY + overlay opacity to match the web's iOS-ease motion.
- **Payments**:
  - Class bookings → `components/screens/booking-sheet.tsx` calls `POST /api/booking/intent` to get a Stripe `client_secret`, then `stripe.initPaymentSheet({ applePay: { merchantCountryCode: 'US' }, ... })` and `stripe.presentPaymentSheet()`. Apple Pay is the top method on iPhones with Wallet cards.
  - SyncFit+ → `lib/storekit.ts` wraps `react-native-iap`. `buySyncFitPlus()` calls `IAP.requestSubscription({ sku: 'syncfit_plus_monthly' })`, POSTs the resulting `jwsRepresentationIos` to `/api/storekit/verify`, then `IAP.finishTransaction(...)`.
  - Manage subscription → `Linking.openURL("https://apps.apple.com/account/subscriptions")` (Apple requires this off-app, per §9.7).

---

## File map

```
app/
  _layout.tsx                  Root: fonts, providers, Stack
  index.tsx                    Redirect → /(tabs)/today
  signup.tsx, login.tsx        Dev signup hits /api/dev/signup on the web app
  onboarding/                  6-step ported from web
    _layout.tsx, index.tsx
    1.tsx, 2.tsx, 3.tsx, 4.tsx, 5.tsx, 6.tsx, complete.tsx
  (tabs)/
    _layout.tsx                5-tab bottom nav (Today, Discover, Calendar, Coach, You)
    today.tsx, discover.tsx, calendar.tsx, coach.tsx, you.tsx
  studio/[slug].tsx            Full-screen modal (slide_from_bottom)

components/
  brand/{mark,loading-mark}.tsx       Lemniscate + Wordmark (react-native-svg)
  ui/{button,card,chip,input,sheet,toast,progress-ring,segmented}.tsx
  shared/{section-header,session-card,studio-row,week-strip}.tsx
  screens/{booking-sheet,conflict-sheet,filter-sheet}.tsx
  onboarding/shell.tsx
  providers.tsx                       StripeProvider + tRPC + RQ + Toast + GestureHandler

lib/
  utils.ts, constants.ts
  trpc.ts                              tRPC client (type-imports from ../my-app)
  storekit.ts                          react-native-iap wrappers + verify call
  stores/{filters,onboarding}.ts
```

---

## Setup checklist before first production iOS build

### 1. Apple Developer + App Store Connect

- Create an App ID with bundle ID `app.syncfit.ios` (or whatever you set in `app.json`).
- Enable **In-App Purchase** capability for that App ID.
- Create the app in App Store Connect.
- **Create the subscription product:**
  - Reference name: `SyncFit Plus Monthly`
  - Product ID: `syncfit_plus_monthly` (must match `SYNCFIT_PLUS_PRODUCT_ID` in `lib/constants.ts`)
  - Subscription group: `SyncFit+`
  - Duration: 1 Month, $14.99 USD
  - Add an **Introductory Offer**: 7-day free trial, eligibility = new subscribers only.
- **App Store Server API key**: App Store Connect → Users and Access → Keys → In-App Purchase → Generate. Download the `.p8` file. Store as Edge Function / server secrets:
  - `APPLE_APP_STORE_API_KEY` (full PEM contents of the .p8)
  - `APPLE_APP_STORE_KEY_ID` (e.g. `2X9R4HXF34`)
  - `APPLE_APP_STORE_ISSUER_ID` (UUID from the Keys page)
  - `APPLE_BUNDLE_ID=app.syncfit.ios`
- **App Store Server Notifications v2**: App Store Connect → App Information → set both Sandbox + Production URLs to:
  ```
  https://your-host/api/storekit/notifications
  ```

### 2. Apple Pay + Stripe

- Create an Apple Pay merchant ID matching `merchantIdentifier` in `app.json` plugins block (currently `merchant.app.syncfit`).
- Add it to your App ID's capabilities.
- Stripe dashboard → Settings → Apple Pay → upload the merchant ID + verify domain (only required for web; mobile is automatic once the merchant ID is in your provisioning profile).
- Set `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env`.
- Backend needs `STRIPE_SECRET_KEY` (already wired in `../my-app`).

### 3. Sandbox testers

- App Store Connect → Users and Access → Sandbox → Testers → add a fresh Apple ID (use a never-before-used email).
- On device: Settings → App Store → Sandbox Account → sign in with the tester.
- Now you can complete StoreKit purchases without being charged.

---

## Build commands

### Local dev (Expo Go won't work — react-native-iap and stripe-react-native need the dev client)

Mac, with Xcode:

```bash
npx expo prebuild --clean
npx expo run:ios          # builds + launches in Simulator
# OR
npx expo run:ios --device # builds and launches on connected iPhone
```

### Cloud builds (works from Windows via EAS)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios --profile development      # for dev clients
eas build --platform ios --profile preview          # TestFlight builds
eas build --platform ios --profile production       # App Store submission
```

You'll need an Apple Developer account + provisioning artifacts. EAS prompts you through this on first run.

### Submit to App Store

```bash
eas submit --platform ios
```

---

## Backend route additions (in the parent web project)

Three new routes added by this build:

| Route | Purpose |
| --- | --- |
| `app/api/booking/intent/route.ts` | POST `{sessionId}` → returns `{clientSecret, amount}` for Stripe Payment Sheet. Returns `{devSkip:true}` when no `STRIPE_SECRET_KEY` is set. |
| `app/api/storekit/verify/route.ts` | POST `{jws_representation}` → decodes JWS, calls Apple's App Store Server API for source-of-truth status, upserts `subscriptions` row. |
| `app/api/storekit/notifications/route.ts` | App Store Server Notifications v2 webhook. Decodes signed payload, maps `notificationType` → tier/status, updates the row keyed by `apple_original_transaction_id`. |

Schema additions: `subscriptions` table now has `apple_original_transaction_id`, `apple_product_id`, `expires_at`, `auto_renew_status`, `environment`, `last_verified_at`. Existing Stripe fields kept so the web SyncFit+ flow continues to work.

`server/services/apple-jws.ts` decodes JWS payloads and signs JWTs for the App Store Server API. **For production**, install `jose` and verify the JWS signature against Apple's root certs in both routes — leaving that as a flagged TODO.

---

## Acceptance criteria (v4.1 §13)

- **30a** — Apple Pay appears as the default payment method in Stripe Payment Sheet on real device with Wallet card. **Requires Mac + iPhone.**
- **30b** — StoreKit sheet shows 7-day trial + $14.99/mo terms; sandbox purchase flips `subscriptions.tier='plus'` within 5s via `/api/storekit/verify`. **Requires sandbox tester on physical device.**
- **30c** — App Store Server Notifications webhook processes `DID_RENEW`, `EXPIRED`, `REFUND` events; subscription row reflects correct `status` and `expires_at` within 5s. **Requires real Apple-issued events; testable via App Store Connect's notification test harness.**

JS-side acceptance (works on Windows): all 9 screens render, navigation preserves scroll per tab, booking flow opens (falls back to dev confirm without Stripe key), Coach paywall opens, dev signup completes onboarding.

---

## Dependencies of note

- `react-native-iap@^12` — StoreKit 2 support, the version v4.1 specified.
- `@stripe/stripe-react-native@0.41` — required peer for Expo SDK 52.
- `nativewind@^4.1` — Tailwind in RN (v3-style class names).
- `expo-router@~4` — file-based routing.
- `react-native-reanimated@~3.16` — sheet + Loading mark animations.
