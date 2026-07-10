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

2. Copy `.env.example` to `.env` and set your Supabase anon key:

   ```bash
   cp .env.example .env
   # then edit .env and set EXPO_PUBLIC_SUPABASE_ANON_KEY
   ```

   - `EXPO_PUBLIC_SUPABASE_URL` defaults to the Spraxe project if unset.
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` is **required** — no key ships in source.
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is optional (Google button hidden unless set).

3. Start the app:

   ```bash
   npx expo start
   ```

   Then open it in Expo Go (Android/iOS) or a simulator/emulator.

## Caveats (mirrors the original app)

- **Push notifications**: The original Android app used Firebase Cloud Messaging for
  order-status pushes. In Expo Go this is stubbed out — `saveFcmToken`/`syncFcmToken` are
  no-ops. Wire up `expo-notifications` + a custom dev/production build to enable real pushes.
- **Google sign-in**: Requires a configured `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and the Google
  provider enabled in Supabase. The button is hidden until configured.
- **bKash / Nagad payments**: Verified manually by an admin (via the Spraxe Support app)
  against the Transaction ID the customer enters — there is no payment-gateway API integration.
