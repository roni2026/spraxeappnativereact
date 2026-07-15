# Spraxe (React Native / Expo)

This is the **Spraxe** customer shopping app, rewritten from the original native Android
app (Kotlin + Jetpack Compose) into a cross-platform **React Native app built with Expo
(managed workflow) and TypeScript**. It talks to the same Supabase backend and faithfully
replicates every screen and feature of the original.

## Features

- **Splash** — settles briefly, then routes to the shop (if a session exists) or Login.
- **Auth** — Login with Phone (SMS OTP) or Email + password, plus Register (email/password/name).
  A Google sign-in button appears only when `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is configured.
- **Home** — hero banner carousel, category rail, Best Sellers, Featured Products, and a
  "Why Shop With Spraxe" feature grid.
- **Categories** — live, searchable category list.
- **Products** — search + category filter, product grid.
- **Product Detail** — images, price, quantity selector, add to cart, wishlist heart, and
  reviews (star rating, verified-purchase badge, write-a-review if you have a delivered order).
- **Cart** — server-persisted cart, quantity steppers, delivery zone (Inside/Outside Dhaka →
  ৳60/৳120), payment method (Cash on Delivery / bKash / Nagad), and checkout.
- **Account** — profile edit (name/phone/address), links to My Orders and My Wishlist, logout.
- **Orders / Order Detail** — order history and a full order breakdown with a status timeline.
- **Wishlist** — manage saved items (add to cart / remove).

Prices are shown in Bangladeshi Taka (৳). Bottom tabs: Home, Categories, Cart (with badge), Account.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set your Supabase **anon** key:

   ```bash
   cp .env.example .env
   # then edit .env and set EXPO_PUBLIC_SUPABASE_ANON_KEY
   ```

   `.env` example:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://kybgrsqqvejbvjediowo.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your anon public key>
   ```

   - `EXPO_PUBLIC_SUPABASE_URL` defaults to the Spraxe project if unset.
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` is **required** for auth/data to work.
     Use the **`anon` `public`** key from Supabase → **Project Settings → API →
     Project API keys**. Its JWT has `"role": "anon"`.
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is optional (Google button hidden unless set).

   > ⚠️ **Never use the `service_role` key here.** It bypasses Row Level Security
   > and grants full admin access to the whole database. Because `EXPO_PUBLIC_*`
   > values are baked into the app bundle, a `service_role` key in a build can be
   > extracted from the APK/IPA by anyone — a full data breach. Only the `anon`
   > key is safe to embed in a client app.

   `.env` is gitignored, so the key stays on your machine and never lands in the repo.

3. Start the app:

   ```bash
   npx expo start
   ```

   Then open it in Expo Go (Android/iOS) or a simulator/emulator.

## Building a standalone APK / IPA

`EXPO_PUBLIC_*` variables are inlined **at build time**, so the anon key must be
available to the build — otherwise the built app has no key.

> **Why this matters (fixed):** with an empty anon key, `supabase-js` throws
> `supabaseKey is required.` the moment the client module is imported, which
> previously crashed the app on launch (it would open and immediately close).
> The client now initialises safely even without a key (see `src/lib/supabase.ts`)
> and a top-level `ErrorBoundary` catches any other startup error, so the app
> always opens — but you still need a valid **anon** key for data/login to work.

- **Local build** — a root `.env` (see above) is read automatically:

  ```bash
  npx expo run:android           # dev/native build on a connected device/emulator
  # or a standalone APK:
  eas build --profile preview --local
  ```

- **EAS cloud build** — `.env` is gitignored and not uploaded, so provide the key
  either as an EAS secret (recommended) or in the build profile's `env` block:

  ```bash
  eas secret:create --scope project \
    --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <your anon public key>
  ```

  EAS injects project secrets into every build automatically. Do **not** commit
  the key into `eas.json` if this repository is public.

## Caveats (mirrors the original app)

- **Push notifications**: The original Android app used Firebase Cloud Messaging for
  order-status pushes. In Expo Go this is stubbed out — `saveFcmToken`/`syncFcmToken` are
  no-ops. Wire up `expo-notifications` + a custom dev/production build to enable real pushes.
- **Google sign-in**: Requires a configured `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and the Google
  provider enabled in Supabase. The button is hidden until configured.
- **bKash / Nagad payments**: Verified manually by an admin (via the Spraxe Support app)
  against the Transaction ID the customer enters — there is no payment-gateway API integration.

## Recent updates (parity with spraxe web)

- Cloudinary-optimized images (`EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`)
- Hierarchical categories + subcategories
- Product compare (max 4)
- Track order by order number
- Gallery image prefetch on product detail
